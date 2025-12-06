FROM python:3.12-slim

# Install system deps (if you need GDAL/GEOS later, you'd add them here)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# FastAPI on Cloud Run must listen on $PORT, default 8080
ENV PORT=8080

# For safety, don't hardcode secrets here – use env/Secrets
CMD ["uvicorn", "api_main:app", "--host", "0.0.0.0", "--port", "8080"]