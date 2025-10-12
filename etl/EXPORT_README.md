# ETL JSON Exporter

Run the exporter from the repository root:

```
python -m etl.export_json --item rice --output-dir ./etl/data/exports
```

Use `--all` to export every item and region or pass `--since YYYY-MM` to limit the data window. Provide S3 credentials via `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY` to upload exports alongside the local gzipped files.
