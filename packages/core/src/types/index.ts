// Shared domain types. Kept dependency-free (no Prisma/Next imports) so this
// folder can be lifted into a standalone `packages/types` later.

export type FieldType =
  | "text"
  | "number"
  | "money"
  | "date"
  | "time"
  | "boolean"
  | "person"
  | "select"
  | "multiselect"
  | "rating"
  | "image"
  | "location"
  | "status";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[]; // for select/multiselect/status
  default?: unknown;
}

export interface EntityDef {
  name: string; // namespaced at composition time, e.g. "expense.participant"
  label: string;
  fields: FieldDef[];
}

export type ComponentKey =
  | "list"
  | "table"
  | "cards"
  | "form"
  | "checklist"
  | "calendar"
  | "timeline"
  | "kanban"
  | "counter"
  | "progress"
  | "chart"
  | "voting"
  | "leaderboard"
  | "bracket"
  | "gallery"
  | "dashboard"
  | "member_list"
  | "meeting_scheduler"
  | "trivia_quiz"
  | "daily_journal"
  | "poll"
  | "standings";

export interface ScreenDef {
  id: string;
  title: string;
  icon?: string;
  component: ComponentKey;
  entity?: string; // which entity type this screen primarily displays
  config?: Record<string, unknown>;
  // Generic-primitive components (see packages/core/src/primitives/) read their
  // collection/field wiring from here instead of hardcoding entity names —
  // e.g. { optionsCollection: "pollset", votesCollection: "pollvote" }.
  // Dedicated Tool DNA components ignore this.
  binding?: Record<string, string>;
}

export type ActionName =
  | "add"
  | "edit"
  | "delete"
  | "assign"
  | "split"
  | "calculate"
  | "vote"
  | "approve"
  | "reject"
  | "complete"
  | "archive"
  | "notify"
  | "invite"
  | "share"
  | "scan"
  | "filter"
  | "sort"
  | "search"
  | "duplicate"
  | "settle"
  | "randomize"
  | "record_score"
  | "advance_bracket"
  | "reserve"
  | "checkin";

// The generic action engine's verb vocabulary (packages/core/src/primitives/
// actionEngine.ts). A fixed, whitelisted set — never a free-form string — so
// every generic action still reduces to one of a small number of vetted DB
// operations, the same allowlist guarantee the legacy payloadSchemaKey switch
// gives today.
export type ActionVerb = "create_record" | "update_record" | "delete_record";

export interface ActionDef {
  name: ActionName;
  entity?: string; // for a generic-verb action, this is the target collection
  label: string;
  destructive?: boolean;
  allowedRoles: Role[];
  // Present on every existing (legacy) action; a generic-verb action may omit
  // it in favor of `verb` below — exactly one of the two should be set.
  payloadSchemaKey?: string; // key into src/validation/schema.ts's ActionPayloadSchemas
  // Generic primitive path (packages/core/src/primitives/). When `verb` is
  // set, executeAction.ts runs this action through the generic engine
  // instead of the legacy payloadSchemaKey switch.
  verb?: ActionVerb;
  guard?: string; // formula string; must evaluate truthy or the action is rejected
  effects?: Record<string, string>; // field -> formula, merged into the write
}

export interface ComputedDef {
  key: string; // e.g. "balances", "standings", "tally"
  label: string;
  dependsOn: string[]; // entity names
  // Generic primitive path: a formula string evaluated by
  // packages/core/src/primitives/computeEngine.ts. When absent, falls back
  // to computeForSpec.ts's legacy switch(key).
  formula?: string;
}

export type ParameterType = "number" | "text" | "boolean" | "select";

export interface ParameterDef {
  key: string;
  label: string;
  type: ParameterType;
  options?: string[];
  default: unknown;
}

export type Role = "owner" | "admin" | "editor" | "participant" | "viewer";

export interface RoleDef {
  role: Role;
  canManageMembers?: boolean;
  canEditSpec?: boolean;
}

export interface RuleDef {
  id: string;
  type: "restrict_action" | "require_field" | "default_split_exclude";
  action?: ActionName;
  entity?: string;
  condition?: string; // small expression string, evaluated by src/runtime/rules.ts
  value?: unknown;
}

export interface ToolDnaDefinition {
  slug: string;
  name: string;
  category: string;
  description: string;
  keywords: string[];
  composesFrom?: string[];
  entities: EntityDef[];
  screens: ScreenDef[];
  actions: ActionDef[];
  computed: ComputedDef[];
  parameters: ParameterDef[];
  roles: RoleDef[];
  defaultSettings: Record<string, unknown>;
}

export interface MiniAppSpecification {
  version: number;
  toolDnaSlug: string[]; // one entry, or many for composed apps
  title: string;
  icon: string;
  entities: string[];
  fields: Record<string, FieldDef[]>;
  screens: ScreenDef[];
  features: string[];
  settings: Record<string, unknown>;
  rules: RuleDef[];
  roles: RoleDef[];
  actions: ActionDef[];
  computed: ComputedDef[];
}

export type MatchDecision = "reuse" | "remix" | "compose" | "generate" | "clarify";

export interface ToolDnaMatch {
  slug: string;
  score: number;
}

export interface ToolDnaMatchResult {
  decision: MatchDecision;
  matches: ToolDnaMatch[];
  clarifyingQuestion?: string;
}

export type NeedDecisionKind = "chat_answer" | "reminder" | "mini_app" | "modify_app";

export interface NeedClassification {
  kind: NeedDecisionKind;
  confidence: number;
  reminderText?: string;
  reminderAt?: string; // ISO date, best-effort parse
  chatAnswer?: string;
}

export interface StructuredMutation {
  action: ActionName;
  entity?: string;
  payload: Record<string, unknown>;
  confirmRequired?: boolean;
}

// Natural-language app-evolution commands ("add a page where we vote", "only
// admins can edit scores") compile to one or more of these ops instead of
// arbitrary code. Applied additively by src/runtime/patchSpec.ts.
export type SpecPatchOp =
  | { op: "add_field"; entity: string; field: FieldDef }
  | { op: "add_screen"; screen: ScreenDef }
  | { op: "remove_screen"; screenId: string }
  | { op: "add_rule"; rule: RuleDef }
  | { op: "update_setting"; key: string; value?: unknown };

export type AIActionResult =
  | { type: "mutation"; mutation: StructuredMutation }
  | { type: "spec_patch"; ops: SpecPatchOp[]; summary: string }
  | { type: "clarify"; question: string };
