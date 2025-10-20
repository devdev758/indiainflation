-- Schema definition for IndiaInflation analytical warehouse

CREATE TABLE IF NOT EXISTS cpi_weights (
    id SERIAL PRIMARY KEY,
    sector VARCHAR(16) NOT NULL,
    major_group VARCHAR(128) NOT NULL,
    subgroup VARCHAR(128) NOT NULL,
    weight_percent NUMERIC(5,2) NOT NULL,
    base_year SMALLINT NOT NULL,
    CONSTRAINT cpi_weights_unique_key UNIQUE (sector, major_group, subgroup)
);

COMMENT ON TABLE cpi_weights IS 'Reference table listing CPI basket weights by sector, major group, and subgroup for the active base year.';
COMMENT ON COLUMN cpi_weights.id IS 'Surrogate identifier for the weight record.';
COMMENT ON COLUMN cpi_weights.sector IS 'Population segment the weight applies to (Rural, Urban, Combined).';
COMMENT ON COLUMN cpi_weights.major_group IS 'Primary CPI consumption group (e.g., Food & Beverages, Housing).';
COMMENT ON COLUMN cpi_weights.subgroup IS 'Detailed CPI subgroup name aligned with MoSPI taxonomy.';
COMMENT ON COLUMN cpi_weights.weight_percent IS 'Published expenditure weight percentage for the subgroup within the specified sector.';
COMMENT ON COLUMN cpi_weights.base_year IS 'CPI base year associated with the published weight (e.g., 2012).';


