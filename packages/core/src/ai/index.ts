import type { AIProvider } from "./provider";
import { HeuristicAIProvider } from "./providers/heuristic";
import { AnthropicAIProvider } from "./providers/anthropic";
import { GeminiAIProvider } from "./providers/gemini";

let cached: AIProvider | null = null;
let cachedKey: string | undefined;

export interface AIProviderKeys {
  anthropicKey?: string;
  geminiKey?: string;
}

/**
 * Takes API keys explicitly rather than reading `process.env` directly, so
 * this module works unmodified in both the Next.js server (where keys come
 * from `.env`) and the Expo/React Native app (where they would come from a
 * build-time `EXPO_PUBLIC_*` var or, in production, from the mobile client's
 * own backend call instead of holding a key at all — see ARCHITECTURE.md's
 * mobile notes). Precedence: Anthropic, then Gemini, then the fully offline
 * HeuristicAIProvider when neither key is set.
 */
export function getAIProvider(keys: AIProviderKeys = {}): AIProvider {
  const cacheKey = `${keys.anthropicKey ?? ""}|${keys.geminiKey ?? ""}`;
  if (cached && cachedKey === cacheKey) return cached;
  cached = keys.anthropicKey
    ? new AnthropicAIProvider(keys.anthropicKey)
    : keys.geminiKey
      ? new GeminiAIProvider(keys.geminiKey)
      : new HeuristicAIProvider();
  cachedKey = cacheKey;
  return cached;
}

export type { AIProvider } from "./provider";
