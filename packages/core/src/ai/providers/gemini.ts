import { GoogleGenAI } from "@google/genai";
import type { AIActionResult, MiniAppSpecification, Role, ToolDnaMatchResult } from "../../types";
import type { AIProvider, AIProviderContext } from "../provider";
import type { PlannerContext, PlannerResult } from "../generativePlanner";
import { HeuristicAIProvider } from "./heuristic";
import { MiniAppSpecificationSchema } from "../../validation/schema";
import { listSimpleToolDna } from "../../tool-dna/registry";
import { runGenerativePlanner } from "../generativePlanner";
import { extractJson } from "../jsonExtract";

/**
 * Mirrors AnthropicAIProvider's structure: wraps HeuristicAIProvider for the
 * deterministic paths (understandNeed/selectToolDNA/mutateApplication/
 * summarizeApplication), and only makes real Gemini calls for improveNeed,
 * generateSpecification (kept for interface completeness — used by
 * reuse/remix/compose decisions), and planApp — the primary path for new app
 * creation, see generativePlanner.ts. Every LLM output is re-validated
 * against the same zod schemas as the heuristic path before it can touch
 * the database.
 */
export class GeminiAIProvider implements AIProvider {
  name = "gemini";
  private base = new HeuristicAIProvider();
  private client: GoogleGenAI;
  private model = "gemini-flash-latest";

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async improveNeed(text: string): Promise<string> {
    if (!text.trim()) return text;
    const prompt = `Rewrite this draft description of something a group needs so it's clearer and more detailed, so it can be used to generate a collaborative mini-app: "${text}".
Keep the user's original intent and meaning exactly — just fill in the kind of detail that's missing (who's involved, roughly how many people, what specifically should be tracked or decided). Keep it to 1-2 sentences, first person plural ("we"). Respond with ONLY the rewritten text, no quotes, no preamble.`;

    try {
      const response = await this.client.models.generateContent({ model: this.model, contents: prompt });
      const improved = (response.text ?? "").trim().replace(/^["']|["']$/g, "");
      return improved || this.base.improveNeed(text);
    } catch {
      return this.base.improveNeed(text);
    }
  }

  understandNeed(text: string, context: AIProviderContext) {
    return this.base.understandNeed(text, context);
  }

  selectToolDNA(text: string) {
    return this.base.selectToolDNA(text);
  }

  async generateSpecification(text: string, match: ToolDnaMatchResult, existingSpec?: MiniAppSpecification): Promise<MiniAppSpecification> {
    if (match.decision !== "generate" && match.decision !== "clarify") {
      return this.base.generateSpecification(text, match, existingSpec);
    }

    const toolCatalog = listSimpleToolDna().map((d) => ({ slug: d.slug, name: d.name, description: d.description }));
    const prompt = `A user described this need for a collaborative mini-app: "${text}".
None of our existing reusable Tool DNA templates matched well: ${JSON.stringify(toolCatalog)}.
Produce a JSON MiniAppSpecification (fields: version, toolDnaSlug (array of strings, invent one new slug), title, icon, entities, fields, screens, features, settings, rules, roles, actions, computed) that models this need using ONLY these universal component keys for screens: list, table, cards, form, checklist, calendar, timeline, kanban, counter, progress, chart, voting, leaderboard, bracket, gallery, dashboard, member_list. Respond with JSON only, no prose.`;

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    if (!response.text) throw new Error("AI provider returned no content");

    const parsed = JSON.parse(extractJson(response.text));
    const result = MiniAppSpecificationSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error("AI-generated specification failed validation: " + result.error.message);
    }
    return result.data;
  }

  async mutateApplication(command: string, spec: MiniAppSpecification, actorRole: Role): Promise<AIActionResult> {
    return this.base.mutateApplication(command, spec, actorRole);
  }

  summarizeApplication(spec: MiniAppSpecification) {
    return this.base.summarizeApplication(spec);
  }

  async planApp(text: string, context: PlannerContext): Promise<PlannerResult> {
    return runGenerativePlanner(
      async (prompt) => {
        const response = await this.client.models.generateContent({
          model: this.model,
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        if (!response.text) throw new Error("AI provider returned no content");
        return response.text;
      },
      text,
      context
    );
  }
}
