# Multi-stage Dockerfile for Hugging Face Spaces.
#
# Stage 1: build the React frontend with Node (just for the build, not runtime)
# Stage 2: Python image with Flask + YOLO that serves the API AND the built frontend
#
# Net result: one container, one URL, no CORS.
#
# HF Spaces requires the app to listen on port 7860.

# ========== Stage 1: Build the frontend ==========
FROM node:20-slim AS frontend-build

WORKDIR /build

# Copy package files first so npm install caches well between deploys
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --silent

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build
# At this point /build/dist contains the production frontend


# ========== Stage 2: Python backend (final image) ==========
FROM python:3.11-slim

# System deps required by opencv-python (Ultralytics dep)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Non-root user (HF Spaces best practice)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Install Python deps (separate layer for caching)
COPY --chown=user backend/requirements.txt backend/requirements-ml.txt ./
RUN pip install --no-cache-dir --user --upgrade pip && \
    pip install --no-cache-dir --user -r requirements.txt && \
    pip install --no-cache-dir --user -r requirements-ml.txt

# Copy the backend code
COPY --chown=user backend/ ./

# Copy the BUILT frontend from stage 1 into ./static (Flask will serve from here)
COPY --chown=user --from=frontend-build /build/dist ./static

# HF Spaces persistent volume is at /data — store DB + uploads there
ENV DATA_DIR=/data
ENV STATIC_DIR=/app/static
ENV PORT=7860

EXPOSE 7860

CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:7860", "--workers", "1", "--timeout", "120"]
