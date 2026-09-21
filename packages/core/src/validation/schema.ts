import { z } from "zod";
import { validateExpression } from "../primitives/expression";

export const FieldTypeSchema = z.enum([
  "text",
  "number",
  "money",
  "date",
  "time",
  "boolean",
  "person",
  "select",
  "multiselect",
  "rating",
  "image",
  "location",
  "status",
]);

export const FieldDefSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: FieldTypeSchema,
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  default: z.unknown().optional(),
});

export const ComponentKeySchema = z.enum([
  "list",
  "table",
  "cards",
  "form",
  "checklist",
  "calendar",
  "timeline",
  "kanban",
  "counter",
  "progress",
  "chart",
  "voting",
  "leaderboard",
  "bracket",
  "gallery",
  "dashboard",
  "member_list",
  "meeting_scheduler",
  "trivia_quiz",
  "daily_journal",
  "poll",
]);

export const ScreenDefSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  icon: z.string().optional(),
  component: ComponentKeySchema,
  entity: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  binding: z.record(z.string()).optional(),
});

export const ActionNameSchema = z.enum([
  "add",
  "edit",
  "delete",
  "assign",
  "split",
  "calculate",
  "vote",
  "approve",
  "reject",
  "complete",
  "archive",
  "notify",
  "invite",
  "share",
  "scan",
  "filter",
  "sort",
  "search",
  "duplicate",
  "settle",
  "randomize",
  "record_score",
  "advance_bracket",
  "reserve",
  "checkin",
]);

export const RoleSchema = z.enum(["owner", "admin", "editor", "participant", "viewer"]);

export const ActionVerbSchema = z.enum(["create_record", "update_record", "delete_record"]);

export const ActionDefSchema = z.object({
  name: ActionNameSchema,
  entity: z.string().optional(),
  label: z.string(),
  destructive: z.boolean().optional(),
  allowedRoles: z.array(RoleSchema),
  payloadSchemaKey: z.string().optional(),
  verb: ActionVerbSchema.optional(),
  guard: z.string().optional(),
  effects: z.record(z.string()).optional(),
});

export const RuleDefSchema = z.object({
  id: z.string(),
  type: z.enum(["restrict_action", "require_field", "default_split_exclude"]),
  action: ActionNameSchema.optional(),
  entity: z.string().optional(),
  condition: z.string().optional(),
  value: z.unknown().optional(),
});

export const RoleDefSchema = z.object({
  role: RoleSchema,
  canManageMembers: z.boolean().optional(),
  canEditSpec: z.boolean().optional(),
});

export const ComputedDefSchema = z.object({
  key: z.string(),
  label: z.string(),
  dependsOn: z.array(z.string()),
  formula: z.string().optional(),
});

export const MiniAppSpecificationSchema = z
  .object({
    version: z.number().int().nonnegative(),
    toolDnaSlug: z.array(z.string().min(1)).min(1),
    title: z.string().min(1).max(80),
    icon: z.string().min(1),
    entities: z.array(z.string()),
    fields: z.record(z.array(FieldDefSchema)),
    screens: z.array(ScreenDefSchema).min(1),
    features: z.array(z.string()),
    settings: z.record(z.unknown()),
    rules: z.array(RuleDefSchema),
    roles: z.array(RoleDefSchema),
    actions: z.array(ActionDefSchema),
    computed: z.array(ComputedDefSchema),
  })
  .superRefine((spec, ctx) => {
    // Generic primitive path: every formula/guard/effect string is parsed
    // and checked against this spec's own collections/fields BEFORE the
    // spec is ever accepted — a bad formula fails validation here, it never
    // reaches the database or gets a chance to run. See
    // primitives/expression.ts's validateExpression for the actual rules.
    const collections: Record<string, Set<string>> = {};
    for (const entity of spec.entities) {
      collections[entity] = new Set((spec.fields[entity] ?? []).map((f) => f.key));
    }

    function report(path: (string | number)[], formula: string) {
      for (const message of validateExpression(formula, { collections })) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
      }
    }

    spec.actions.forEach((action, i) => {
      if (action.guard) report(["actions", i, "guard"], action.guard);
      for (const [field, formula] of Object.entries(action.effects ?? {})) {
        report(["actions", i, "effects", field], formula);
      }
    });
    spec.computed.forEach((c, i) => {
      if (c.formula) report(["computed", i, "formula"], c.formula);
    });
  });

