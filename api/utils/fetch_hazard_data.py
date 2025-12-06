from dotenv import load_dotenv
from typing import Dict, Any, List, Optional, Tuple
import os
import io
import datetime
import requests
import pandas as pd
import ee
from google.oauth2 import service_account
import logging
import json

logging.basicConfig(level=logging.INFO)

load_dotenv()  # before calling fetch_firms_area

# ================================================================
# 0. EARTH ENGINE INITIALIZATION (for CHIRPS)
# ================================================================

SERVICE_ACCOUNT = "earthengine-sa@hackathon-demo-480416.iam.gserviceaccount.com"

FEATURE_UNITS: Dict[str, Dict[str, str]] = {
    "climate": {
        "t2m_mean": "degC",
        "t2m_max": "degC",
        "precip_sum": "mm",
        "wind_mean": "m/s",
    },
    "drought": {
        "chirps_precip_sum": "mm",
        "chirps_precip_mean": "mm/day",
    },
    "fire": {
        "fires_count": "count",
        "fires_mean_brightness": "Kelvin",
        "fires_mean_frp": "MW",
    },
}

SERVICE_ACCOUNT_PROJECT = "hackathon-demo-480416"


def init_ee():
    """
    Initialize Earth Engine.

    Priority:
    1) If EE_JSON env var is set (Cloud Run), parse it as service account JSON.
    2) Else, if EE_KEY_PATH env var is set, load JSON from that file.
    3) Else, fall back to ./utils/keys or ./keys for local development.
    """
    # 1) Cloud Run: EE_JSON secret as env var
    ee_json = os.environ.get("EE_JSON")
    if ee_json:
        print("Using EE_JSON from environment to initialize Earth Engine")
        info = json.loads(ee_json)
        credentials = service_account.Credentials.from_service_account_info(
            info,
            scopes=[
                "https://www.googleapis.com/auth/earthengine",
                "https://www.googleapis.com/auth/cloud-platform",
            ],
        )
        ee.Initialize(credentials, project=SERVICE_ACCOUNT_PROJECT)
        print("✅ Earth Engine initialized from EE_JSON env")
        return

    # 2) Cloud Run or local: EE_KEY_PATH file path
    key_path = os.environ.get("EE_KEY_PATH")
    if key_path:
        print(f"Using EE_KEY_PATH file to initialize Earth Engine: {key_path}")
        credentials = service_account.Credentials.from_service_account_file(
            key_path,
            scopes=[
                "https://www.googleapis.com/auth/earthengine",
                "https://www.googleapis.com/auth/cloud-platform",
            ],
        )
        ee.Initialize(credentials, project=SERVICE_ACCOUNT_PROJECT)
        print("✅ Earth Engine initialized from EE_KEY_PATH")
        return

    # 3) Local dev fallbacks: ./utils/keys or ./keys
    print("EE_JSON and EE_KEY_PATH not set, trying local keys directory")
    base_dir = os.path.dirname(__file__)
    candidate_dirs = [
        os.path.join(base_dir, "utils", "keys"),
        os.path.join(base_dir, "keys"),
    ]

    for d in candidate_dirs:
        if os.path.isdir(d):
            key_files = [f for f in os.listdir(d) if f.endswith(".json")]
            if key_files:
                key_path = os.path.join(d, key_files[0])
                print(f"Found local key file: {key_path}")
                credentials = service_account.Credentials.from_service_account_file(
                    key_path,
                    scopes=[
                        "https://www.googleapis.com/auth/earthengine",
                        "https://www.googleapis.com/auth/cloud-platform",
                    ],
                )
                ee.Initialize(credentials, project=SERVICE_ACCOUNT_PROJECT)
                print("✅ Earth Engine initialized from local file")
                return

    raise RuntimeError(
        "Could not find Earth Engine credentials (EE_JSON, EE_KEY_PATH, or local key file).")

# ================================================================
# 1. NASA POWER – climate / met data for a point
# ================================================================


