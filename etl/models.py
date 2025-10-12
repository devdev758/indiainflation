"""SQLAlchemy table metadata for the Indiainflation ETL."""

from __future__ import annotations

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    MetaData,
    Numeric,
    SmallInteger,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID


metadata = MetaData()

items_table = Table(
    "items",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("slug", String(255), nullable=False, unique=True),
    Column("canonical_name", String(255), nullable=False),
    Column("aliases", JSONB, nullable=False, server_default=text("'[]'::jsonb")),
)

regions_table = Table(
    "regions",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("code", String(64), nullable=False, unique=True),
    Column("name", String(255), nullable=False),
    Column("type", String(64), nullable=False, server_default=text("'unknown'")),
)

raw_series_table = Table(
    "raw_series",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("source_file", Text, nullable=False),
    Column("item_alias", Text, nullable=False),
    Column("region_alias", Text, nullable=False),
    Column("year", SmallInteger, nullable=False),
    Column("month", SmallInteger, nullable=False),
    Column("raw_value", Numeric(12, 6), nullable=False),
    Column("ingested_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
)

series_table = Table(
    "series",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("item_id", ForeignKey("items.id"), nullable=False),
    Column("region_id", ForeignKey("regions.id"), nullable=False),
    Column("date", Date, nullable=False),
    Column("index_value", Numeric(12, 6), nullable=False),
    UniqueConstraint("item_id", "region_id", "date", name="uq_series_item_region_date"),
)

etl_runs_table = Table(
    "etl_runs",
    metadata,
    Column("run_id", UUID(as_uuid=True), primary_key=True),
    Column("started_at", DateTime(timezone=True), nullable=False),
    Column("finished_at", DateTime(timezone=True)),
    Column("status", String(32), nullable=False),
    Column("checksum", String(256), nullable=False),
    Column("log", Text, nullable=False),
)
