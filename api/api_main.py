# api_main.py

# run with uvicorn api_main:app --reload

from datetime import date
from typing import List, Optional, Tuple, Dict, Any
import math
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, model_validator

from utils.fetch_hazard_data import (
    init_ee,
    build_hazard_features,
    fetch_nasa_power,
    fetch_chirps_rainfall,
    fetch_firms_area,
    FEATURE_UNITS,
    dataframe_to_timeseries,
)

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Hazard Analytics API",
    description="EO-based hazard features for insurance / risk analytics",
    version="0.1.0",
)

# ---------- CORS  ----------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in prod, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Startup: initialize Earth Engine once ----------

@app.on_event("startup")
async def startup_event():
    try:
        init_ee()
    except Exception as e:
        # Log and fail loudly; you can also set a flag instead.
        logging.error("Failed to initialize Earth Engine: %s", e)


# ---------- Pydantic models ----------

class LocationPayload(BaseModel):
    """
    Accepts one of: bbox, point, polygon. Validates that exactly one is provided.
    """

    bbox: Optional[List[float]] = Field(
        None, description="Bounding box [west, south, east, north]"
    )
    point: Optional[List[float]] = Field(
        None, description="Point [lat, lon] to analyze"
    )
    polygon: Optional[List[List[float]]] = Field(
        None, description="Polygon coordinates [[lon, lat], ...]"
    )

    @model_validator(mode="after")
    def check_one_location(self):
        provided = [self.bbox, self.point, self.polygon]
        if sum(val is not None for val in provided) != 1:
            raise ValueError("Provide exactly one of bbox, point, or polygon")
        return self

    @field_validator("bbox")
    @classmethod
    def validate_bbox(cls, value: Optional[List[float]]):
        if value is None:
            return value
        if len(value) != 4:
            raise ValueError("bbox must be [west, south, east, north]")
        west, south, east, north = value
        if west >= east or south >= north:
            raise ValueError("bbox coordinates invalid (west>=east or south>=north)")
        return value

    @field_validator("point")
    @classmethod
    def validate_point(cls, value: Optional[List[float]]):
        if value is None:
            return value
        if len(value) != 2:
            raise ValueError("point must be [lat, lon]")
        lat, lon = value
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise ValueError("point outside valid lat/lon range")
        return value

    @field_validator("polygon")
    @classmethod
    def validate_polygon(cls, value: Optional[List[List[float]]]):
        if value is None:
            return value
        if len(value) < 3:
            raise ValueError("polygon must have at least 3 vertices")
        for coord in value:
            if len(coord) != 2:
                raise ValueError("polygon coordinates must be [lon, lat]")
            lon, lat = coord
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                raise ValueError("polygon vertex outside lat/lon range")
        return value


class HazardComputeRequest(LocationPayload):
    start: date = Field(..., description="Start date (YYYY-MM-DD)")
    end: date = Field(..., description="End date (YYYY-MM-DD)")
    firms_days: int = Field(
        7, ge=1, le=365, description="Lookback window for fires (days)"
    )


class HazardFeatureGroups(BaseModel):
    climate: Dict[str, Any]
    drought: Dict[str, Any]
    fire: Dict[str, Any]


class HazardComputeResponse(BaseModel):
    lat: float
    lon: float
    bbox: Optional[List[float]]
    start: date
    end: date
    features: HazardFeatureGroups
    units: Dict[str, Dict[str, str]]
    source: str = Field(
        "NASA POWER, CHIRPS via GEE, FIRMS", description="Data sources used"
    )


class RawTimeseriesResponse(BaseModel):
    climate_timeseries: List[Dict[str, Any]]
    rainfall_timeseries: List[Dict[str, Any]]
    fires: List[Dict[str, Any]]
    units: Dict[str, Dict[str, str]]


class LocationPreviewResponse(BaseModel):
    centroid: Dict[str, float]
    bbox: List[float]
    area_km2: float
    message: str = "Normalized location payload"


# ---------- Helper functions ----------

def bbox_area_km2(bbox: Tuple[float, float, float, float]) -> float:
    west, south, east, north = bbox
    mean_lat = (south + north) / 2
    width_km = (east - west) * 111.32 * math.cos(math.radians(mean_lat))
    height_km = (north - south) * 110.57
    return max(width_km * height_km, 0)


