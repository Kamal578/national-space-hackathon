## Backend API connection

The UI now talks directly to the FastAPI backend (default `http://localhost:8000`).  
Optionally set a custom base URL in a `.env` file:

```
VITE_API_BASE_URL=http://localhost:8000
```

Start the backend (`uvicorn api_main:app --reload`) before running `npm run dev` so live analyses can fetch hazard features.

## Custom Areas

In the dashboard you can now draw a bounding box on the map to run a “live” analysis for any region. Coordinates (degrees) and area (km²) are shown under the map; the selection is sent as `bbox` to the backend.

How the UI Works
----------------
- Tech: Vite + React + TypeScript + shadcn-ui + Leaflet.
- Data flow:
  1) User selects AOI (predefined or drawn bbox) and dates (validated; no future dates, end >= start).
  2) On “Run”, we call `/compute` with `bbox`, `start`, `end`, `firms_days` and read back `features` + `units`.
  3) `HazardCard` shows metrics with units and hover help; severity badges have tooltips.
  4) Time-series charts use generated demo history unless live history is added.
  5) PDF memo (`Download Crisis Memo`) embeds severity interpretations.

Key Screens/Components
----------------------
- `src/pages/Index.tsx`: dashboard wiring, date validation, API trigger.
- `src/components/ConfigurationPanel.tsx`: AOI selection, date pickers, hazard toggles.
- `src/components/CustomLocationSelector.tsx`: draw bbox, manual coordinate inputs, confirm selection (map stays fixed during/after selection until reset).
- `src/lib/liveDataService.ts`: calls backend `/compute`; uses `VITE_API_BASE_URL`.
- `src/components/HazardCard.tsx`: tooltips for climate terms; severity interpretations on hover.
- `src/lib/pdfGenerator.ts`: PDF report with severity interpretations.

Running Locally
---------------
```bash
cd ui
npm install
npm run dev
```
Ensure the backend is running and `VITE_API_BASE_URL` points to it.
