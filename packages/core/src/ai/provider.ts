import type {
  AIActionResult,
  MiniAppSpecification,
  NeedClassification,
  Role,
  ToolDnaMatchResult,
} from "../types";
import type { PlannerContext, PlannerResult } from "./generativePlanner";

export interface AIProviderContext {
  hasExistingApps: boolean;
}

export interface AIProvider {
  name: string;
  /** Rewrites a draft need-description into something clearer/more detailed
   * before the user submits it — never changes the user's underlying intent,
   * just fills in the kind of detail the matching pipeline responds well to
   * (group context, what's being tracked/decided, rough scale). */
  improveNeed(text: string): Promise<string>;
  understandNeed(text: string, context: AIProviderContext): Promise<NeedClassification>;
  selectToolDNA(text: string): Promise<ToolDnaMatchResult>;
  generateSpecification(
    text: string,
    match: ToolDnaMatchResult,
    existingSpec?: MiniAppSpecification
  ): Promise<MiniAppSpecification>;
  mutateApplication(command: string, spec: MiniAppSpecification, actorRole: Role): Promise<AIActionResult>;
  summarizeApplication(spec: MiniAppSpecification): Promise<string>;
  /** Composes a MiniAppSpecification directly from the primitive registry
   * (see generativePlanner.ts) instead of matching a named Tool DNA — the
   * primary path for new app creation when a real LLM is configured.
   * HeuristicAIProvider's implementation falls back to today's
   * selectToolDNA + generateSpecification behavior, reshaped to this same
   * result type, so callers can invoke this uniformly regardless of which
   * provider is active. */
  planApp(text: string, context: PlannerContext): Promise<PlannerResult>;
}
