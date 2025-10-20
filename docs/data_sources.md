---
title: Data Sources Index
description: Master index of datasets supporting the IndiaInflation data pipeline
---

# Data Sources Index

## Overview

This index catalogs authoritative Indian inflation datasets powering the IndiaInflation ETL → PostgreSQL → API → Frontend pipeline. Each entry summarizes provenance, formats, cadence, and critical metadata requirements.

## 1. Consumer Price Index (CPI) — MoSPI

| Field | Details |
| --- | --- |
| **Source** | Ministry of Statistics and Programme Implementation (MoSPI) — Consumer Price Index portal |
| **Description** | Monthly retail price indices for rural, urban, and combined sectors across major groups and sub-groups; current base year 2012=100 |
| **URL(s)** | - https://www.mospi.gov.in/cpi<br>- Annexures (e.g., “SDMX Month-wise”) via CPI portal download pages |
| **Formats** | XLS/XLSX annexures; CSV/SDMX for month-wise datasets |
| **Frequency / Update** | Monthly (released mid-month for the prior month) |
| **Fields we expect** | Date (Year-Month), Sector (Rural/Urban/Combined), MajorGroup, SubGroup, IndexValue, BaseYear, Region (All-India or State) |
| **Back-series** | Back-series available from January 2011 onward for the 2012=100 base |
| **Notes / Flags** | - Some series marked provisional<br>- Rural/Urban splits may be unavailable for smaller states<br>- Check metadata for missing months (e.g., April/May 2020 gaps) |

## 2. CPI — State-Wise / Sub-Group Detail

| Field | Details |
| --- | --- |
| **Source** | MoSPI — State-wise CPI data and associated visualization portal |
| **Description** | Monthly CPI-based inflation rates (YoY) for each state/UT with group and sub-group breakdowns where provided |
| **URL(s)** | https://www.mospi.gov.in/dataviz-cpi-map |
| **Formats** | Excel/CSV downloads; extracts embedded within visualization pages |
| **Frequency / Update** | Monthly (aligned with CPI release schedule) |
| **Fields we expect** | Date, State/UT, Sector (Combined/Rural/Urban when available), IndexValue or InflationRate, Group/SubGroup indicator |
| **Notes / Flags** | Provisional tagging common; certain months absent for select states (e.g., April/May 2020) |

## 3. CPI Weights of Groups / Basket Composition

| Field | Details |
| --- | --- |
| **Source** | MoSPI — “Weights of Groups and Subgroups of Items in CPI Basket” |
| **Description** | Expenditure weights for major and sub-groups within the CPI basket, essential for component-level analysis |
| **URL(s)** | https://www.mospi.gov.in/percentage-share |
| **Formats** | XLS/XLSX tables; occasional PDF releases |
| **Frequency / Update** | Revised periodically (non-monthly) but required for interpreting CPI series |
| **Fields we expect** | MajorGroup, SubGroup, Weight% (All-India), Sector (Rural/Urban/Combined) |
| **Notes / Flags** | Validate base-year alignment with CPI index series when integrating weights |

## 4. Wholesale Price Index (WPI) — DPIIT / Ministry of Commerce *(optional)*

| Field | Details |
| --- | --- |
| **Source** | Department for Promotion of Industry and Internal Trade (DPIIT) / Ministry of Commerce (official WPI portal to be confirmed) |
| **Description** | Wholesale price index tracking inflation across primary, intermediate, and finished goods segments |
| **URL(s)** | TBD |
| **Formats** | Expected XLS/CSV downloads |
| **Frequency / Update** | Monthly with typical release lag |
| **Fields we expect** | Date, IndexType (e.g., WPI All Items, Primary, Intermediate, Finished), IndexValue, BaseYear |
| **Notes / Flags** | Confirm current base year (e.g., 2011-12); align release cadence with CPI datasets for comparability |

## 5. IMF / Global CPI / SDDS Comparative Series *(optional)*

| Field | Details |
| --- | --- |
| **Source** | IMF SDDS and other global inflation portals |
| **Description** | Comparative CPI series enabling cross-country benchmarking for dashboards |
| **URL(s)** | Example: https://www.imf.org/en/Data (specific endpoints TBD) |
| **Formats** | CSV and SDMX formats typical |
| **Frequency / Update** | Monthly or quarterly based on series |
| **Fields we expect** | Country, Date, IndexValue, BaseYear, SeriesName |
| **Notes / Flags** | Normalize base years and reference periods to ensure comparability with Indian series |

## 6. Metadata & Release Schedule

| Field | Details |
| --- | --- |
| **Source** | MoSPI press releases and “Download Tables/Data” sections |
| **Description** | Captures release dates, provisional status, and embargo details for each dataset |
| **URL(s)** | Example: MoSPI Year-on-Year Inflation press releases |
| **Formats** | PDF/XLS |
| **Fields we expect** | DatasetName, ReleaseDate, Status (Provisional/Final), Link to raw file |
| **Notes / Flags** | Use to trigger ETL workflows only after official releases are published; supports monitoring alerts |
