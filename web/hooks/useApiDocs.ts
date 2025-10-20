import { useState, useCallback } from "react";
import { apiClient } from "@/components/apiClient";
import type { ApiEndpoint } from "@/lib/apiDocsData";

interface TestState {
  endpoint: string;
  loading: boolean;
  error: string | null;
  response: any;
}

/**
 * Hook for managing API documentation and testing
 */
export function useApiDocs() {
  const [testStates, setTestStates] = useState<Record<string, TestState>>({});

  /**
   * Test an API endpoint with demo data
   */
  const testEndpoint = useCallback(async (endpoint: ApiEndpoint) => {
    const key = endpoint.id;
    setTestStates((prev) => ({
      ...prev,
      [key]: { endpoint: key, loading: true, error: null, response: null },
    }));

    try {
      let response;

      if (endpoint.method === "GET") {
        // Build query string from example request
        let queryParams = "?";

        if (endpoint.id === "historical") {
          queryParams += "from_date=2020-01-01&to_date=2024-10-31&sector=Combined";
        } else if (endpoint.id === "statewise") {
          queryParams += "month=2024-09&sector=Combined";
        } else if (endpoint.id === "compare") {
          queryParams += "from_date=2020-01-01&to_date=2024-10-31";
        } else if (endpoint.id === "metadata") {
          queryParams += "type=sources";
        }

        response = await apiClient.get(`${endpoint.path}${queryParams}`);
      } else if (endpoint.method === "POST") {
        // Use demo payload
        const payload =
          endpoint.id === "calculator"
            ? {
                amount: 100000,
                from_date: "2010-01-01",
                to_date: "2024-10-31",
              }
            : {};

        response = await apiClient.post(endpoint.path, payload);
      }

      setTestStates((prev) => ({
        ...prev,
        [key]: {
          endpoint: key,
          loading: false,
          error: null,
          response: response.data,
        },
      }));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to test endpoint";

      setTestStates((prev) => ({
        ...prev,
        [key]: {
          endpoint: key,
          loading: false,
          error: errorMessage,
          response: null,
        },
      }));
    }
  }, []);

  /**
   * Clear test results
   */
  const clearTest = useCallback((endpointId: string) => {
    setTestStates((prev) => {
      const updated = { ...prev };
      delete updated[endpointId];
      return updated;
    });
  }, []);

  /**
   * Clear all test results
   */
  const clearAllTests = useCallback(() => {
    setTestStates({});
  }, []);

  return {
    testStates,
    testEndpoint,
    clearTest,
    clearAllTests,
    getTestState: (endpointId: string) => testStates[endpointId],
  };
}

/**
 * Format endpoint path with query parameters
 */
export function formatEndpointPath(
  endpoint: ApiEndpoint,
  params?: Record<string, string>
): string {
  let path = endpoint.path;

  if (params && endpoint.method === "GET") {
    const queryString = new URLSearchParams(params).toString();
    if (queryString) {
      path += `?${queryString}`;
    }
  }

  return path;
}

/**
 * Generate curl command from endpoint
 */
export function generateCurlCommand(
  endpoint: ApiEndpoint,
  params?: Record<string, any>
): string {
  let cmd = `curl -X ${endpoint.method} "${endpoint.baseUrl}${endpoint.path}`;

  if (params && endpoint.method === "GET") {
    const queryString = new URLSearchParams(params).toString();
    if (queryString) {
      cmd += `?${queryString}`;
    }
  }

  cmd += `" \\`;
  cmd += `\n  -H "Accept: application/json"`;

  if (endpoint.method === "POST") {
    cmd += `\n  -H "Content-Type: application/json" \\`;
    cmd += `\n  -d '${JSON.stringify(params || {})}'`;
  }

  return cmd;
}

/**
 * Generate JavaScript fetch code
 */
export function generateFetchCode(
  endpoint: ApiEndpoint,
  params?: Record<string, any>
): string {
  const url = `${endpoint.baseUrl}${endpoint.path}`;
  let code = ``;

  if (endpoint.method === "GET") {
    const queryString = new URLSearchParams(params as any).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    code = `fetch('${fullUrl}')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;
  } else if (endpoint.method === "POST") {
    code = `fetch('${url}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(params || {}, null, 2)})
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;
  }

  return code;
}

/**
 * Generate Python requests code
 */
export function generatePythonCode(
  endpoint: ApiEndpoint,
  params?: Record<string, any>
): string {
  const url = `${endpoint.baseUrl}${endpoint.path}`;
  let code = `import requests\n\n`;

  if (endpoint.method === "GET") {
    code += `params = ${JSON.stringify(params || {}, null, 2)}
response = requests.get('${url}', params=params)
data = response.json()
print(data)`;
  } else if (endpoint.method === "POST") {
    code += `payload = ${JSON.stringify(params || {}, null, 2)}
response = requests.post('${url}', json=payload)
data = response.json()
print(data)`;
  }

  return code;
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: string): string {
  switch (category) {
    case "Data Access":
      return "📊";
    case "Tools":
      return "🛠️";
    case "Information":
      return "ℹ️";
    default:
      return "📌";
  }
}
