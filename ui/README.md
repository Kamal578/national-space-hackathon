## Backend API connection

The UI now talks directly to the FastAPI backend (default `http://localhost:8000`).  
Optionally set a custom base URL in a `.env` file:

```
VITE_API_BASE_URL=http://localhost:8000
```

Start the backend (`uvicorn api_main:app --reload`) before running `npm run dev` so live analyses can fetch hazard features.
