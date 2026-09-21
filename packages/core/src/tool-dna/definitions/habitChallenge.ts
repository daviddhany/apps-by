import type { ToolDnaDefinition } from "../../types";

export const habitChallenge: ToolDnaDefinition = {
  slug: "habit-challenge",
  name: "Habit Challenge",
  category: "wellness",
  description: "Run a group challenge (gym, reading, no-sugar, etc.) with daily check-ins and a streak leaderboard.",
  keywords: ["challenge", "habit", "gym", "streak", "30-day", "daily checkin", "workout", "study challenge"],
  entities: [
    {
      name: "participant",
      label: "Participant",
      fields: [{ key: "name", label: "Name", type: "person", required: true }],
    },
    {
      name: "checkin",
      label: "Check-in",
      fields: [
        { key: "participantId", label: "Participant", type: "person", required: true },
        { key: "date", label: "Date", type: "date", required: true },
        { key: "done", label: "Done", type: "boolean", default: true },
      ],
    },
  ],
  screens: [
    { id: "calendar", title: "Check-ins", icon: "calendar", component: "calendar", entity: "checkin" },
    { id: "leaderboard", title: "Streaks", icon: "flame", component: "leaderboard", entity: "participant", config: { computed: "streaks" } },
  ],
  actions: [
    { name: "add", entity: "participant", label: "Join challenge", allowedRoles: ["owner", "admin", "editor", "participant"], payloadSchemaKey: "generic.add" },
    { name: "checkin", entity: "checkin", label: "Check in today", allowedRoles: ["owner", "admin", "editor", "participant"], payloadSchemaKey: "habit.checkin" },
  ],
  computed: [{ key: "streaks", label: "Current streaks", dependsOn: ["participant", "checkin"] }],
  parameters: [{ key: "durationDays", label: "Challenge length (days)", type: "number", default: 30 }],
  roles: [
    { role: "owner", canManageMembers: true, canEditSpec: true },
    { role: "admin", canManageMembers: true, canEditSpec: true },
    { role: "editor" },
    { role: "participant" },
    { role: "viewer" },
  ],
  defaultSettings: { durationDays: 30 },
};
