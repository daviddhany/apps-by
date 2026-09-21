import type { ToolDnaDefinition, ToolDnaMatch, ToolDnaMatchResult } from "../types";
import { cosineSimilarity, embed } from "./embeddings";
import { listToolDna } from "../tool-dna/registry";

const REUSE_THRESHOLD = 0.4;
const REMIX_THRESHOLD = 0.18;
const COMPOSE_GAP = 0.08; // if 2+ distinct-category matches are within this gap of each other, compose

function keywordScore(text: string, def: ToolDnaDefinition): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const kw of def.keywords) {
    if (lower.includes(kw.toLowerCase())) hits += 1;
  }
  return hits / Math.max(def.keywords.length, 1);
}

export function matchToolDna(text: string, universe: ToolDnaDefinition[] = listToolDna()): ToolDnaMatchResult {
  const queryVec = embed(text);
  const candidates = universe.filter((d) => !d.composesFrom); // composite DNAs aren't matched directly, they're assembled from a compose decision

  const scored: ToolDnaMatch[] = candidates
    .map((def) => {
      const semantic = cosineSimilarity(queryVec, embed(`${def.name} ${def.description} ${def.keywords.join(" ")}`));
      const lexical = keywordScore(text, def);
      const score = semantic * 0.6 + lexical * 0.4;
      return { slug: def.slug, score };
    })
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { decision: "generate", matches: [] };
  }

  const top = scored[0];

  if (top.score >= REUSE_THRESHOLD) {
    // Check if a second, sufficiently distinct match also scores close to the
    // top one — that signals the request spans multiple domains (expenses +
    // voting + carpool, etc.) and should be composed rather than just reused.
    const strongOthers = scored.slice(1).filter((m) => top.score - m.score <= COMPOSE_GAP && m.score >= REMIX_THRESHOLD);
    if (strongOthers.length >= 1) {
      return { decision: "compose", matches: [top, ...strongOthers] };
    }
    return { decision: "reuse", matches: [top] };
  }

  if (top.score >= REMIX_THRESHOLD) {
    return { decision: "remix", matches: [top] };
  }

  return {
    decision: "clarify",
    matches: scored.slice(0, 3),
    clarifyingQuestion:
      "I'm not quite sure what kind of tool you need yet — could you describe what you and the group want to track or decide?",
  };
}
