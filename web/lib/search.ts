const MAX_CACHE_ENTRIES = 100;
const cache = new Map<string, Promise<SearchResponse>>();

type SearchResponse = Array<{
  id: string;
  name: string;
  category: string | null;
  last_index_value: number | null;
  slug?: string;
}>;

function cacheKey(query: string): string {
  return query.trim().toLowerCase();
}

function pruneCache(): void {
  if (cache.size <= MAX_CACHE_ENTRIES) {
    return;
  }
  const firstKey = cache.keys().next().value;
  if (firstKey) {
    cache.delete(firstKey);
  }
}

export async function searchItems(query: string): Promise<SearchResponse> {
  const key = cacheKey(query);
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const request = fetch(`/api/v1/search?q=${encodeURIComponent(query)}&type=item`, {
    headers: {
      Accept: "application/json",
    },
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Search failed with status ${response.status}`);
    }
    const payload = (await response.json()) as SearchResponse;
    return payload;
  });

  cache.set(key, request);
  pruneCache();

  try {
    return await request;
  } catch (error) {
    cache.delete(key);
    throw error;
  }
}

export function clearSearchCache(): void {
  cache.clear();
}
