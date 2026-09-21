// Short namespace used to prefix every entity name that a Tool DNA declares,
// e.g. "participant" -> "expense.participant". Every entity type is always
// namespaced (even for a standalone, non-composed app) so that composing
// multiple Tool DNAs into one Mini-App Specification (src/tool-dna/compose.ts)
// can never collide on entity/action names.
export const TOOL_DNA_NAMESPACE: Record<string, string> = {
  "expense-splitter": "expense",
  "knockout-tournament": "tournament",
  "attendance-tracker": "attendance",
  "shared-checklist": "checklist",
  "voting-board": "voting",
  "savings-tracker": "savings",
  "habit-challenge": "habit",
  "room-reservation": "reservation",
  "group-order": "order",
  "trip-planner": "trip",
};

export function namespaceFor(slug: string): string {
  const ns = TOOL_DNA_NAMESPACE[slug];
  if (!ns) throw new Error(`No namespace registered for Tool DNA "${slug}"`);
  return ns;
}
