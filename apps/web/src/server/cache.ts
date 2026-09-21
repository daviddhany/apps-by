// In-process TTL cache standing in for Redis (ARCHITECTURE.md §0). Used for
// cheap wins like caching Tool DNA embeddings between requests within a
// single process. Swap for `ioredis` behind the same get/set interface to
// scale beyond one process.

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs = 5 * 60 * 1000): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}
