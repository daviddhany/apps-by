import type {
  AIActionResult,
  MiniAppSpecification,
  NeedClassification,
  Role,
  ToolDnaMatchResult,
} from "../types";

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
}
