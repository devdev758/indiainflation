-- Analytical views for IndiaInflation reporting

CREATE OR REPLACE VIEW inflation_summary AS
SELECT
    cn.observation_month AS observation_month,
    cn.sector,
    cn.major_group,
    cn.subgroup,
    cn.index_value,
    cn.yoy_inflation_rate,
    LAG(cn.index_value, 12) OVER (PARTITION BY cn.sector, cn.major_group, cn.subgroup ORDER BY cn.observation_month) AS index_value_prior_year
FROM cpi_national cn
WHERE cn.observation_month = (
    SELECT MAX(observation_month)
    FROM cpi_national
);

COMMENT ON VIEW inflation_summary IS 'Latest CPI national indices with optional YoY comparisons for dashboard summaries.';


CREATE OR REPLACE VIEW statewise_latest AS
SELECT DISTINCT ON (cs.state, cs.sector)
    cs.state,
    cs.sector,
    cs.observation_month,
    cs.index_value,
    cs.inflation_rate,
    cs.major_group,
    cs.subgroup
FROM cpi_state cs
ORDER BY cs.state, cs.sector, cs.observation_month DESC;

COMMENT ON VIEW statewise_latest IS 'Most recent CPI readings and inflation rates for each state/sector combination.';


CREATE OR REPLACE VIEW core_vs_headline AS
SELECT
    headline.observation_month,
    headline.sector,
    headline.index_value AS headline_index,
    core.index_value AS core_index,
    headline.yoy_inflation_rate AS headline_yoy,
    core.yoy_inflation_rate AS core_yoy
FROM (
    SELECT *
    FROM cpi_national
    WHERE major_group = 'All Items'
) AS headline
JOIN (
    SELECT *
    FROM cpi_national
    WHERE major_group = 'Core'
) AS core
    ON core.observation_month = headline.observation_month
   AND core.sector = headline.sector;

COMMENT ON VIEW core_vs_headline IS 'Comparison between headline CPI (All Items) and core CPI indices for trend analysis.';


CREATE OR REPLACE VIEW wpi_trends AS
SELECT DISTINCT ON (w.category)
    w.category,
    w.observation_month,
    w.index_value,
    LAG(w.index_value, 1) OVER (PARTITION BY w.category ORDER BY w.observation_month) AS previous_index,
    LAG(w.index_value, 12) OVER (PARTITION BY w.category ORDER BY w.observation_month) AS prior_year_index
FROM wpi w
ORDER BY w.category, w.observation_month DESC;

COMMENT ON VIEW wpi_trends IS 'Latest WPI values with sequential and year-ago comparisons by category.';
