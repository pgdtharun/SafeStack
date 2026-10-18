FROM python:3.11-slim

WORKDIR /app

# Ensure Python output is sent straight to terminal without buffering
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

EXPOSE 8000

# reset database on startup then launch server
CMD ["sh", "-c", "python -c 'from app.db import reset_db; reset_db()' && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