def fetch_nasa_power(lat, lon, start_date, end_date, parameters=None, community="AG"):
    if parameters is None:
        # request PRECTOT, may get PRECTOTCORR
        parameters = ["T2M", "PRECTOT", "WS10M"]

    base_url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start": start_date,
        "end": end_date,
        "parameters": ",".join(parameters),
        "community": community,
        "format": "JSON",
    }

    resp = requests.get(base_url, params=params)
    resp.raise_for_status()
    data = resp.json()

    df = pd.DataFrame(data["properties"]["parameter"])
    df.index = pd.to_datetime(df.index, format="%Y%m%d")

    # ---------- normalize precip column name ----------
    if "PRECTOT" in df.columns:
        precip_col = "PRECTOT"
    elif "PRECTOTCORR" in df.columns:
        precip_col = "PRECTOTCORR"
    else:
        precip_col = None

    if precip_col and precip_col != "PRECTOT":
        # create a unified PRECTOT alias
        df["PRECTOT"] = df[precip_col]

    return df

# ================================================================
# 2. CHIRPS via Earth Engine – rainfall for a point
# ================================================================


def fetch_chirps_rainfall(lat, lon, start, end):
    """
    Fetch daily precipitation (mm/day) for a point using CHIRPS via Earth Engine.

    start, end : 'YYYY-MM-DD'
    Returns a pandas DataFrame with index=date, column=precip_mm.
    """
    pt = ee.Geometry.Point([lon, lat])
    collection = (
        ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
        .filterDate(start, end)
        .select("precipitation")
    )

    # Convert each image to (date, precip) and pull to client.
    size = collection.size().getInfo()
    if size is None or size <= 0:
        # No imagery in this date range; return empty frame
        return pd.DataFrame(columns=["precip_mm"])

    imgs_list = collection.toList(size)
    n = size

    records = []
    for i in range(n):
        img = ee.Image(imgs_list.get(i))
        date_str = ee.Date(img.get("system:time_start")
                           ).format("YYYY-MM-dd").getInfo()
        # sample() with default scale ~5km; fine for CHIRPS
        val = img.sample(pt).first().get("precipitation").getInfo()
        records.append((date_str, val))

    if not records:
        return pd.DataFrame(columns=["precip_mm"])

    df = pd.DataFrame(records, columns=["date", "precip_mm"])
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").sort_index()
    return df


def _safe_sum(series) -> float:
    if series is None or len(series) == 0:
        return 0.0
    val = float(series.sum())
    if pd.isna(val):
        return 0.0
    return val


def _safe_mean(series) -> float:
    if series is None or len(series) == 0:
        return 0.0
    val = float(series.mean())
    if pd.isna(val):
        return 0.0
    return val


# ================================================================
# 3. FIRMS – fire hotspots via official API (needs MAP_KEY)
# ================================================================

def fetch_firms_area(bbox, source="VIIRS_SNPP_NRT", day_range=7):
    """
    Fetch FIRMS fire hotspots for an area and time window.

    bbox      : (west, south, east, north)
    source    : dataset id, e.g. 'VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT', 'MODIS_NRT'
    day_range : number of days back from 'now' (max depends on dataset; usually <= 7 for NRT)

    Requires env var FIRMS_MAP_KEY to be set.
    Returns a pandas DataFrame.
    """
    map_key = os.environ.get("FIRMS_MAP_KEY")
    if not map_key:
        raise RuntimeError("Set FIRMS_MAP_KEY env var to your FIRMS MAP_KEY")

    west, south, east, north = bbox
    area_coord = f"{west},{south},{east},{north}"

    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{map_key}/{source}/{area_coord}/{day_range}"

    resp = requests.get(url)
    resp.raise_for_status()

    df = pd.read_csv(io.StringIO(resp.text))
    return df


def fetch_firms_country(country_code="AZE", source="VIIRS_SNPP_NRT", day_range=7):
    """
    Alternative: fetch by country code instead of bbox.

    country_code : 3-letter ISO code (e.g. 'AZE' for Azerbaijan)
    """
    map_key = os.environ.get("FIRMS_MAP_KEY")
    if not map_key:
        raise RuntimeError("Set FIRMS_MAP_KEY env var to your FIRMS MAP_KEY")

    url = f"https://firms.modaps.eosdis.nasa.gov/api/country/csv/{map_key}/{source}/{country_code}/{day_range}"
    resp = requests.get(url)
    resp.raise_for_status()
    df = pd.read_csv(io.StringIO(resp.text))
    return df


