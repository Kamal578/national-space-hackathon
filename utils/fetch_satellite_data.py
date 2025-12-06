import os
import io
import json
import datetime
import requests
import pandas as pd
import ee
from google.oauth2 import service_account

from dotenv import load_dotenv
load_dotenv()  # before calling fetch_firms_area

# ================================================================
# 0. EARTH ENGINE INITIALIZATION (for CHIRPS)
# ================================================================

SERVICE_ACCOUNT = "earthengine-sa@hackathon-demo-480416.iam.gserviceaccount.com"

def init_ee():
    """
    Initialize Earth Engine using a service account JSON in ./keys.
    Assumes there is exactly one .json file in the keys directory.
    """
    keys_dir = os.path.join(os.path.dirname(__file__), "keys")
    key_files = [f for f in os.listdir(keys_dir) if f.endswith(".json")]
    if not key_files:
        raise RuntimeError("No .json key file found in ./keys")

    key_path = os.path.join(keys_dir, key_files[0])

    credentials = service_account.Credentials.from_service_account_file(
        key_path,
        scopes=[
            "https://www.googleapis.com/auth/earthengine",
            "https://www.googleapis.com/auth/cloud-platform",
        ],
    )
    ee.Initialize(credentials, project="hackathon-demo-480416")
    print("✅ Earth Engine initialized")


# ================================================================
# 1. NASA POWER – climate / met data for a point
# ================================================================

def fetch_nasa_power(lat, lon, start_date, end_date, parameters=None, community="AG"):
    if parameters is None:
        parameters = ["T2M", "PRECTOT", "WS10M"]  # request PRECTOT, may get PRECTOTCORR

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
    imgs_list = collection.toList(collection.size())
    n = imgs_list.size().getInfo()

    records = []
    for i in range(n):
        img = ee.Image(imgs_list.get(i))
        date_str = ee.Date(img.get("system:time_start")).format("YYYY-MM-dd").getInfo()
        # sample() with default scale ~5km; fine for CHIRPS
        val = img.sample(pt).first().get("precipitation").getInfo()
        records.append((date_str, val))

    if not records:
        return pd.DataFrame(columns=["precip_mm"])

    df = pd.DataFrame(records, columns=["date", "precip_mm"])
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").sort_index()
    return df


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
    print("NASA POWER sample:\n", df_power.head(), "\n")

    # ---- Earth Engine + CHIRPS example ----
    try:
        init_ee()
        
        df_chirps = fetch_chirps_rainfall(
            lat=40.4093,
            lon=49.8671,
            start="2022-01-01",
            end="2022-01-10",
        )
        print("CHIRPS rainfall sample:\n", df_chirps.head(), "\n")
    except Exception as e:
        print("CHIRPS/EE failed:", e)

    # ---- FIRMS example (bbox over Azerbaijan, last 3 days) ----
    # Make sure you have: export FIRMS_MAP_KEY="your_map_key_here"
    try:
        bbox_azerbaijan = (44.0, 38.5, 51.5, 42.0)
        df_fires = fetch_firms_area(bbox_azerbaijan, source="VIIRS_SNPP_NRT", day_range=3)
        print("FIRMS fire events sample:\n", df_fires.head())
    except Exception as e:
        print("FIRMS fetch failed:", e)

