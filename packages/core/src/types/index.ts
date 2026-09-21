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
  | "member_list";

export interface ScreenDef {
  id: string;
  title: string;
  icon?: string;
  component: ComponentKey;
  entity?: string; // which entity type this screen primarily displays
  config?: Record<string, unknown>;
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

export interface ActionDef {
  name: ActionName;
  entity?: string;
  label: string;
  destructive?: boolean;
  allowedRoles: Role[];
  payloadSchemaKey: string; // key into src/validation/actionPayloads.ts
}

export interface ComputedDef {
  key: string; // e.g. "balances", "standings", "tally"
  label: string;
  dependsOn: string[]; // entity names
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
