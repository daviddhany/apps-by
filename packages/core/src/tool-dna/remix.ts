import type { ToolDnaDefinition } from "../types";

const PARAM_HINTS: { pattern: RegExp; paramKey: string }[] = [
  { pattern: /(\d+)\s*players?/i, paramKey: "playerCount" },
  { pattern: /(\d+)\s*[- ]?days?/i, paramKey: "durationDays" },
  { pattern: /best of\s*(\d+)/i, paramKey: "bestOf" },
];

/**
 * Heuristic remix: applies a natural-language tweak instruction to a Tool DNA
 * definition's parameters/description without touching its entity/action
 * shape. Good enough for "make this work for 32 players instead of 16"; a
 * genuinely structural remix (new entities) would go through the AIProvider's
 * generateSpecification "generate" path instead.
 */
export function applyRemixToDefinition(def: ToolDnaDefinition, instruction: string, newName?: string): ToolDnaDefinition {
  const next: ToolDnaDefinition = structuredClone(def);
  next.description = `${def.description} (Remix: ${instruction})`;
  if (newName) next.name = newName;

  for (const hint of PARAM_HINTS) {
    const match = instruction.match(hint.pattern);
    if (match && hint.paramKey in next.defaultSettings) {
      next.defaultSettings[hint.paramKey] = Number(match[1]);
    }
  }

  return next;
}
