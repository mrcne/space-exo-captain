# syntax=docker/dockerfile:1

FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# install dependencies first for better layer caching
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && \
    pip install -r /app/requirements.txt

COPY . /app

# expose is optional for Heroku - useful for local runs
EXPOSE 8000

# Heroku provides PORT - default for local usage
ENV PORT=8000

CMD ["/bin/sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
