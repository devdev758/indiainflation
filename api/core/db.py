"""Asynchronous database helpers for the API layer."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

LOGGER = logging.getLogger("indiainflation.api.db")

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _load_env() -> None:
    env_path = Path(__file__).resolve().parents[2] / ".env.prod"
    if env_path.exists():
        load_dotenv(env_path, override=False)


def get_database_url() -> str:
    _load_env()

    url = os.getenv("DATABASE_URL")
    if url:
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    host = os.getenv("POSTGRES_HOST")
    if not host:
        raise RuntimeError("Database configuration missing: POSTGRES_HOST not set")

    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "")
    dbname = os.getenv("POSTGRES_DB", "postgres")
    port = os.getenv("POSTGRES_PORT", "5432")

    return f"postgresql+psycopg://{user}:{password}@{host}:{port}/{dbname}"


def _get_engine() -> AsyncEngine:
    global _engine  # noqa: PLW0603
    if _engine is None:
        database_url = get_database_url()
        _engine = create_async_engine(database_url, echo=False, future=True, pool_pre_ping=True)
    return _engine


def _get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory  # noqa: PLW0603
    if _session_factory is None:
        _session_factory = async_sessionmaker(bind=_get_engine(), expire_on_commit=False)
    return _session_factory


@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    session_factory = _get_session_factory()
    async with session_factory() as session:  # pragma: no cover - simple delegation
        try:
            yield session
        except Exception:  # noqa: BLE001
            await session.rollback()
            raise


async def run_query(query: str) -> list[dict]:
    engine = _get_engine()
    async with engine.connect() as connection:
        result = await connection.execute(text(query))
        rows = [dict(row._mapping) for row in result]
        await connection.commit()
    return rows


__all__ = ["get_session", "run_query"]
