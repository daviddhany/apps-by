// Deterministic hashed bag-of-words vectorizer used as the pgvector stand-in
// (ARCHITECTURE.md §0, §8). Not a real semantic embedding model, but it gives
// a stable numeric vector + cosine similarity we can swap 1:1 for a real
// embedding provider or a Postgres `vector` column later — the call sites
// only depend on `embed()` and `cosineSimilarity()`.

const VECTOR_DIM = 256;

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "of", "to", "for", "in", "on", "at", "with",
  "we", "our", "us", "is", "are", "want", "would", "like", "i", "my", "me",
  "this", "that", "it", "be", "some", "all",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function hashToken(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % VECTOR_DIM;
}

export function embed(text: string): number[] {
  const vec = new Array(VECTOR_DIM).fill(0);
  const tokens = tokenize(text);
  for (const t of tokens) {
    vec[hashToken(t)] += 1;
  }
  // also hash bigrams for a bit more discrimination ("group order" vs "order")
  for (let i = 0; i < tokens.length - 1; i++) {
    vec[hashToken(tokens[i] + "_" + tokens[i + 1])] += 0.5;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return dot; // already normalized in embed()
}
