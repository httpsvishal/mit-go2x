/**
 * In-memory and sessionStorage cache keyed by generatedAt.
 * Shared raw files are fetched only once.
 */

const memoryCache = new Map<string, any>();

export async function fetchWithCache(url: string, generatedAt?: string): Promise<string> {
  const cacheKey = `go2x_data_${url}_${generatedAt || 'v1'}`;

  // Check in-memory first
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  // Check sessionStorage in browser
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = sessionStorage.getItem(cacheKey);
      if (stored) {
        memoryCache.set(cacheKey, stored);
        return stored;
      }
    } catch {
      // sessionStorage might be restricted or full; ignore
    }
  }

  // Fetch with cache-busting query parameter
  const fetchUrl = generatedAt ? `${url}?v=${encodeURIComponent(generatedAt)}` : url;
  const res = await fetch(fetchUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();

  memoryCache.set(cacheKey, text);

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.setItem(cacheKey, text);
    } catch {
      // ignore quota exceeded
    }
  }

  return text;
}

export function clearCache(): void {
  memoryCache.clear();
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('go2x_data_')) {
          keysToRemove.push(key);
        }
      }
      for (const k of keysToRemove) {
        sessionStorage.removeItem(k);
      }
    } catch {
      // ignore
    }
  }
}
