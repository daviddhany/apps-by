import type {
  AIActionResult,
  MiniAppSpecification,
  NeedClassification,
  Role,
  RuleDef,
  ToolDnaMatchResult,
} from "../../types";
import type { AIProvider, AIProviderContext } from "../provider";
import type { PlannerContext, PlannerResult } from "../generativePlanner";
import { matchToolDna } from "../match";
import { getToolDna } from "../../tool-dna/registry";
import { buildSpec, mergeToolIntoSpec } from "../../tool-dna/buildSpec";
import { namespaceFor } from "../../tool-dna/namespaces";

const REMINDER_RE = /\bremind me\b|\bset a reminder\b|\bdon't forget\b/i;
const ICON_BY_SLUG: Record<string, string> = {
  "expense-splitter": "receipt",
  "knockout-tournament": "trophy",
  "attendance-tracker": "check-square",
  "shared-checklist": "check-square",
  "voting-board": "sparkles",
  "savings-tracker": "receipt",
  "habit-challenge": "trophy",
  "room-reservation": "sparkles",
  "group-order": "receipt",
  "trip-planner": "car",
  "meeting-scheduler": "check-square",
  "trivia-quiz": "trophy",
  "daily-journal": "sparkles",
};

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, sixteen: 16, thirty: 30, "thirty-two": 32,
};

function parseNumber(token: string): number | undefined {
  const n = Number(token);
  if (!Number.isNaN(n)) return n;
  return NUMBER_WORDS[token.toLowerCase()];
}

function extractPeopleCount(text: string): number | undefined {
  const m = text.match(/\b(\d+)\s+(friends|people|players|of us)\b/i);
  if (m) return Number(m[1]);
  return undefined;
}

/**
 * Fully offline, deterministic AIProvider. This is the default provider so
 * the whole product (intent -> match -> spec -> mutation) works with zero
 * external API calls, demonstrating that most requests never need an LLM.
 */
export class HeuristicAIProvider implements AIProvider {
  name = "heuristic";

  /** No language model available offline, so this is a light, honest
   * touch-up rather than a rewrite: fix casing/punctuation, and nudge in
   * the group language the matcher's keyword scoring responds to when the
   * draft reads like a solo task rather than something a group needs. */
  async improveNeed(text: string): Promise<string> {
    let improved = text.trim().replace(/\s+/g, " ");
    if (!improved) return improved;

    improved = improved[0].toUpperCase() + improved.slice(1);
    if (!/[.!?]$/.test(improved)) improved += ".";

    const hasGroupLanguage = /\b(we|us|our|team|friends|group|everyone|together|players|members)\b/i.test(improved);
    if (!hasGroupLanguage) {
      // Two independent sentences rather than splicing a lead-in before the
      // original text, so this reads fine whether the draft was a verb
      // phrase ("split our trip costs") or a noun phrase ("party planner").
      improved = `We're a group and need this. ${improved}`;
    }

    return improved;
  }

  async understandNeed(text: string, _context: AIProviderContext): Promise<NeedClassification> {
    // A single one-off reminder ("remind me to call mom at 6pm") is short and
    // names exactly one thing. A request that talks ABOUT building a
    // reminders/tasks *system* (mentions "app"/"tool", asks for recurring
    // schedules, multiple sentences, etc.) is a mini-app request that happens
    // to contain the word "remind" — it must not short-circuit here.
    const mentionsAppBuilding = /\bapp\b|\btool\b|\brecurring\b/i.test(text);
    const sentenceCount = (text.match(/[.!?]+/g) ?? []).length;
    const looksLikeAppDescription = mentionsAppBuilding || text.length > 160 || sentenceCount > 1;

    if (REMINDER_RE.test(text) && !looksLikeAppDescription) {
      const timeMatch = text.match(/\bat\s+(\d{1,2}(:\d{2})?\s?(am|pm)?)\b/i);
      return {
        kind: "reminder",
        confidence: 0.9,
        reminderText: text.replace(REMINDER_RE, "").trim(),
        reminderAt: timeMatch ? timeMatch[1] : undefined,
      };
    }

    // Short, question-shaped input with no group/collaboration language reads
    // as a plain question, not a tool request.
    const looksLikeQuestion = /\?$/.test(text.trim()) && text.split(" ").length < 12;
    const hasGroupLanguage = /\b(we|us|friends|team|group|everyone|together|players|members)\b/i.test(text);
    if (looksLikeQuestion && !hasGroupLanguage) {
      return {
        kind: "chat_answer",
        confidence: 0.6,
        chatAnswer:
          "I can help best when you describe something you and others need to track or coordinate — try describing the situation instead of asking a question.",
      };
    }

    return { kind: "mini_app", confidence: 0.75 };
  }