export const StructuredMutationSchema = z.object({
  action: ActionNameSchema,
  entity: z.string().optional(),
  payload: z.record(z.unknown()),
  confirmRequired: z.boolean().optional(),
});

export const SpecPatchOpSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("add_field"), entity: z.string(), field: FieldDefSchema }),
  z.object({ op: z.literal("add_screen"), screen: ScreenDefSchema }),
  z.object({ op: z.literal("remove_screen"), screenId: z.string() }),
  z.object({ op: z.literal("add_rule"), rule: RuleDefSchema }),
  z.object({ op: z.literal("update_setting"), key: z.string(), value: z.unknown() }),
]);

export const AIActionResultSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("mutation"), mutation: StructuredMutationSchema }),
  z.object({ type: z.literal("spec_patch"), ops: z.array(SpecPatchOpSchema), summary: z.string() }),
  z.object({ type: z.literal("clarify"), question: z.string() }),
]);

export const NeedClassificationSchema = z.object({
  kind: z.enum(["chat_answer", "reminder", "mini_app", "modify_app"]),
  confidence: z.number().min(0).max(1),
  reminderText: z.string().optional(),
  reminderAt: z.string().optional(),
  chatAnswer: z.string().optional(),
});

// Per-action payload schemas. Every executor in src/runtime/actions validates
// against the exact schema keyed here — this is the allowlist boundary the
// AI's structured output is re-checked against server-side.
export const ActionPayloadSchemas = {
  "generic.add": z.object({ entityType: z.string(), fields: z.record(z.unknown()) }),
  "generic.edit": z.object({ entityType: z.string(), id: z.string(), fields: z.record(z.unknown()) }),
  "generic.delete": z.object({ entityType: z.string(), id: z.string() }),
  "expense.add": z.object({
    description: z.string().min(1).max(200),
    amount: z.number().positive(),
    paidByParticipantId: z.string(),
    splitAmong: z.array(z.string()).min(1).optional(),
    splitMode: z.enum(["equal", "exact", "percentage"]).optional(),
    exactShares: z.record(z.number()).optional(),
  }),
  "expense.settle": z.object({ fromParticipantId: z.string(), toParticipantId: z.string(), amount: z.number().positive() }),
  "tournament.record_score": z.object({ matchId: z.string(), scoreA: z.number().int().nonnegative(), scoreB: z.number().int().nonnegative() }),
  "tournament.generate_bracket": z.object({}),
  "attendance.checkin": z.object({ participantId: z.string(), eventId: z.string().optional(), present: z.boolean() }),
  "checklist.complete": z.object({ itemId: z.string(), done: z.boolean() }),
  "voting.vote": z.object({ pollId: z.string(), optionId: z.string() }),
  "voting.close": z.object({ pollId: z.string() }),
  "meeting.vote": z.object({ meetingId: z.string(), optionId: z.string() }),
  "meeting.close": z.object({ meetingId: z.string() }),
  "quiz.answer": z.object({ questionId: z.string(), optionText: z.string() }),
  "quiz.close": z.object({ quizId: z.string() }),
  "journal.answer": z.object({ date: z.string(), question: z.string(), answer: z.string().min(1).max(280) }),
  "savings.contribute": z.object({ participantId: z.string(), amount: z.number().positive() }),
  "habit.checkin": z.object({ participantId: z.string(), date: z.string(), done: z.boolean() }),
  "reservation.reserve": z.object({ resourceId: z.string(), participantId: z.string(), start: z.string(), end: z.string() }),
  "order.add_item": z.object({ participantId: z.string(), item: z.string().min(1), price: z.number().nonnegative() }),
  "member.invite": z.object({ email: z.string().email() }),
} as const;

export type ActionPayloadKey = keyof typeof ActionPayloadSchemas;
