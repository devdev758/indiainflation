# syntax=docker/dockerfile:1

FROM python:3.11-slim AS base
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

CMD ["python", "-m", "etl.fetch_mospi", "--help"]
