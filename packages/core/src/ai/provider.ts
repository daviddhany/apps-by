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
