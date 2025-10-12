"""Shared helpers for the Indiainflation ETL package."""

from __future__ import annotations

import hashlib
import logging
import os
import re
import unicodedata
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, Iterator, Optional

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker


def configure_logging() -> logging.Logger:
    """Configure a root logger for ETL scripts."""

    logger = logging.getLogger("indiainflation.etl")
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


def slugify(value: str) -> str:
    """Create a URL-friendly slug."""

    value_normalized = (
        unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    )
    value_normalized = re.sub(r"[^a-zA-Z0-9\s-]", "", value_normalized).strip().lower()
    return re.sub(r"[\s_-]+", "-", value_normalized)


def ensure_directory(path: Path) -> Path:
    """Guarantee that a directory exists and return it."""

    path.mkdir(parents=True, exist_ok=True)
    return path


def checksum_bytes(chunks: Iterable[bytes]) -> str:
    """Compute SHA256 checksum from iterable chunks."""

    digest = hashlib.sha256()
    for chunk in chunks:
        digest.update(chunk)
    return digest.hexdigest()


def current_run_directory(base_dir: Path) -> Path:
    """Return a timestamped run directory inside ``base_dir``."""

    today = datetime.utcnow().strftime("%Y%m%d")
    return ensure_directory(base_dir / today)


_ENGINE_CACHE: dict[str, Engine] = {}


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


def get_database_url(override: str | None = None) -> str | None:
    """Return the database URL from parameter or environment."""

    if override:
        return override
    return os.getenv("DATABASE_URL")


def get_engine(database_url: str | None = None) -> Optional[Engine]:
    """Create (or reuse) a SQLAlchemy engine for the configured database."""

    url = get_database_url(database_url)
    if not url:
        return None

    engine = _ENGINE_CACHE.get(url)
    if engine is None:
        pool_size = _int_env("DB_POOL_SIZE", 5)
        max_overflow = _int_env("DB_POOL_MAX_OVERFLOW", 5)
        engine = create_engine(
            url,
            future=True,
            pool_pre_ping=True,
            pool_size=pool_size,
            max_overflow=max_overflow,
        )
        _ENGINE_CACHE[url] = engine
    return engine


def dispose_engine(database_url: str | None = None) -> None:
    """Dispose a cached engine, useful for tests."""

    url = get_database_url(database_url)
    if not url:
        return
    engine = _ENGINE_CACHE.pop(url, None)
    if engine is not None:
        engine.dispose()


@contextmanager
def session_scope(engine: Engine | None = None) -> Iterator[Optional[object]]:
    """Provide a transactional scope around a series of operations."""

    engine = engine or get_engine()
    if engine is None:
        yield None
        return

    Session = sessionmaker(bind=engine, future=True)
    session = Session()
    try:
        yield session
        session.commit()
    except Exception:  # noqa: BLE001
        session.rollback()
        raise
    finally:
        session.close()


@dataclass
class StorageConfig:
    """Configuration for blob storage destinations."""

    bucket: str | None
    endpoint: str | None
    access_key: str | None
    secret_key: str | None

    @classmethod
    def from_env(cls) -> "StorageConfig":
        return cls(
            bucket=os.getenv("S3_BUCKET"),
            endpoint=os.getenv("S3_ENDPOINT"),
            access_key=os.getenv("S3_ACCESS_KEY"),
            secret_key=os.getenv("S3_SECRET_KEY"),
        )
