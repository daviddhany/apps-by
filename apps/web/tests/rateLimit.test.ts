import { describe, expect, it } from "vitest";
import { rateLimit } from "@/server/rateLimit";

describe("rate limiter", () => {
  it("allows requests up to the bucket capacity then blocks", () => {
    const key = `test-${Math.random()}`;
    const results = Array.from({ length: 6 }, () => rateLimit(key, { capacity: 5, refillPerSecond: 0 }));
    expect(results.filter(Boolean)).toHaveLength(5);
    expect(results[5]).toBe(false);
  });

  it("keeps separate buckets per key", () => {
    const a = rateLimit(`a-${Math.random()}`, { capacity: 1, refillPerSecond: 0 });
    const b = rateLimit(`b-${Math.random()}`, { capacity: 1, refillPerSecond: 0 });
    expect(a).toBe(true);
    expect(b).toBe(true);
  });
});
