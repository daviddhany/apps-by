import type { ToolDnaDefinition } from "../../types";

export const roomReservation: ToolDnaDefinition = {
  slug: "room-reservation",
  name: "Room Reservation",
  category: "planning",
  description: "Book time slots on a shared resource (room, court, equipment) and avoid double-booking.",
  keywords: ["reservation", "booking", "room", "court", "schedule", "book a slot", "meeting room", "reserve"],
  entities: [
    {
      name: "resource",
      label: "Resource",
      fields: [{ key: "name", label: "Resource name", type: "text", required: true }],
    },
    {
      name: "reservation",
      label: "Reservation",
      fields: [
        { key: "resourceId", label: "Resource", type: "text", required: true },
        { key: "participantId", label: "Booked by", type: "person", required: true },
        { key: "start", label: "Start", type: "date", required: true },
        { key: "end", label: "End", type: "date", required: true },
      ],
    },
  ],
  screens: [
    { id: "calendar", title: "Calendar", icon: "calendar", component: "calendar", entity: "reservation" },
    { id: "resources", title: "Resources", icon: "list", component: "list", entity: "resource" },
  ],
  actions: [
    { name: "add", entity: "resource", label: "Add resource", allowedRoles: ["owner", "admin"], payloadSchemaKey: "generic.add" },
    { name: "reserve", entity: "reservation", label: "Reserve slot", allowedRoles: ["owner", "admin", "editor", "participant"], payloadSchemaKey: "reservation.reserve" },
    { name: "delete", entity: "reservation", label: "Cancel reservation", destructive: true, allowedRoles: ["owner", "admin"], payloadSchemaKey: "generic.delete" },
  ],
  computed: [{ key: "utilization", label: "Utilization", dependsOn: ["resource", "reservation"] }],
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
