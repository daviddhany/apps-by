// Provider-agnostic generative planner: user prompt -> LLM -> composed
// MiniAppSpecification, built entirely from the primitive registry (never a
// named Tool DNA pick). This module depends on nothing but a
// `complete(prompt) => raw text` function, so any AIProvider (Gemini today,
// Anthropic/OpenAI later) plugs in by implementing that one closure — the
// prompt construction, JSON extraction, schema+capability validation, and
// one-shot repair retry all live here, once, shared by every provider.
//
// Every response is re-validated against the exact same
// MiniAppSpecificationSchema (and its expression-formula superRefine) used
// everywhere else in the app — the model's output is never trusted directly.
// A request that genuinely needs something outside the primitive registry
// gets a structured `unsupported_capability` result instead of being forced
// into the nearest available shape.

import type { MiniAppSpecification } from "../types";
import { MiniAppSpecificationSchema, ComponentKeySchema, FieldTypeSchema, ActionVerbSchema, RoleSchema } from "../validation/schema";
import { EXPRESSION_FUNCTION_NAMES } from "../primitives/expression";
import { extractJson } from "./jsonExtract";

export interface PlannerContext {
  hasExistingApps: boolean;
}

export type PlannerResult =
  | { status: "ok"; spec: MiniAppSpecification }
  | { status: "clarify"; question: string }
  | { status: "unsupported_capability"; missing: string; explanation: string };

// Components that hardcode their own field/entity names internally (one
// hand-built Tool DNA component each) — unsafe targets for a freshly
// generated spec, which has no way to know those hardcoded names. A
// generated spec must stick to the generic, binding-driven/record-driven
// remainder (derived from the live ComponentKey enum so this list can't
// silently drift from it — only the exclusions below are hand-maintained).
const TOOL_DNA_DEDICATED_COMPONENTS = new Set(["voting", "leaderboard", "bracket", "meeting_scheduler", "trivia_quiz", "daily_journal"]);
const GENERIC_SAFE_COMPONENTS = ComponentKeySchema.options.filter((c) => !TOOL_DNA_DEDICATED_COMPONENTS.has(c));

const FUNCTION_DESCRIPTIONS: Partial<Record<string, string>> = {
  count: "count(list) -> number of records",
  sum: "sum(list, 'field') -> total of a numeric field",
  groupCount: "groupCount(list, 'field') -> {value: count} per distinct field value",
  filter:
    "filter(list, 'field', value) -> rows where field === value; compose with count/sum/groupCount, e.g. count(filter(votes,'voterId',actor.id))==0 as a one-vote-per-person guard",
  groupSum: "groupSum(list, 'groupField', 'valueField') -> {value: total} per distinct groupField value, e.g. points standings",
  topNByGroup: "topNByGroup(list, 'groupField', n) -> the n most-frequent groupField values, ranked by count, as a string array",
  random: "random() -> a number between 0 and 1. Only usable inside an action's effects, never in a guard or computed formula.",
  pickRandom: "pickRandom(list) -> a random element of list. Only usable inside an action's effects.",
  pickRandomField: "pickRandomField(list, 'field') -> the field value of a randomly chosen row. Only usable inside an action's effects.",
};

function buildPrimitiveRegistryDescription(): string {
  const fieldTypes = FieldTypeSchema.options.join(", ");
  const components = GENERIC_SAFE_COMPONENTS.join(", ");
  const verbs = ActionVerbSchema.options.join(", ");
  const roles = RoleSchema.options.join(", ");
  const functions = EXPRESSION_FUNCTION_NAMES.map((name) => `- ${FUNCTION_DESCRIPTIONS[name] ?? name}`).join("\n");

  return `PRIMITIVE REGISTRY (the ONLY building blocks you may use — never invent one outside this list):

Field types (for each field in "fields"): ${fieldTypes}

Screen components (for each screen's "component"): ${components}
(These render generically or from a screen's "binding" — they carry no built-in concept. A "poll" screen reads screen.binding: titleField, optionsField, statusField, votesCollection, voteParentField, voteOptionField, voterField (all optional, sensible defaults). A "standings" screen reads screen.binding: computedKey (required — names a "computed" entry whose formula resolves to a {string: number} map), labelCollection + labelField (optional, to resolve a group key to a display name).)

Action verbs (for each action's "verb"): ${verbs}
- create_record: inserts a new row into the action's "entity" collection from the payload plus any "effects".
- update_record: the payload's "id" selects an existing row in "entity"; payload fields plus "effects" are merged in.
- delete_record: the payload's "id" selects a row in "entity" to remove.
An action may have a "guard" (a formula that must evaluate truthy or the action is rejected) and "effects" (field -> formula, computed once at write time and merged into the write).

Expression functions (usable in a "guard", an "effects" formula, or a "computed.formula"):
${functions}
Expressions may also use: number/string/boolean literals, + - * / %, == != < > <= >=, && || !, parentheses, and member access on the three reserved words "record" (the record an action is updating), "payload" (the action's submitted fields), and "actor" (the current user: actor.id, actor.role).

Roles (for "allowedRoles" on an action, and "roles"): ${roles}

A "computed" entry's "formula" must evaluate to either a number or a {string: number} map (e.g. via groupCount/groupSum) — screens bind to it by the computed entry's "key".`;
}

