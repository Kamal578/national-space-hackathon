FROM python:3.12-slim

# Install any system deps if needed
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your code into the image
COPY . .

# Cloud Run expects the app to listen on $PORT (defaults to 8080)
ENV PORT=8080

CMD ["uvicorn", "api_main:app", "--host", "0.0.0.0", "--port", "8080"]