"""FastAPI application entry point for IndiaInflation API."""

from __future__ import annotations

import logging
import os
from typing import Sequence

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.inflation import router as inflation_router
from api.routes.inflation_historical import router as inflation_historical_router

LOGGER = logging.getLogger("indiainflation.api")


def _load_env() -> None:
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env.prod")
    env_path = os.path.abspath(env_path)
    if os.path.exists(env_path):
        load_dotenv(env_path, override=False)


def _get_allowed_origins() -> Sequence[str]:
    origins = [
        "https://indiainflation.com",
        "https://staging.indiainflation.com",
    ]
    extra = os.getenv("CORS_ALLOW_EXTRA")
    if extra:
        origins.extend(origin.strip() for origin in extra.split(",") if origin.strip())
    return origins


_load_env()

app = FastAPI(title="IndiaInflation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(_get_allowed_origins()),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inflation_router)
app.include_router(inflation_historical_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "IndiaInflation API"}


__all__ = ["app"]
