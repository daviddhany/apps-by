import type { ToolDnaDefinition } from "../../types";

export const sharedChecklist: ToolDnaDefinition = {
  slug: "shared-checklist",
  name: "Shared Checklist",
  category: "planning",
  description: "A collaborative to-do / packing / shopping list that everyone can check off.",
  keywords: ["checklist", "todo", "to-do", "list", "tasks", "packing list", "shopping list", "chores", "reminders", "things to do", "due date"],
  entities: [
    {
      name: "item",
      label: "Item",
      fields: [
        { key: "title", label: "Item", type: "text", required: true },
        { key: "assignedToParticipantId", label: "Assigned to", type: "person" },
        { key: "done", label: "Done", type: "boolean", default: false },
      ],
    },
  ],
  screens: [{ id: "checklist", title: "Checklist", icon: "check-square", component: "checklist", entity: "item" }],
  actions: [
    { name: "add", entity: "item", label: "Add item", allowedRoles: ["owner", "admin", "editor", "participant"], payloadSchemaKey: "generic.add" },
    { name: "complete", entity: "item", label: "Check off", allowedRoles: ["owner", "admin", "editor", "participant"], payloadSchemaKey: "checklist.complete" },
    { name: "delete", entity: "item", label: "Remove item", destructive: true, allowedRoles: ["owner", "admin"], payloadSchemaKey: "generic.delete" },
  ],
  computed: [{ key: "progress", label: "Progress", dependsOn: ["item"] }],
  parameters: [],
  roles: [
    { role: "owner", canManageMembers: true, canEditSpec: true },
    { role: "admin", canManageMembers: true, canEditSpec: true },
    { role: "editor" },
    { role: "participant" },
    { role: "viewer" },
  ],
  defaultSettings: {},
};
