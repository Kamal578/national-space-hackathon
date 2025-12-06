from typing import Dict, Any
import json
from utils.fetch_satellite_data import init_ee, fetch_chirps_rainfall, fetch_firms_area, fetch_nasa_power

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

    # simple climate summaries
    climate = {
        "t2m_mean": float(df_power["T2M"].mean()),
        "t2m_max": float(df_power["T2M"].max()),
        "precip_sum": float(df_power["PRECTOT"].sum()),
        "wind_mean": float(df_power["WS10M"].mean()),
    }

    # ---- CHIRPS (rainfall) ----
    df_chirps = fetch_chirps_rainfall(lat, lon, start, end)
    drought = {
        "chirps_precip_sum": float(df_chirps["precip_mm"].sum()),
        "chirps_precip_mean": float(df_chirps["precip_mm"].mean()),
    }

    # ---- FIRMS (fires) ----
    fire_stats = {}
    if bbox is not None:
        df_fires = fetch_firms_area(bbox, source="VIIRS_SNPP_NRT", day_range=firms_days)
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


# Example usage
if __name__ == "__main__":
    init_ee()  # make sure EE is ready

    bbox_azerbaijan = (44.0, 38.5, 51.5, 42.0)
    features = build_hazard_features(
        lat=40.4093,
        lon=49.8671,
        start="2022-01-01",
        end="2022-01-10",
        bbox=bbox_azerbaijan,
        firms_days=7,
    )
    print(json.dumps(features, indent=2))
