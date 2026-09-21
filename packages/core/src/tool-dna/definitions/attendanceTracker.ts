import type { ToolDnaDefinition } from "../../types";

export const attendanceTracker: ToolDnaDefinition = {
  slug: "attendance-tracker",
  name: "Attendance Tracker",
  category: "planning",
  description: "Track who is coming to an event or series of sessions, with check-in.",
  keywords: ["attendance", "coming", "rsvp", "who is coming", "checkin", "roster", "present", "absent", "sessions"],
  entities: [
    {
      name: "participant",
      label: "Participant",
      fields: [{ key: "name", label: "Name", type: "person", required: true }],
    },
    {
      name: "event",
      label: "Event",
      fields: [
        { key: "title", label: "Title", type: "text", required: true },
        { key: "date", label: "Date", type: "date", required: true },
      ],
    },
    {
      name: "checkin",
      label: "Check-in",
      fields: [
        { key: "eventId", label: "Event", type: "text", required: true },
        { key: "participantId", label: "Participant", type: "person", required: true },
        { key: "present", label: "Present", type: "boolean", default: false },
      ],
    },
  ],
  screens: [
    { id: "roster", title: "Roster", icon: "clipboard-check", component: "checklist", entity: "checkin" },
    { id: "events", title: "Events", icon: "calendar", component: "calendar", entity: "event" },
    { id: "members", title: "People", icon: "users", component: "member_list", entity: "participant" },
  ],
  actions: [
    { name: "add", entity: "participant", label: "Add person", allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "generic.add" },
    { name: "add", entity: "event", label: "Add event", allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "generic.add" },
    { name: "checkin", entity: "checkin", label: "Check in", allowedRoles: ["owner", "admin", "editor", "participant"], payloadSchemaKey: "attendance.checkin" },
  ],
  computed: [{ key: "attendanceRate", label: "Attendance rate", dependsOn: ["participant", "checkin"] }],
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
