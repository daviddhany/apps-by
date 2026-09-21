import type { ToolDnaDefinition } from "../../types";

export const savingsTracker: ToolDnaDefinition = {
  slug: "savings-tracker",
  name: "Savings / Payment Tracker",
  category: "finance",
  description: "Track contributions toward a shared savings goal or recurring payment obligation.",
  keywords: ["savings", "goal", "contribution", "payment tracker", "dues", "fund", "pool money", "chip in"],
  entities: [
    {
      name: "participant",
      label: "Participant",
      fields: [{ key: "name", label: "Name", type: "person", required: true }],
    },
    {
      name: "contribution",
      label: "Contribution",
      fields: [
        { key: "participantId", label: "Participant", type: "person", required: true },
        { key: "amount", label: "Amount", type: "money", required: true },
        { key: "date", label: "Date", type: "date" },
      ],
    },
  ],
  screens: [
    { id: "progress", title: "Goal", icon: "target", component: "progress", entity: "contribution", config: { computed: "totalProgress" } },
    { id: "contributions", title: "Contributions", icon: "list", component: "table", entity: "contribution" },
    { id: "members", title: "People", icon: "users", component: "member_list", entity: "participant" },
  ],
  actions: [
    { name: "add", entity: "participant", label: "Add person", allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "generic.add" },
    { name: "add", entity: "contribution", label: "Add contribution", allowedRoles: ["owner", "admin", "editor", "participant"], payloadSchemaKey: "savings.contribute" },
  ],
  computed: [{ key: "totalProgress", label: "Progress toward goal", dependsOn: ["contribution"] }],
  parameters: [{ key: "goalAmount", label: "Goal amount", type: "number", default: 1000 }],
  roles: [
    { role: "owner", canManageMembers: true, canEditSpec: true },
    { role: "admin", canManageMembers: true, canEditSpec: true },
    { role: "editor" },
    { role: "participant" },
    { role: "viewer" },
  ],
  defaultSettings: { goalAmount: 1000, currency: "USD" },
};
