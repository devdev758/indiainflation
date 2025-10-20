import React, { useState } from "react";
import { ChevronDown, ChevronUp, Code2, RefreshCw, AlertCircle } from "lucide-react";
import { TabbedCodeBlock, CodeBlock } from "@/components/CodeBlock";
import type { ApiEndpoint } from "@/lib/apiDocsData";

interface ApiEndpointCardProps {
  endpoint: ApiEndpoint;
  onTest?: (endpoint: ApiEndpoint) => Promise<void>;
  testLoading?: boolean;
  testError?: string;
  testResponse?: any;
}

export function ApiEndpointCard({
  endpoint,
  onTest,
  testLoading,
  testError,
  testResponse,
}: ApiEndpointCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden hover:shadow-md transition">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Method Badge */}
          <div className="flex-shrink-0">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white ${
                endpoint.method === "GET"
                  ? "bg-blue-600"
                  : endpoint.method === "POST"
                    ? "bg-green-600"
                    : "bg-orange-600"
              }`}
            >
              {endpoint.method}
            </span>
          </div>

          {/* Path & Title */}
          <div className="flex-1 min-w-0 text-left">
            <p className="font-semibold text-slate-900">{endpoint.title}</p>
            <p className="text-sm text-slate-600 font-mono truncate">{endpoint.path}</p>
          </div>
        </div>

        {/* Toggle Icon */}
        <div className="flex-shrink-0 text-slate-400">
          {expanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* Details */}
      {expanded && (
        <div className="border-t border-slate-200 divide-y divide-slate-200">
          {/* Description */}
          <div className="px-6 py-4 space-y-2">
            <h4 className="font-semibold text-slate-900">Description</h4>
            <p className="text-sm text-slate-700">{endpoint.description}</p>
          </div>

          {/* Parameters */}
          {endpoint.parameters.length > 0 && (
            <div className="px-6 py-4 space-y-3">
              <h4 className="font-semibold text-slate-900">Parameters</h4>
              <div className="space-y-2">
                {endpoint.parameters.map((param) => (
                  <div
                    key={param.name}
                    className="rounded-lg bg-slate-50 p-3 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-semibold text-slate-900">
                        {param.name}
                      </code>
                      <span className="text-xs font-mono text-slate-600">
                        {param.type}
                      </span>
                      {param.required && (
                        <span className="text-xs font-semibold text-red-600">
                          required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700">{param.description}</p>
                    {param.example && (
                      <p className="text-xs text-slate-600 font-mono">
                        Example: <code>{param.example}</code>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Examples */}
          <div className="px-6 py-4 space-y-4">
            <h4 className="font-semibold text-slate-900">Code Examples</h4>

            {/* Request Examples */}
            <TabbedCodeBlock
              title="Request"
              examples={[
                {
                  label: "cURL",
                  code: endpoint.exampleRequest.curl,
                  language: "bash",
                },
                {
                  label: "JavaScript",
                  code: endpoint.exampleRequest.javascript,
                  language: "javascript",
                },
                {
                  label: "Python",
                  code: endpoint.exampleRequest.python,
                  language: "python",
                },
              ]}
            />

            {/* Response Example */}
            <div className="space-y-2">
              <h5 className="text-sm font-semibold text-slate-900">Response</h5>
              <CodeBlock
                code={JSON.stringify(endpoint.exampleResponse, null, 2)}
                language="json"
                title={`Status ${endpoint.statusCode}`}
                copyable
              />
            </div>
          </div>

          {/* Test Button */}
          {onTest && (
            <div className="px-6 py-4">
              <button
                onClick={() => onTest(endpoint)}
                disabled={testLoading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {testLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Code2 className="h-4 w-4" />
                    Try It Out
                  </>
                )}
              </button>

              {testError && (
                <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">{testError}</div>
                  </div>
                </div>
              )}

              {testResponse && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-semibold text-green-600">
                    Response Received
                  </p>
                  <CodeBlock
                    code={JSON.stringify(testResponse, null, 2)}
                    language="json"
                    copyable
                  />
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="px-6 py-4 space-y-2">
            <h4 className="font-semibold text-slate-900">API Info</h4>
            <div className="grid gap-2 md:grid-cols-2">
              {endpoint.rateLimit && (
                <div>
                  <p className="text-xs text-slate-600">Rate Limit</p>
                  <p className="text-sm font-mono text-slate-900">
                    {endpoint.rateLimit}
                  </p>
                </div>
              )}
              {endpoint.cacheTime && (
                <div>
                  <p className="text-xs text-slate-600">Cache TTL</p>
                  <p className="text-sm font-mono text-slate-900">
                    {endpoint.cacheTime}
                  </p>
                </div>
              )}
              {endpoint.authentication && (
                <div>
                  <p className="text-xs text-slate-600">Authentication</p>
                  <p className="text-sm font-mono text-slate-900">
                    {endpoint.authentication}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-600">Base URL</p>
                <p className="text-sm font-mono text-slate-900">
                  {endpoint.baseUrl}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