export const PRIMITIVE_REGISTRY_DESCRIPTION = buildPrimitiveRegistryDescription();

function buildPrompt(text: string, ctx: PlannerContext): string {
  return `You are designing a collaborative mini-app for a small group, entirely by composing the primitives below — never by picking a named template. Compose entities/fields/screens/actions/computed values that together produce exactly the experience the user describes.

${PRIMITIVE_REGISTRY_DESCRIPTION}

The user's request: "${text}"
${ctx.hasExistingApps ? "" : "(This is this user's first app.)"}

Respond with JSON only, no prose, matching exactly ONE of these three shapes:

1. A MiniAppSpecification: {"version":1,"toolDnaSlug":["<invent-one-kebab-case-slug>"],"title":"...","icon":"<a short generic icon word>","entities":["..."],"fields":{"<entity>":[{"key":"...","label":"...","type":"<field type>","required":true|false}]},"screens":[{"id":"...","title":"...","component":"<component>","entity":"<entity>","binding":{...}}],"features":[],"settings":{},"rules":[],"roles":[{"role":"owner","canManageMembers":true,"canEditSpec":true},{"role":"participant"}],"actions":[{"name":"add","entity":"<entity>","label":"...","allowedRoles":["owner","participant"],"verb":"create_record","guard":"...","effects":{...}}],"computed":[{"key":"...","label":"...","dependsOn":["<entity>"],"formula":"..."}]}

2. {"clarify": "<question>"} — ONLY when a detail necessary to define behavior is genuinely missing and has no sensible default (e.g. "make something for my football group" doesn't say what to track). Do NOT ask about a detail that has an obvious default — a fully-specified request (exact rules, exact fields, exact counts) should be generated directly, never clarified.

3. {"unsupported": {"missing": "<short name of what's missing>", "explanation": "<why the primitives above can't express it>"}} — ONLY when the request genuinely needs a capability outside the primitive registry above. Never force an unsupported idea into the nearest available primitive shape instead of reporting this.

Rules:
- "name" on an action must be one of: add, edit, delete, assign, split, calculate, vote, approve, reject, complete, archive, notify, invite, share, scan, filter, sort, search, duplicate, settle, randomize, record_score, advance_bracket, reserve, checkin — pick whichever reads closest to what the action does; the actual behavior comes entirely from "verb"/"guard"/"effects", not from this name.
- Every entity referenced anywhere (fields, screens, actions, computed.dependsOn) must be listed in "entities".
- roles[] must include at least "owner"; every action's allowedRoles must be a subset of the roles you declare.`;
}

type AttemptResult = PlannerResult | { status: "invalid"; raw: string; errors: string[] };

async function tryOnce(complete: (prompt: string) => Promise<string>, prompt: string): Promise<AttemptResult> {
  const raw = await complete(prompt);
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    return { status: "invalid", raw, errors: ["Response was not valid JSON"] };
  }

  if (parsed && typeof parsed === "object" && "unsupported" in parsed) {
    const u = (parsed as { unsupported?: { missing?: unknown; explanation?: unknown } }).unsupported;
    return {
      status: "unsupported_capability",
      missing: typeof u?.missing === "string" ? u.missing : "an unspecified capability",
      explanation:
        typeof u?.explanation === "string" ? u.explanation : "The model reported this request can't be built from the available primitives.",
    };
  }
  if (parsed && typeof parsed === "object" && "clarify" in parsed) {
    const q = (parsed as { clarify?: unknown }).clarify;
    return { status: "clarify", question: typeof q === "string" ? q : "Could you tell me more about what you need?" };
  }

  const result = MiniAppSpecificationSchema.safeParse(parsed);
  if (!result.success) {
    return { status: "invalid", raw, errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }

  const componentErrors = result.data.screens
    .filter((s) => !(GENERIC_SAFE_COMPONENTS as string[]).includes(s.component))
    .map(
      (s) =>
        `screens: component "${s.component}" is reserved for a hand-built Tool DNA and cannot be used by a generated spec — use one of: ${GENERIC_SAFE_COMPONENTS.join(", ")}`
    );
  if (componentErrors.length > 0) {
    return { status: "invalid", raw, errors: componentErrors };
  }

  return { status: "ok", spec: result.data };
}

export async function runGenerativePlanner(
  complete: (prompt: string) => Promise<string>,
  text: string,
  ctx: PlannerContext
): Promise<PlannerResult> {
  const prompt = buildPrompt(text, ctx);
  const first = await tryOnce(complete, prompt);
  if (first.status !== "invalid") return first;

  const repairPrompt = `${prompt}

Your previous response was:
${first.raw}

That response failed validation with these errors:
${first.errors.join("\n")}

Respond again with corrected JSON only, matching the same three possible shapes, fixing every error above.`;

  const second = await tryOnce(complete, repairPrompt);
  if (second.status === "invalid") {
    return {
      status: "unsupported_capability",
      missing: "a schema-valid generated app",
      explanation: `The generated app definition still failed validation after one repair attempt: ${second.errors.join("; ")}`,
    };
  }
  return second;
}
