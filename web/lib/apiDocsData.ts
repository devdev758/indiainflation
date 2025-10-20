/**
 * Centralized API documentation metadata
 * Defines all available endpoints, parameters, and examples
 */

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

export interface ApiEndpoint {
  id: string;
  title: string;
  description: string;
  method: "GET" | "POST";
  path: string;
  baseUrl: string;
  category: string;
  parameters: ApiParameter[];
  exampleRequest: {
    curl: string;
    javascript: string;
    python: string;
  };
  exampleResponse: Record<string, any>;
  statusCode: number;
  rateLimit?: string;
  authentication?: string;
  cacheTime?: string;
}

export const apiEndpoints: ApiEndpoint[] = [
  {
    id: "historical",
    title: "CPI Historical Data",
    description: "Fetch historical CPI data spanning from 1958 to present with optional filtering by date range and sector",
    method: "GET",
    path: "/api/inflation/historical",
    baseUrl: "https://indiainflation.com",
    category: "Data Access",
    parameters: [
      {
        name: "from_date",
        type: "string",
        required: false,
        description: "Start date in YYYY-MM format",
        example: "2000-01-01",
      },
      {
        name: "to_date",
        type: "string",
        required: false,
        description: "End date in YYYY-MM format",
        example: "2024-10-31",
      },
      {
        name: "sector",
        type: "string",
        required: false,
        description: "Data sector: Combined, Urban, or Rural",
        example: "Combined",
      },
      {
        name: "normalize",
        type: "boolean",
        required: false,
        description: "Normalize to base year (100)",
        example: "false",
      },
    ],
    exampleRequest: {
      curl: `curl -X GET "https://indiainflation.com/api/inflation/historical?from_date=2000-01-01&to_date=2024-10-31&sector=Combined" \\
  -H "Accept: application/json"`,
      javascript: `fetch('https://indiainflation.com/api/inflation/historical?from_date=2000-01-01&to_date=2024-10-31')
  .then(res => res.json())
  .then(data => console.log(data))`,
      python: `import requests
url = "https://indiainflation.com/api/inflation/historical"
params = {"from_date": "2000-01-01", "to_date": "2024-10-31"}
response = requests.get(url, params=params)
data = response.json()`,
    },
    exampleResponse: {
      data: [
        {
          date: "2000-01",
          month: 1,
          year: 2000,
          value: 95.4,
          yoy_percent: 2.1,
          sector: "Combined",
        },
        {
          date: "2000-02",
          month: 2,
          year: 2000,
          value: 96.1,
          yoy_percent: 2.3,
          sector: "Combined",
        },
      ],
      metadata: {
        base_year: "2011-12",
        start_date: "2000-01",
        end_date: "2024-10",
        data_type: "CPI",
        sector: "Combined",
        count: 299,
      },
    },
    statusCode: 200,
    rateLimit: "100 requests/minute",
    cacheTime: "60 minutes",
  },

  {
    id: "statewise",
    title: "State-wise Inflation",
    description: "Fetch latest CPI and YoY inflation rates for all Indian states and union territories",
    method: "GET",
    path: "/api/inflation/statewise",
    baseUrl: "https://indiainflation.com",
    category: "Data Access",
    parameters: [
      {
        name: "month",
        type: "string",
        required: true,
        description: "Month in YYYY-MM format",
        example: "2024-09",
      },
      {
        name: "sector",
        type: "string",
        required: false,
        description: "Sector: Combined, Urban, or Rural",
        example: "Combined",
      },
    ],
    exampleRequest: {
      curl: `curl -X GET "https://indiainflation.com/api/inflation/statewise?month=2024-09&sector=Combined" \\
  -H "Accept: application/json"`,
      javascript: `const response = await fetch(
  'https://indiainflation.com/api/inflation/statewise?month=2024-09'
);
const data = await response.json();`,
      python: `import requests
response = requests.get(
  "https://indiainflation.com/api/inflation/statewise",
  params={"month": "2024-09", "sector": "Combined"}
)
data = response.json()`,
    },
    exampleResponse: {
      data: [
        {
          state: "Maharashtra",
          cpi_value: 182.4,
          yoy_percent: 4.2,
          month: "2024-09",
          category: "All-India",
        },
        {
          state: "Delhi",
          cpi_value: 179.8,
          yoy_percent: 3.8,
          month: "2024-09",
          category: "All-India",
        },
      ],
      metadata: {
        month: "2024-09",
        sector: "Combined",
        states_count: 36,
        base_year: "2011-12",
      },
    },
    statusCode: 200,
    rateLimit: "100 requests/minute",
    cacheTime: "24 hours",
  },

  {
    id: "compare",
    title: "CPI vs WPI Comparison",
    description: "Compare Consumer Price Index (CPI) and Wholesale Price Index (WPI) trends",
    method: "GET",
    path: "/api/inflation/compare",
    baseUrl: "https://indiainflation.com",
    category: "Data Access",
    parameters: [
      {
        name: "from_date",
        type: "string",
        required: false,
        description: "Start date in YYYY-MM format",
        example: "2020-01",
      },
      {
        name: "to_date",
        type: "string",
        required: false,
        description: "End date in YYYY-MM format",
        example: "2024-10",
      },
      {
        name: "type",
        type: "string",
        required: false,
        description: "Data type: CPI or WPI",
        example: "CPI",
      },
    ],
    exampleRequest: {
      curl: `curl -X GET "https://indiainflation.com/api/inflation/compare?from_date=2020-01&to_date=2024-10" \\
  -H "Accept: application/json"`,
      javascript: `fetch('https://indiainflation.com/api/inflation/compare?from_date=2020-01&to_date=2024-10')
  .then(r => r.json())
  .then(d => console.log(d))`,
      python: `import requests
url = "https://indiainflation.com/api/inflation/compare"
params = {"from_date": "2020-01", "to_date": "2024-10"}
data = requests.get(url, params=params).json()`,
    },
    exampleResponse: {
      cpi: [
        { date: "2020-01", value: 102.3, yoy_percent: 7.6 },
        { date: "2020-02", value: 102.6, yoy_percent: 6.9 },
      ],
      wpi: [
        { date: "2020-01", value: 108.2, yoy_percent: 2.3 },
        { date: "2020-02", value: 107.8, yoy_percent: 1.9 },
      ],
      metadata: {
        cpi_base_year: "2011-12",
        wpi_base_year: "2011-12",
        comparison_note: "CPI measures retail inflation, WPI measures wholesale inflation",
      },
    },
    statusCode: 200,
    rateLimit: "100 requests/minute",
    cacheTime: "60 minutes",
  },

  {
    id: "calculator",
    title: "Inflation Calculator",
    description: "Calculate the impact of inflation on a given amount over time",
    method: "POST",
    path: "/api/inflation/calculator",
    baseUrl: "https://indiainflation.com",
    category: "Tools",
    parameters: [
      {
        name: "amount",
        type: "number",
        required: true,
        description: "Initial amount in INR",
        example: "100000",
      },
      {
        name: "from_date",
        type: "string",
        required: true,
        description: "Start date in YYYY-MM format",
        example: "2010-01",
      },
      {
        name: "to_date",
        type: "string",
        required: true,
        description: "End date in YYYY-MM format",
        example: "2024-10",
      },
    ],
    exampleRequest: {
      curl: `curl -X POST "https://indiainflation.com/api/inflation/calculator" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 100000, "from_date": "2010-01", "to_date": "2024-10"}'`,
      javascript: `const response = await fetch(
  'https://indiainflation.com/api/inflation/calculator',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 100000,
      from_date: '2010-01',
      to_date: '2024-10'
    })
  }
);
const result = await response.json();`,
      python: `import requests
url = "https://indiainflation.com/api/inflation/calculator"
payload = {
  "amount": 100000,
  "from_date": "2010-01",
  "to_date": "2024-10"
}
response = requests.post(url, json=payload)
data = response.json()`,
    },
    exampleResponse: {
      amount: 100000,
      from_date: "2010-01",
      to_date: "2024-10",
      equivalent_value: 275320,
      inflation_percent: 175.32,
      cagr_percent: 6.89,
      calculation_method: "CPI-based",
    },
    statusCode: 200,
    rateLimit: "50 requests/minute",
    authentication: "Optional API key for higher limits",
  },

  {
    id: "metadata",
    title: "Metadata & Sources",
    description: "Get information about data sources, coverage, and last update times",
    method: "GET",
    path: "/api/inflation/metadata",
    baseUrl: "https://indiainflation.com",
    category: "Information",
    parameters: [
      {
        name: "type",
        type: "string",
        required: false,
        description: "Metadata type: sources, coverage, or updates",
        example: "sources",
      },
    ],
    exampleRequest: {
      curl: `curl -X GET "https://indiainflation.com/api/inflation/metadata" \\
  -H "Accept: application/json"`,
      javascript: `fetch('https://indiainflation.com/api/inflation/metadata')
  .then(r => r.json())
  .then(d => console.log(d.sources))`,
      python: `import requests
metadata = requests.get("https://indiainflation.com/api/inflation/metadata").json()
print(metadata['sources'])`,
    },
    exampleResponse: {
      sources: [
        {
          name: "Ministry of Statistics & Programme Implementation (MoSPI)",
          url: "https://mospi.gov.in",
          data_type: "CPI",
          coverage: "1958-present",
        },
        {
          name: "Department of Industrial Policy & Promotion (DPIIT)",
          url: "https://dpiit.gov.in",
          data_type: "WPI",
          coverage: "1960-present",
        },
      ],
      last_updated: "2024-10-15T10:30:00Z",
      next_update: "2024-11-15T10:00:00Z",
      data_frequency: "Monthly",
    },
    statusCode: 200,
    rateLimit: "200 requests/minute",
    cacheTime: "24 hours",
  },
];

/**
 * Get endpoint by ID
 */
export function getEndpointById(id: string): ApiEndpoint | undefined {
  return apiEndpoints.find((ep) => ep.id === id);
}

/**
 * Get endpoints by category
 */
export function getEndpointsByCategory(category: string): ApiEndpoint[] {
  return apiEndpoints.filter((ep) => ep.category === category);
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  return [...new Set(apiEndpoints.map((ep) => ep.category))];
}

/**
 * Get all endpoints
 */
export function getAllEndpoints(): ApiEndpoint[] {
  return apiEndpoints;
}
