type RouteResult = {
  route: string;
  status: number;
  ok: boolean;
  structuredDataCount: number;
  errors: string[];
};

const ROUTES = ["/", "/cpi-dashboard", "/compare", "/datasets", "/inflation-history", "/articles", "/calculators"];

function extractJsonLd(html: string): string[] {
  const matches = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  return matches.map((match) => match[1].trim());
}

async function fetchRoute(base: string, route: string): Promise<RouteResult> {
  const url = new URL(route.replace(/^\/+/, ""), `${base.replace(/\/$/, "")}/`).toString();
  const errors: string[] = [];
  try {
    const response = await fetch(url, { method: "GET" });
    const status = response.status;
    const ok = response.ok;
    const body = await response.text();
    const snippets = extractJsonLd(body);
    snippets.forEach((snippet, index) => {
      try {
        JSON.parse(snippet);
      } catch (error) {
        errors.push(`Failed to parse JSON-LD block ${index + 1}: ${(error as Error).message}`);
      }
    });
    return { route, status, ok, structuredDataCount: snippets.length, errors };
  } catch (error) {
    return {
      route,
      status: 0,
      ok: false,
      structuredDataCount: 0,
      errors: [`Request failed: ${(error as Error).message}`]
    };
  }
}

async function main(): Promise<void> {
  const base = process.env.SITE_BASE ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const results: RouteResult[] = [];

  for (const route of ROUTES) {
    const result = await fetchRoute(base, route);
    results.push(result);
  }

  const summary = {
    base,
    generatedAt: new Date().toISOString(),
    results
  };

  console.log(JSON.stringify(summary, null, 2));

  const failures = results.filter((result) => !result.ok || result.structuredDataCount === 0 || result.errors.length > 0);
  if (failures.length > 0) {
    const messages = failures.map((failure) => `${failure.route}: status=${failure.status}, structuredData=${failure.structuredDataCount}, errors=${failure.errors.join("; ")}`);
    throw new Error(`Structured data validation failed:\n${messages.join("\n")}`);
  }
}

main().catch((error) => {
  console.error("Structured data validation failed", error);
  process.exitCode = 1;
});