def polygon_bbox(coords: List[List[float]]) -> Tuple[float, float, float, float]:
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    return (min(lons), min(lats), max(lons), max(lats))


def polygon_centroid(coords: List[List[float]]) -> Tuple[float, float]:
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    return (sum(lons) / len(lons), sum(lats) / len(lats))


def normalize_location(payload: LocationPayload) -> Dict[str, Any]:
    """
    Convert any accepted location payload into a centroid + bbox representation.
    """
    if payload.point:
        lat, lon = payload.point
        bbox = (lon - 0.1, lat - 0.1, lon + 0.1, lat + 0.1)
    elif payload.bbox:
        west, south, east, north = payload.bbox
        lat = (south + north) / 2
        lon = (west + east) / 2
        bbox = (west, south, east, north)
    elif payload.polygon:
        bbox = polygon_bbox(payload.polygon)
        lon, lat = polygon_centroid(payload.polygon)
    else:
        raise HTTPException(status_code=400, detail="No location provided")

    area = bbox_area_km2(bbox)
    return {
        "lat": lat,
        "lon": lon,
        "bbox": list(bbox),
        "area_km2": area,
    }


# ---------- Routes ----------

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/units")
async def units():
    """Return metric units for all hazard feature fields."""
    return FEATURE_UNITS


@app.post("/locations/preview", response_model=LocationPreviewResponse)
async def location_preview(payload: LocationPayload):
    normalized = normalize_location(payload)
    return {
        "centroid": {"lat": normalized["lat"], "lon": normalized["lon"]},
        "bbox": normalized["bbox"],
        "area_km2": normalized["area_km2"],
        "message": "Normalized location payload",
    }


@app.post("/hazards/compute", response_model=HazardComputeResponse)
async def hazards_compute(req: HazardComputeRequest):
    normalized = normalize_location(req)
    bbox_tuple: Tuple[float, float, float, float] = tuple(normalized["bbox"])  # type: ignore

    try:
        features = build_hazard_features(
            lat=normalized["lat"],
            lon=normalized["lon"],
            start=req.start.isoformat(),
            end=req.end.isoformat(),
            bbox=bbox_tuple,
            firms_days=req.firms_days,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building hazard features: {e}")

    return {
        "lat": normalized["lat"],
        "lon": normalized["lon"],
        "bbox": list(bbox_tuple),
        "start": req.start,
        "end": req.end,
        "features": features,
        "units": FEATURE_UNITS,
    }


@app.post("/hazards/raw", response_model=RawTimeseriesResponse)
async def hazards_raw(req: HazardComputeRequest):
    normalized = normalize_location(req)
    bbox_tuple: Tuple[float, float, float, float] = tuple(normalized["bbox"])  # type: ignore

    start_power = req.start.isoformat().replace("-", "")
    end_power = req.end.isoformat().replace("-", "")

    try:
        df_power = fetch_nasa_power(
            lat=normalized["lat"],
            lon=normalized["lon"],
            start_date=start_power,
            end_date=end_power,
        )
        df_chirps = fetch_chirps_rainfall(
            lat=normalized["lat"],
            lon=normalized["lon"],
            start=req.start.isoformat(),
            end=req.end.isoformat(),
        )
        df_fires = fetch_firms_area(
            bbox_tuple, source="VIIRS_SNPP_NRT", day_range=req.firms_days
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching raw hazard data: {e}")

    climate_series = dataframe_to_timeseries(df_power, ["T2M", "PRECTOT", "WS10M"])
    rainfall_series = dataframe_to_timeseries(df_chirps, ["precip_mm"])
    fires_records = df_fires.to_dict(orient="records")

    return {
        "climate_timeseries": climate_series,
        "rainfall_timeseries": rainfall_series,
        "fires": fires_records,
        "units": {
            **FEATURE_UNITS,
            "raw": {
                "T2M": "degC",
                "PRECTOT": "mm/day",
                "WS10M": "m/s",
                "precip_mm": "mm/day",
            },
        },
    }


@app.post("/hazard-features", response_model=HazardComputeResponse)
async def hazard_features_legacy(req: HazardComputeRequest):
    """
    Backwards-compatible alias to /hazards/compute.
    """
    return await hazards_compute(req)


@app.post("/compute", response_model=HazardComputeResponse)
async def compute_alias(req: HazardComputeRequest):
    """
    Short alias used by the UI; identical to /hazards/compute.
    """
    return await hazards_compute(req)