CREATE TABLE IF NOT EXISTS cpi_national (
    id SERIAL PRIMARY KEY,
    observation_month DATE NOT NULL,
    sector VARCHAR(16) NOT NULL,
    major_group VARCHAR(128) NOT NULL,
    subgroup VARCHAR(128) NOT NULL,
    index_value NUMERIC(10,2) NOT NULL,
    yoy_inflation_rate NUMERIC(5,2),
    base_year SMALLINT NOT NULL,
    CONSTRAINT cpi_national_unique_observation UNIQUE (observation_month, sector, major_group, subgroup),
    CONSTRAINT cpi_national_valid_sector CHECK (sector IN ('Rural', 'Urban', 'Combined')),
    CONSTRAINT cpi_national_weight_fk FOREIGN KEY (sector, major_group, subgroup)
        REFERENCES cpi_weights (sector, major_group, subgroup)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

COMMENT ON TABLE cpi_national IS 'Monthly CPI index observations for India at the national level, segmented by sector and consumption groups.';
COMMENT ON COLUMN cpi_national.id IS 'Surrogate identifier for the CPI national record.';
COMMENT ON COLUMN cpi_national.observation_month IS 'Reference month for the CPI reading (stored as the first calendar day of the month).';
COMMENT ON COLUMN cpi_national.sector IS 'Population segment for the CPI observation (Rural, Urban, Combined).';
COMMENT ON COLUMN cpi_national.major_group IS 'Primary CPI consumption group classification (e.g., Food & Beverages).';
COMMENT ON COLUMN cpi_national.subgroup IS 'Detailed CPI subgroup aligned to MoSPI annexures.';
COMMENT ON COLUMN cpi_national.index_value IS 'Published CPI index value for the segment and subgroup.';
COMMENT ON COLUMN cpi_national.yoy_inflation_rate IS 'Stored or computed year-over-year inflation rate for the observation (percentage).';
COMMENT ON COLUMN cpi_national.base_year IS 'CPI base year applicable to the index value (e.g., 2012).';


CREATE TABLE IF NOT EXISTS cpi_state (
    id SERIAL PRIMARY KEY,
    observation_month DATE NOT NULL,
    state VARCHAR(64) NOT NULL,
    sector VARCHAR(16) NOT NULL,
    major_group VARCHAR(128) NOT NULL,
    subgroup VARCHAR(128) NOT NULL,
    index_value NUMERIC(10,2) NOT NULL,
    inflation_rate NUMERIC(5,2),
    CONSTRAINT cpi_state_unique_observation UNIQUE (observation_month, state, sector, major_group, subgroup),
    CONSTRAINT cpi_state_valid_sector CHECK (sector IN ('Rural', 'Urban', 'Combined')),
    CONSTRAINT cpi_state_weight_fk FOREIGN KEY (sector, major_group, subgroup)
        REFERENCES cpi_weights (sector, major_group, subgroup)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

COMMENT ON TABLE cpi_state IS 'State and union territory CPI observations with optional inflation rates by sector and subgroup.';
COMMENT ON COLUMN cpi_state.id IS 'Surrogate identifier for the CPI state record.';
COMMENT ON COLUMN cpi_state.observation_month IS 'Reference month for the state-level CPI reading.';
COMMENT ON COLUMN cpi_state.state IS 'Name of the state or union territory represented in the observation.';
COMMENT ON COLUMN cpi_state.sector IS 'Population segment for the state-level CPI observation (Rural, Urban, Combined).';
COMMENT ON COLUMN cpi_state.major_group IS 'Primary CPI consumption group for the state-level record.';
COMMENT ON COLUMN cpi_state.subgroup IS 'Detailed CPI subgroup name for the state-level record.';
COMMENT ON COLUMN cpi_state.index_value IS 'Published CPI index value for the state/sector/group combination.';
COMMENT ON COLUMN cpi_state.inflation_rate IS 'Year-over-year inflation rate for the state observation (percentage).';


CREATE TABLE IF NOT EXISTS wpi (
    id SERIAL PRIMARY KEY,
    observation_month DATE NOT NULL,
    category VARCHAR(128) NOT NULL,
    index_value NUMERIC(10,2) NOT NULL,
    base_year SMALLINT NOT NULL,
    CONSTRAINT wpi_unique_observation UNIQUE (observation_month, category)
);

COMMENT ON TABLE wpi IS 'Wholesale Price Index observations segmented by official category classifications.';
COMMENT ON COLUMN wpi.id IS 'Surrogate identifier for the WPI record.';
COMMENT ON COLUMN wpi.observation_month IS 'Reference month for the WPI observation.';
COMMENT ON COLUMN wpi.category IS 'WPI category (e.g., All Commodities, Primary, Manufactured Products).';
COMMENT ON COLUMN wpi.index_value IS 'Published WPI index value for the category and month.';
COMMENT ON COLUMN wpi.base_year IS 'WPI base year associated with the observation (e.g., 2011).';


CREATE TABLE IF NOT EXISTS metadata_releases (
    id SERIAL PRIMARY KEY,
    dataset_name VARCHAR(128) NOT NULL,
    release_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL,
    source_url TEXT NOT NULL,
    CONSTRAINT metadata_releases_unique UNIQUE (dataset_name, release_date),
    CONSTRAINT metadata_releases_status_check CHECK (status IN ('Provisional', 'Final', 'Revised'))
);

COMMENT ON TABLE metadata_releases IS 'Log of official release metadata for CPI, WPI, and related datasets.';
COMMENT ON COLUMN metadata_releases.id IS 'Surrogate identifier for the metadata record.';
COMMENT ON COLUMN metadata_releases.dataset_name IS 'Name of the dataset or publication (e.g., CPI Combined, WPI All Commodities).';
COMMENT ON COLUMN metadata_releases.release_date IS 'Official release date of the dataset.';
COMMENT ON COLUMN metadata_releases.status IS 'Publication status flag such as Provisional, Final, or Revised.';
COMMENT ON COLUMN metadata_releases.source_url IS 'Source URL referencing the official release or press note.';


-- Indexes for analytical performance
CREATE INDEX IF NOT EXISTS idx_cpi_national_month ON cpi_national (observation_month);
CREATE INDEX IF NOT EXISTS idx_cpi_national_sector_group ON cpi_national (sector, major_group, subgroup);

CREATE INDEX IF NOT EXISTS idx_cpi_state_month ON cpi_state (observation_month);
CREATE INDEX IF NOT EXISTS idx_cpi_state_state_sector ON cpi_state (state, sector);

CREATE INDEX IF NOT EXISTS idx_wpi_month ON wpi (observation_month);
CREATE INDEX IF NOT EXISTS idx_wpi_category ON wpi (category);

CREATE INDEX IF NOT EXISTS idx_metadata_releases_date ON metadata_releases (release_date);
CREATE INDEX IF NOT EXISTS idx_metadata_releases_dataset_status ON metadata_releases (dataset_name, status);
