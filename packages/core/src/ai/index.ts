import type { AIProvider } from "./provider";
import { HeuristicAIProvider } from "./providers/heuristic";
import { AnthropicAIProvider } from "./providers/anthropic";

let cached: AIProvider | null = null;
let cachedKey: string | undefined;

/**
 * Takes the Anthropic API key explicitly rather than reading `process.env`
 * directly, so this module works unmodified in both the Next.js server
 * (where the key comes from `.env`) and the Expo/React Native app (where it
 * would come from a build-time `EXPO_PUBLIC_*` var or, in production, from
 * the mobile client's own backend call instead of holding the key at all —
 * see ARCHITECTURE.md's mobile notes).
 */
export function getAIProvider(apiKey?: string): AIProvider {
  if (cached && cachedKey === apiKey) return cached;
  cached = apiKey ? new AnthropicAIProvider(apiKey) : new HeuristicAIProvider();
  cachedKey = apiKey;
  return cached;
}

export type { AIProvider } from "./provider";