# ================================================================
# 4. EXAMPLE USAGE
# ================================================================

if __name__ == "__main__":
    # ---- NASA POWER example ----
    df_power = fetch_nasa_power(
        lat=40.4093,
        lon=49.8671,
        start_date="20220101",
        end_date="20220110",
        parameters=["T2M", "PRECTOT", "WS10M"],
        community="AG",
    )
    logging.info("NASA POWER sample:\n%s\n", df_power.head())

    # ---- Earth Engine + CHIRPS example ----
    try:
        init_ee()

        df_chirps = fetch_chirps_rainfall(
            lat=40.4093,
            lon=49.8671,
            start="2022-01-01",
            end="2022-01-10",
        )
        logging.info("CHIRPS rainfall sample:\n", df_chirps.head(), "\n")
    except Exception as e:
        logging.info("CHIRPS/EE failed:", e)

    # ---- FIRMS example (bbox over Azerbaijan, last 3 days) ----
    # Make sure you have: export FIRMS_MAP_KEY="your_map_key_here"
    try:
        bbox_azerbaijan = (44.0, 38.5, 51.5, 42.0)
        df_fires = fetch_firms_area(
            bbox_azerbaijan, source="VIIRS_SNPP_NRT", day_range=3)
        logging.info("FIRMS fire events sample:\n", df_fires.head())
    except Exception as e:
        logging.info("FIRMS fetch failed:", e)


def build_hazard_features(
    lat: float,
    lon: float,
    start: str,
    end: str,
    bbox=None,
    firms_days: int = 7,
) -> Dict[str, Any]:
    """
    Build a simple hazard feature dict for one location (and optional bbox for fires).

    start/end  : 'YYYY-MM-DD'
    firms_days : how many days back to look for fires
    """
    # ---- NASA POWER (climate) ----
    # convert dates to YYYYMMDD
    start_power = start.replace("-", "")
    end_power = end.replace("-", "")
    df_power = fetch_nasa_power(
        lat=lat,
        lon=lon,
        start_date=start_power,
        end_date=end_power,
        parameters=["T2M", "PRECTOT", "WS10M"],
        community="AG",
    )

    # simple climate summaries with safe handling of empty frames
    climate = {
        "t2m_mean": _safe_mean(df_power["T2M"]) if "T2M" in df_power else 0.0,
        "t2m_max": float(df_power["T2M"].max()) if "T2M" in df_power and not df_power["T2M"].empty else 0.0,
        "precip_sum": _safe_sum(df_power["PRECTOT"]) if "PRECTOT" in df_power else 0.0,
        "wind_mean": _safe_mean(df_power["WS10M"]) if "WS10M" in df_power else 0.0,
    }

    # ---- CHIRPS (rainfall) ----
    df_chirps = fetch_chirps_rainfall(lat, lon, start, end)
    drought = {
        "chirps_precip_sum": _safe_sum(df_chirps["precip_mm"]) if "precip_mm" in df_chirps else 0.0,
        "chirps_precip_mean": _safe_mean(df_chirps["precip_mm"]) if "precip_mm" in df_chirps else 0.0,
    }

    # ---- FIRMS (fires) ----
    fire_stats = {}
    if bbox is not None:
        df_fires = fetch_firms_area(
            bbox, source="VIIRS_SNPP_NRT", day_range=firms_days)
        fire_stats = {
            "fires_count": int(len(df_fires)),
            "fires_mean_brightness": float(df_fires["bright_ti4"].mean()) if len(df_fires) else 0.0,
            "fires_mean_frp": float(df_fires["frp"].mean()) if len(df_fires) else 0.0,
        }

    return {
        "climate": climate,
        "drought": drought,
        "fire": fire_stats,
    }


def dataframe_to_timeseries(df: pd.DataFrame, value_columns: List[str]) -> List[Dict[str, Any]]:
    """
    Convert a pandas DataFrame with datetime index into a list of dicts
    with ISO dates and specified columns.
    """
    if df.empty:
        return []
    records: List[Dict[str, Any]] = []
    for idx, row in df.iterrows():
        entry: Dict[str, Any] = {"date": idx.strftime("%Y-%m-%d")}
        for col in value_columns:
            entry[col] = row[col] if col in row else None
        records.append(entry)
    return records
