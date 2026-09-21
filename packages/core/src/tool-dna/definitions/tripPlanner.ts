import type { ToolDnaDefinition } from "../../types";

// Composite Tool DNA: merges expense-splitter + attendance-tracker + voting-board
// (see src/tool-dna/compose.ts) and adds its own carpool entity/screen/actions.
// This is what satisfies the "Trip Hub" product test — one coherent app, not
// four separate ones.
export const tripPlanner: ToolDnaDefinition = {
  slug: "trip-planner",
  name: "Trip Planner",
  category: "planning",
  description:
    "Plan a group trip: split expenses, organize car assignments, track who's coming, and vote on daily plans.",
  keywords: [
    "trip",
    "travel",
    "vacation",
    "cars",
    "carpool",
    "who is driving",
    "itinerary",
    "group trip",
    "road trip",
  ],
  composesFrom: ["expense-splitter", "attendance-tracker", "voting-board"],
  entities: [
    {
      name: "car",
      label: "Car",
      fields: [
        { key: "driverParticipantId", label: "Driver", type: "person", required: true },
        { key: "seats", label: "Seats", type: "number", required: true },
        { key: "passengerIds", label: "Passengers", type: "multiselect" },
      ],
    },
  ],
  screens: [{ id: "cars", title: "Cars", icon: "car", component: "cards", entity: "car" }],
  actions: [
    { name: "add", entity: "car", label: "Add car", allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "generic.add" },
    { name: "assign", entity: "car", label: "Assign passenger", allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "generic.edit" },
  ],
  computed: [],
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