  async selectToolDNA(text: string): Promise<ToolDnaMatchResult> {
    return matchToolDna(text);
  }

  async generateSpecification(
    text: string,
    match: ToolDnaMatchResult,
    existingSpec?: MiniAppSpecification
  ): Promise<MiniAppSpecification> {
    if (match.decision === "clarify" || match.matches.length === 0) {
      throw new Error(match.clarifyingQuestion ?? "Need more detail to build this.");
    }

    const settings: Record<string, unknown> = {};
    const peopleCount = extractPeopleCount(text);
    const daysMatch = text.match(/\b(\d+)\s*-?\s*days?\b/i);

    if (match.decision === "reuse" || match.decision === "remix") {
      const def = getToolDna(match.matches[0].slug);
      if (!def) throw new Error("Matched Tool DNA not found");
      if (def.slug === "knockout-tournament" && peopleCount) settings.playerCount = peopleCount;
      if (def.slug === "habit-challenge" && daysMatch) settings.durationDays = Number(daysMatch[1]);
      return buildSpec(def, { title: guessTitle(text, def.name), settings, icon: ICON_BY_SLUG[def.slug] });
    }

    // compose: build a trip-planner-style composed spec if the request spans
    // trip/expense-ish territory, otherwise generically merge the top two
    // matches by starting from the top match and merging the runner-up in.
    const [top, ...rest] = match.matches;
    const topDef = getToolDna(top.slug);
    if (!topDef) throw new Error("Matched Tool DNA not found");

    const tripDef = getToolDna("trip-planner");
    const wantsTrip = /\btrip\b|\btravel\b|\bvacation\b/i.test(text) && tripDef;
    if (wantsTrip && tripDef) {
      return buildSpec(tripDef, { title: guessTitle(text, tripDef.name), settings, icon: ICON_BY_SLUG[tripDef.slug] });
    }

    let spec = buildSpec(topDef, { title: guessTitle(text, topDef.name), settings, icon: ICON_BY_SLUG[topDef.slug] });
    for (const m of rest) {
      spec = mergeToolIntoSpec(spec, m.slug);
    }
    return spec;
  }

