// In-memory token bucket, per key (e.g. `${ip}:${joinCode}`). Fine for a
// single-process MVP; swap for a Redis-backed bucket for multi-instance
// deployment (ARCHITECTURE.md §10).

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, opts: { capacity: number; refillPerSecond: number }): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: opts.capacity, lastRefill: now };
  const elapsedSeconds = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(opts.capacity, bucket.tokens + elapsedSeconds * opts.refillPerSecond);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}
