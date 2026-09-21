import type { ToolDnaDefinition } from "../../types";

export const groupOrder: ToolDnaDefinition = {
  slug: "group-order",
  name: "Group Order",
  category: "food",
  description: "Collect everyone's order items and price for a shared food/supply order, with a running total.",
  keywords: ["group order", "food order", "lunch order", "who wants what", "order together", "delivery"],
  entities: [
    {
      name: "participant",
      label: "Participant",
      fields: [{ key: "name", label: "Name", type: "person", required: true }],
    },
    {
      name: "orderItem",
      label: "Order item",
      fields: [
        { key: "participantId", label: "Ordered by", type: "person", required: true },
        { key: "item", label: "Item", type: "text", required: true },
        { key: "price", label: "Price", type: "money", required: true },
      ],
    },
  ],
  screens: [
    { id: "order", title: "Order", icon: "shopping-cart", component: "table", entity: "orderItem" },
    { id: "totals", title: "Totals", icon: "receipt", component: "dashboard", entity: "orderItem", config: { computed: "totalsByPerson" } },
  ],
  actions: [
    { name: "add", entity: "participant", label: "Add person", allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "generic.add" },
    { name: "add", entity: "orderItem", label: "Add item", allowedRoles: ["owner", "admin", "editor", "participant"], payloadSchemaKey: "order.add_item" },
    { name: "delete", entity: "orderItem", label: "Remove item", destructive: true, allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "generic.delete" },
  ],
  computed: [{ key: "totalsByPerson", label: "Total per person", dependsOn: ["participant", "orderItem"] }],
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