  async mutateApplication(command: string, spec: MiniAppSpecification, actorRole: Role): Promise<AIActionResult> {
    const text = command.trim();

    // "add <button/field/page/tab/...>" describes a UI control, not a person
    // to add — never mistake it for "add <name>" below. There's no
    // custom-button concept in the runtime, so say so plainly instead of
    // silently creating a bogus participant named e.g. "reset button".
    const addControlMatch = text.match(/^add\s+(?:an?\s+)?(.+?)\s+(button|field|page|screen|tab|column|section|toggle|link)\b/i);
    if (addControlMatch) {
      return {
        type: "clarify",
        question:
          "This app doesn't support custom buttons yet — only its data fields, screens, and rules can be changed. Try something like \"add a phone field\", \"add a page where we vote\", or \"remove the standings screen\".",
      };
    }

    // "add <name>" -> add to the primary person-like entity present in this spec
    const addPersonMatch = text.match(/^add\s+([a-z][a-z .'-]{1,40})\.?$/i);
    if (addPersonMatch) {
      const personEntity = spec.entities.find((e) => /participant|player$/i.test(e));
      if (personEntity) {
        return {
          type: "mutation",
          mutation: { action: "add", entity: personEntity, payload: { entityType: personEntity, fields: { name: addPersonMatch[1].trim() } } },
        };
      }
    }

    // "<name> paid <amount> [currency] for <description>"
    const expenseMatch = text.match(/^(.+?)\s+paid\s+([\d.]+)\s*[a-z]*\s+for\s+(.+)$/i);
    if (expenseMatch && spec.entities.includes(`${namespaceFor("expense-splitter")}.expense`)) {
      const [, payer, amountStr, description] = expenseMatch;
      return {
        type: "mutation",
        mutation: {
          action: "add",
          entity: "expense.expense",
          payload: { description: description.trim(), amount: Number(amountStr), paidByParticipantId: payer.trim() },
        },
      };
    }

    // "vote for <option>"
    const voteMatch = text.match(/^vote\s+for\s+(.+)$/i);
    if (voteMatch && spec.entities.some((e) => e === "voting.poll")) {
      return {
        type: "mutation",
        mutation: { action: "vote", entity: "voting.vote", payload: { optionId: "__resolve_by_label__", optionLabel: voteMatch[1].trim(), pollId: "__open_poll__" } },
      };
    }

    // "check off <item>" / "mark <item> done"
    const checkMatch = text.match(/^(?:check off|mark)\s+(.+?)(?:\s+as\s+done|\s+done)?$/i);
    if (checkMatch && spec.entities.includes("checklist.item")) {
      return {
        type: "mutation",
        mutation: { action: "complete", entity: "checklist.item", payload: { itemId: "__resolve_by_label__", itemLabel: checkMatch[1].trim(), done: true } },
      };
    }

    // "change the tournament to N players"
    const playersMatch = text.match(/\bto\s+(\d+|\w+)\s+players?\b/i);
    if (playersMatch && "playerCount" in spec.settings) {
      const n = parseNumber(playersMatch[1]);
      if (n) return { type: "spec_patch", ops: [{ op: "update_setting", key: "playerCount", value: n }], summary: `Set player count to ${n}` };
    }

    // "make the final best of three/N"
    const bestOfMatch = text.match(/\bbest of\s+(\d+|\w+)\b/i);
    if (bestOfMatch && "bestOf" in spec.settings) {
      const n = parseNumber(bestOfMatch[1]);
      if (n) return { type: "spec_patch", ops: [{ op: "update_setting", key: "bestOf", value: n }], summary: `Set best-of to ${n}` };
    }

    // "add voting" / "add a page where we vote"
    if (/\bvot(e|ing)\b/i.test(text) && /\badd\b/i.test(text) && !spec.toolDnaSlug.includes("voting-board")) {
      return { type: "spec_patch", ops: [], summary: "__merge_tool__voting-board" };
    }

    // "add phone numbers to participants" -> add a phone field
    if (/\bphone\b/i.test(text) && /\badd\b/i.test(text)) {
      const personEntity = spec.entities.find((e) => /participant|player$/i.test(e));
      if (personEntity) {
        return {
          type: "spec_patch",
          ops: [{ op: "add_field", entity: personEntity, field: { key: "phone", label: "Phone", type: "text" } }],
          summary: "Added a phone number field",
        };
      }
    }

    // "remove the X section/screen"
    const removeMatch = text.match(/\bremove\s+the\s+([a-z ]+?)\s+(section|screen|page)\b/i);
    if (removeMatch) {
      const target = removeMatch[1].trim().toLowerCase();
      const screen = spec.screens.find((s) => s.title.toLowerCase().includes(target) || s.id.toLowerCase().includes(target));
      if (screen) {
        return { type: "spec_patch", ops: [{ op: "remove_screen", screenId: screen.id }], summary: `Removed the ${screen.title} screen` };
      }
    }

    // "only admins can edit scores" / "only admins can <verb> <noun>"
    const restrictMatch = text.match(/^only\s+(admins?|owners?)\s+can\s+(edit|record|enter)\s+scores?/i);
    if (restrictMatch) {
      const rule: RuleDef = {
        id: `restrict-record_score-${Date.now()}`,
        type: "restrict_action",
        action: "record_score",
        value: ["owner", "admin"],
      };
      return { type: "spec_patch", ops: [{ op: "add_rule", rule }], summary: "Only owners/admins can record scores" };
    }

    return {
      type: "clarify",
      question:
        "I didn't recognize that command. Try things like \"Add Ahmed\", \"Ahmed paid 20 for dinner\", or use the + button on the relevant screen.",
    };
  }

  async summarizeApplication(spec: MiniAppSpecification): Promise<string> {
    return `${spec.title}: ${spec.entities.length} data types across ${spec.screens.length} screens.`;
  }

  /** No LLM available offline, so this can't compose a novel spec from the
   * primitive registry — it's today's exact selectToolDNA + generateSpecification
   * behavior, reshaped to PlannerResult, so callers can invoke planApp
   * uniformly regardless of which provider is active. */
  async planApp(text: string, _context: PlannerContext): Promise<PlannerResult> {
    const match = await this.selectToolDNA(text);
    if (match.decision === "clarify") {
      return { status: "clarify", question: match.clarifyingQuestion ?? "Could you tell me more about what you need?" };
    }
    try {
      const spec = await this.generateSpecification(text, match);
      return { status: "ok", spec };
    } catch (err) {
      return { status: "clarify", question: err instanceof Error ? err.message : "Could you describe that differently?" };
    }
  }
}

function guessTitle(text: string, fallback: string): string {
  const dahabMatch = text.match(/\bto\s+([A-Z][a-zA-Z]+)\b/);
  if (dahabMatch) return `${dahabMatch[1]} ${fallback}`;
  return fallback;
}
