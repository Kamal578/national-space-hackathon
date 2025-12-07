# SPARKS.lab - Hazard Analytics Platform

End-to-end prototype for multi-hazard analytics combining a FastAPI backend with a React (Vite + TypeScript) frontend. The system ingests Earth observation and open data sources to produce quick flood, fire, and drought snapshots for a user-defined area of interest (AOI).

## Repo Structure
- `api/` – FastAPI service
  - `api_main.py` routes: `/compute` (alias `/hazards/compute`), `/hazards/raw`, `/locations/preview`, `/units`, `/health`
  - `utils/fetch_hazard_data.py` data fetchers (NASA POWER, CHIRPS via Earth Engine, FIRMS), units map, helpers
  - `README_auth.md` Earth Engine service account setup; `README.md` backend usage/docs
- `ui/` – Frontend (Vite + React + TypeScript + shadcn-ui + Leaflet)
  - Custom AOI selection (draw bbox or enter coordinates) with validation
  - Date pickers with validation (no future dates, end ≥ start)
  - Hazard dashboard with tooltips for climate terms and severity interpretations; PDF export
  - `README.md` frontend usage/docs

## What It Does
- Users pick or draw an AOI (bbox) and date range.
- Backend fetches:
  - Climate: NASA POWER (temperature, precipitation, wind)
  - Drought proxy: CHIRPS rainfall via Google Earth Engine
  - Fire: NASA FIRMS active fire detections
- Frontend displays hazard summaries, map overlays, time-series (demo), and can export a PDF memo with severity interpretations.

## Quickstart
1. **Backend**
   - Add Earth Engine service account JSON to `api/utils/keys/` (see `api/README_auth.md`).
   - Set FIRMS MAP_KEY: `export FIRMS_MAP_KEY="your_map_key"`.
   - Install deps: `cd api && pip install -r requirements.txt`.
   - Run: `uvicorn api_main:app --reload`.
2. **Frontend**
   - `cd ui && npm install`.
   - (Optional) set `VITE_API_BASE_URL` in `ui/.env` (default `http://localhost:8000`).
   - Run: `npm run dev`.

Live Deployments
----------------
- Backend (OpenAPI): https://hazard-api-562229553414.europe-central2.run.app/docs
- Frontend: https://aardvark-national-space-hackathon.alwaysdata.net/

## Key Endpoints (backend)
- `POST /compute` (alias `/hazards/compute`, legacy `/hazard-features`): `{ bbox, start, end, firms_days }` → hazard features + units.
- `POST /hazards/raw`: raw daily series from POWER/CHIRPS/FIRMS.
- `POST /locations/preview`: normalize bbox/point/polygon, return centroid, bbox, area.
- `GET /units`: units map for all metrics.
- `GET /health`: liveness.

## Frontend Highlights
- AOI drawing with “Select Area” → drag rectangle → “Confirm Area”; manual coordinate entry keeps map/aoi in sync.
- Fixed map during selection/after confirmation (no auto pan/zoom until reset).
- Date pickers enforce valid ranges; errors shown inline.
- Tooltips explain climate terms (NDVI anomaly, rainfall deficit, etc.); severity badges show per-hazard interpretations.
- PDF export includes severity interpretations.

## Notes
- Coordinate order for bbox is `[west, south, east, north]` (lon/lat, EPSG:4326).
- Backend returns units alongside metrics; frontend renders them.
- Empty data ranges return zeroed metrics instead of EE errors.
