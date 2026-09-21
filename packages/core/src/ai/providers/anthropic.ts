import Anthropic from "@anthropic-ai/sdk";
import type { AIActionResult, MiniAppSpecification, Role, ToolDnaMatchResult } from "../../types";
import type { AIProvider, AIProviderContext } from "../provider";
import { HeuristicAIProvider } from "./heuristic";
import { AIActionResultSchema, MiniAppSpecificationSchema } from "../../validation/schema";
import { listSimpleToolDna } from "../../tool-dna/registry";

/**
 * Wraps HeuristicAIProvider: the deterministic matching pipeline
 * (understandNeed/selectToolDNA) is reused as-is per ARCHITECTURE.md §6 cost
 * optimization — an LLM call only happens for the two paths that genuinely
 * need language understanding: generating a brand-new structure ("generate"
 * decision) and free-form natural-language mutation commands the heuristic
 * parser couldn't classify. Every LLM output is re-validated against the same
 * zod schemas as the heuristic path before it can touch the database.
 */
export class AnthropicAIProvider implements AIProvider {
  name = "anthropic";
  private base = new HeuristicAIProvider();
  private client: Anthropic;
  private model = "claude-sonnet-5";

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async improveNeed(text: string): Promise<string> {
    if (!text.trim()) return text;
    const prompt = `Rewrite this draft description of something a group needs so it's clearer and more detailed, so it can be used to generate a collaborative mini-app: "${text}".
Keep the user's original intent and meaning exactly — just fill in the kind of detail that's missing (who's involved, roughly how many people, what specifically should be tracked or decided). Keep it to 1-2 sentences, first person plural ("we"). Respond with ONLY the rewritten text, no quotes, no preamble.`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      });
      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") return this.base.improveNeed(text);
      const improved = textBlock.text.trim().replace(/^["']|["']$/g, "");
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

  async generateSpecification(
    text: string,
    match: ToolDnaMatchResult,
    existingSpec?: MiniAppSpecification
  ): Promise<MiniAppSpecification> {
    if (match.decision !== "generate" && match.decision !== "clarify") {
      return this.base.generateSpecification(text, match, existingSpec);
    }

    const toolCatalog = listSimpleToolDna().map((d) => ({ slug: d.slug, name: d.name, description: d.description }));
    const prompt = `A user described this need for a collaborative mini-app: "${text}".
None of our existing reusable Tool DNA templates matched well: ${JSON.stringify(toolCatalog)}.
Produce a JSON MiniAppSpecification (fields: version, toolDnaSlug (array of strings, invent one new slug), title, icon, entities, fields, screens, features, settings, rules, roles, actions, computed) that models this need using ONLY these universal component keys for screens: list, table, cards, form, checklist, calendar, timeline, kanban, counter, progress, chart, voting, leaderboard, bracket, gallery, dashboard, member_list. Respond with JSON only, no prose.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("AI provider returned no content");

    const parsed = JSON.parse(extractJson(textBlock.text));
    const result = MiniAppSpecificationSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error("AI-generated specification failed validation: " + result.error.message);
    }
    return result.data;
  }

  async mutateApplication(command: string, spec: MiniAppSpecification, actorRole: Role): Promise<AIActionResult> {
    const heuristicResult = await this.base.mutateApplication(command, spec, actorRole);
    if (heuristicResult.type !== "clarify") return heuristicResult;

    const allowedActions = spec.actions.filter((a) => a.allowedRoles.includes(actorRole));
    const prompt = `A user typed this command inside a running mini-app: "${command}".
The ONLY actions you may choose from (the app's allowlist for this user's role) are: ${JSON.stringify(allowedActions)}.
The app's current entities are: ${JSON.stringify(spec.entities)}.
Respond with JSON only matching one of:
{"type":"mutation","mutation":{"action":"<one of the allowed action names>","entity":"<entity>","payload":{...}}}
{"type":"spec_patch","ops":[...],"summary":"..."}
{"type":"clarify","question":"..."}
If the command doesn't map to an allowed action, respond with the clarify form. Never invent an action name that isn't in the allowlist above.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { type: "clarify", question: "I couldn't understand that command." };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(textBlock.text));
    } catch {
      return { type: "clarify", question: "I couldn't understand that command." };
    }

    const result = AIActionResultSchema.safeParse(parsed);
    if (!result.success) {
      return { type: "clarify", question: "I couldn't understand that command." };
    }

    // Re-enforce the allowlist even though the prompt already constrained it —
    // the model's output is never trusted implicitly (ARCHITECTURE.md §7).
    const data = result.data;
    if (data.type === "mutation") {
      const mutation = data.mutation;
      const allowed = allowedActions.some((a) => a.name === mutation.action && (!a.entity || a.entity === mutation.entity));
      if (!allowed) {
        return { type: "clarify", question: "That action isn't permitted here." };
      }
    }

    return data;
  }

  summarizeApplication(spec: MiniAppSpecification) {
    return this.base.summarizeApplication(spec);
  }
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1];
  return text;
}
