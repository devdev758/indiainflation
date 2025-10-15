ALTER TABLE raw_series
    ADD COLUMN IF NOT EXISTS source VARCHAR(64) NOT NULL DEFAULT 'mospi';

UPDATE raw_series
SET source = COALESCE(source, 'mospi');

-- retain default for future inserts
