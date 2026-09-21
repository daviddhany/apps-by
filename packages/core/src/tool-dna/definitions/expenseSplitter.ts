import type { ToolDnaDefinition } from "../../types";

export const expenseSplitter: ToolDnaDefinition = {
  slug: "expense-splitter",
  name: "Expense Splitter",
  category: "finance",
  description:
    "Track shared expenses among a group, who paid, how to split, and who owes whom.",
  keywords: [
    "expense",
    "split",
    "money",
    "trip",
    "bill",
    "owe",
    "pay",
    "cost",
    "budget",
    "receipt",
    "vacation",
    "shared cost",
  ],
  entities: [
    {
      name: "participant",
      label: "Participant",
      fields: [
        { key: "name", label: "Name", type: "person", required: true },
        { key: "isCarOwner", label: "Car owner", type: "boolean", default: false },
      ],
    },
    {
      name: "expense",
      label: "Expense",
      fields: [
        { key: "description", label: "Description", type: "text", required: true },
        { key: "amount", label: "Amount", type: "money", required: true },
        { key: "paidByParticipantId", label: "Paid by", type: "person", required: true },
        { key: "splitAmong", label: "Split among", type: "multiselect" },
        { key: "splitMode", label: "Split mode", type: "select", options: ["equal", "exact", "percentage"], default: "equal" },
        { key: "receiptImage", label: "Receipt", type: "image" },
        { key: "createdAt", label: "Date", type: "date" },
      ],
    },
  ],
  screens: [
    { id: "expenses", title: "Expenses", icon: "receipt", component: "cards", entity: "expense" },
    { id: "balances", title: "Balances", icon: "scale", component: "dashboard", entity: "participant", config: { computed: "balances" } },
    { id: "members", title: "People", icon: "users", component: "member_list", entity: "participant" },
  ],
  actions: [
    { name: "add", entity: "participant", label: "Add person", allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "generic.add" },
    { name: "add", entity: "expense", label: "Add expense", allowedRoles: ["owner", "admin", "editor", "participant"], payloadSchemaKey: "expense.add" },
    { name: "edit", entity: "expense", label: "Edit expense", allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "generic.edit" },
    { name: "delete", entity: "expense", label: "Delete expense", destructive: true, allowedRoles: ["owner", "admin"], payloadSchemaKey: "generic.delete" },
    { name: "settle", entity: "participant", label: "Settle up", allowedRoles: ["owner", "admin", "editor", "participant"], payloadSchemaKey: "expense.settle" },
  ],
  computed: [{ key: "balances", label: "Who owes whom", dependsOn: ["participant", "expense"] }],
  parameters: [
    { key: "defaultSplitMode", label: "Default split mode", type: "select", options: ["equal", "exact", "percentage"], default: "equal" },
  ],
  roles: [
    { role: "owner", canManageMembers: true, canEditSpec: true },
    { role: "admin", canManageMembers: true, canEditSpec: true },
    { role: "editor" },
    { role: "participant" },
    { role: "viewer" },
  ],
  defaultSettings: { defaultSplitMode: "equal", currency: "USD" },
};
