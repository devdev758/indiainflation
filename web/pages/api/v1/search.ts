import type { NextApiRequest, NextApiResponse } from "next";

type TypesenseDocument = {
  id?: string;
  slug?: string;
  name?: string;
  category?: string | null;
  last_index_value?: number | null;
};

type TypesenseSearchResponse = {
  hits?: Array<{ document: TypesenseDocument } | { document?: TypesenseDocument }>;
};

const TYPESENSE_HOST = (process.env.TYPESENSE_HOST ?? "http://typesense:8108").replace(/\/$/, "");
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY ?? "search-key";
const SEARCH_FIELDS = "search_document,name";

async function queryTypesense(collection: string, params: { q: string }): Promise<TypesenseSearchResponse> {
  const searchParams = new URLSearchParams({
    q: params.q,
    query_by: SEARCH_FIELDS,
  });
  const url = `${TYPESENSE_HOST}/collections/${collection}/documents/search?${searchParams.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-TYPESENSE-API-KEY": TYPESENSE_API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Typesense search failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as TypesenseSearchResponse;
}

function normaliseHits(payload: TypesenseSearchResponse): Array<{ id: string; name: string; category: string | null; last_index_value: number | null }> {
  const hits = payload.hits ?? [];
  return hits
    .map((hit) => hit.document ?? {})
    .map((doc) => {
      const id = doc.id ?? doc.slug ?? "";
      const name = doc.name ?? "";
      if (!id || !name) {
        return null;
      }
      return {
        id: String(id),
        name: String(name),
        category: doc.category ?? null,
        last_index_value: typeof doc.last_index_value === "number" ? doc.last_index_value : null,
      };
    })
    .filter((value): value is { id: string; name: string; category: string | null; last_index_value: number | null } => Boolean(value));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const qRaw = req.query.q;
  const q = typeof qRaw === "string" ? qRaw.trim() : Array.isArray(qRaw) ? qRaw[0]?.trim() ?? "" : "";

  if (!q) {
    res.status(400).json({ error: "Missing query" });
    return;
  }

  const typeRaw = typeof req.query.type === "string" ? req.query.type : Array.isArray(req.query.type) ? req.query.type[0] : undefined;
  const collection = typeRaw === "item" || !typeRaw ? "items" : "items";

  try {
    const response = await queryTypesense(collection, { q });
    const results = normaliseHits(response);
    res.status(200).json(results);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("search endpoint failed", error);
    }
    res.status(500).json({ error: "Search service unavailable" });
  }
}
