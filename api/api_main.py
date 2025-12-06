# api_main.py

# run with uvicorn api_main:app --reload

from datetime import date
from typing import List, Optional, Tuple

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from utils.fetch_hazard_data import init_ee, build_hazard_features

import logging

# Initialize logging

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

class HazardRequest(BaseModel):
    lat: float = Field(..., description="Latitude of the location")
    lon: float = Field(..., description="Longitude of the location")
    start: date = Field(..., description="Start date (YYYY-MM-DD)")
    end: date = Field(..., description="End date (YYYY-MM-DD)")
    firms_days: int = Field(7, ge=1, le=365, description="Lookback window for fires (days)")
    bbox: Optional[List[float]] = Field(
        None,
        description="Optional bbox [west, south, east, north] for FIRMS aggregation",
    )


class HazardResponse(BaseModel):
    lat: float
    lon: float
    start: date
    end: date
    features: dict


# ---------- Routes ----------

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/hazard-features", response_model=HazardResponse)
async def hazard_features(req: HazardRequest):
    # Prepare bbox tuple if provided
    bbox_tuple: Optional[Tuple[float, float, float, float]] = None
    if req.bbox is not None:
        if len(req.bbox) != 4:
            raise HTTPException(status_code=400, detail="bbox must be [west, south, east, north]")
        bbox_tuple = tuple(req.bbox)  # type: ignore

    try:
        features = build_hazard_features(
            lat=req.lat,
            lon=req.lon,
            start=req.start.isoformat(),
            end=req.end.isoformat(),
            bbox=bbox_tuple,
            firms_days=req.firms_days,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building hazard features: {e}")

    return HazardResponse(
        lat=req.lat,
        lon=req.lon,
        start=req.start,
        end=req.end,
        features=features,
    )
