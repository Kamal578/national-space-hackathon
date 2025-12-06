Hazard Analytics API
====================

FastAPI service that builds lightweight hazard features (climate, drought, fire) for a point using public EO sources:

- NASA POWER for daily temperature, precipitation, and wind
- CHIRPS via Google Earth Engine for rainfall accumulation
- NASA FIRMS for active fire detections

Repository Layout
-----------------
- `api_main.py` – FastAPI app exposing `/health`, `/hazards/compute`, `/hazards/raw`, `/locations/preview`, `/units`
- `utils/fetch_hazard_data.py` – data fetchers, units map, and `build_hazard_features`
- `test_usage.py` – simple script that runs the feature builder locally
- `utils/keys/` – place your Earth Engine service account JSON key here (see `README_auth.md`)
- `README_auth.md` – step-by-step Earth Engine service account setup guide

Prerequisites
-------------
- Python 3.10+ recommended
- Install dependencies (create a virtualenv first if you like):

```bash
pip install fastapi uvicorn requests pandas python-dotenv google-auth earthengine-api pydantic
```

Credentials and Environment
---------------------------
1) Google Earth Engine service account key  
   - Follow `README_auth.md` to create a service account and JSON key.  
   - Place the JSON file in `utils/keys/` (the code picks the first `.json` it finds).  
   - Do **not** commit the key.

2) FIRMS MAP_KEY  
   - Required for fire data. Obtain from https://firms.modaps.eosdis.nasa.gov/ and set:

```bash
export FIRMS_MAP_KEY="your_map_key"
```

You can also create a `.env` file in the repo root with `FIRMS_MAP_KEY=...`; `python-dotenv` loads it automatically.

Running the API
---------------
Initialize Earth Engine and start the server:

```bash
uvicorn api_main:app --reload
```

Endpoints
---------
- `GET /health` – basic liveness check  
- `GET /units` – returns the units for each metric (degC, mm/day, count, etc.)
- `POST /locations/preview` – normalize a location payload (one of `bbox`, `point`, `polygon`) and return centroid + bbox + approximate area in km²  
  Example body:
  ```json
  { "bbox": [44.0, 38.5, 51.5, 42.0] }
  ```
- `POST /hazards/compute` – main endpoint the frontend uses (same shape also available at `/hazard-features`)  
  Body:
  ```json
  {
    "bbox": [44.0, 38.5, 51.5, 42.0],
    "start": "2022-01-01",
    "end": "2022-01-10",
    "firms_days": 7
  }
  ```
  Response (abridged):
  ```json
  {
    "lat": 40.25,
    "lon": 47.75,
    "bbox": [44, 38.5, 51.5, 42],
    "start": "2022-01-01",
    "end": "2022-01-10",
    "features": {
      "climate": { "t2m_mean": 14.2, "t2m_max": 18.5, "precip_sum": 23.1, "wind_mean": 3.5 },
      "drought": { "chirps_precip_sum": 18.6, "chirps_precip_mean": 1.86 },
      "fire": { "fires_count": 12, "fires_mean_brightness": 345.2, "fires_mean_frp": 6.3 }
    },
    "units": {
      "climate": { "t2m_mean": "degC", "t2m_max": "degC", "precip_sum": "mm", "wind_mean": "m/s" },
      "drought": { "chirps_precip_sum": "mm", "chirps_precip_mean": "mm/day" },
      "fire": { "fires_count": "count", "fires_mean_brightness": "Kelvin", "fires_mean_frp": "MW" }
    }
  }
  ```
- `POST /hazards/raw` – returns daily time series from NASA POWER, CHIRPS, and raw FIRMS rows for the provided location and date window.

OpenAPI docs are served automatically at `/docs` and `/redoc`.

Local Script Usage
------------------
To quickly test the feature builder without the API:

```bash
python test_usage.py
```

What the Features Contain
-------------------------
- `climate` – mean/max temperature, total precipitation, mean wind from NASA POWER
- `drought` – CHIRPS rainfall totals and mean over the window
- `fire` – FIRMS counts and basic stats over the provided bbox and `firms_days` window

Notes
-----
- CORS is fully open for hackathon prototyping; restrict `allow_origins` in `api_main.py` for production.
- `build_hazard_features` requires Earth Engine initialization; the FastAPI startup hook calls `init_ee()`.
- If CHIRPS or FIRMS access fails, check that the service account has Earth Engine access and that `FIRMS_MAP_KEY` is set.
