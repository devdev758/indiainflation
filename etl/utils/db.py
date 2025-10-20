"""Database utilities for IndiaInflation ETL jobs."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Iterable

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import MetaData, Table, create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.exc import SQLAlchemyError

LOGGER = logging.getLogger("indiainflation.etl.db")


def _load_env() -> None:
    """Load environment variables from .env.prod if present."""

    env_path = Path(__file__).resolve().parents[2] / ".env.prod"
    if env_path.exists():
        load_dotenv(env_path, override=False)


def get_database_url() -> str:
    """Return the database URL built from environment variables."""

    _load_env()

    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    host = os.getenv("POSTGRES_HOST")
    if not host:
        raise RuntimeError("Database configuration missing: POSTGRES_HOST not set")

    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "")
    dbname = os.getenv("POSTGRES_DB", "postgres")
    port = os.getenv("POSTGRES_PORT", "5432")

    return f"postgresql+psycopg://{user}:{password}@{host}:{port}/{dbname}"


def get_db_connection() -> Connection:
    """Create and return a SQLAlchemy connection."""

    database_url = get_database_url()
    engine: Engine = create_engine(database_url, future=True, pool_pre_ping=True)
    return engine.connect()


def execute_upsert(
    table_name: str,
    dataframe: pd.DataFrame,
    conflict_columns: Iterable[str],
) -> tuple[int, int]:
    """Upsert a dataframe into the target table.

    Args:
        table_name: Fully qualified table name (optionally schema-qualified).
        dataframe: DataFrame containing rows to upsert.
        conflict_columns: Columns used for ON CONFLICT constraint.

    Returns:
        inserted_count, updated_count
    """

    if dataframe.empty:
        LOGGER.info("No rows to upsert into %s", table_name)
        return 0, 0

    database_url = get_database_url()
    engine: Engine = create_engine(database_url, future=True, pool_pre_ping=True)

    metadata = MetaData()
    schema, _, raw_table = table_name.partition(".")
    table = Table(raw_table or table_name, metadata, autoload_with=engine, schema=schema or None)

    rows = dataframe.to_dict(orient="records")
    inserted = 0
    updated = 0

    with engine.begin() as connection:
        try:
            stmt = insert(table).values(rows)
            update_cols = {col: stmt.excluded[col] for col in dataframe.columns if col not in conflict_columns}
            stmt = stmt.on_conflict_do_update(index_elements=list(conflict_columns), set_=update_cols)
            result = connection.execute(stmt)
            inserted = result.rowcount or 0
            if dataframe.shape[0] > inserted:
                updated = dataframe.shape[0] - inserted
            LOGGER.info(
                "Upserted %s rows into %s (inserted=%s, updated=%s)",
                dataframe.shape[0],
                table_name,
                inserted,
                updated,
            )
        except SQLAlchemyError as exc:  # noqa: BLE001
            LOGGER.error("Failed upserting into %s: %s", table_name, exc)
            raise

    return inserted, updated


__all__ = ["get_db_connection", "execute_upsert"]
