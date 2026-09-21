import type { ToolDnaDefinition } from "../../types";

export const meetingScheduler: ToolDnaDefinition = {
  slug: "meeting-scheduler",
  name: "Meeting Scheduler",
  category: "planning",
  description: "Propose a few times for a meeting, let the team mark when they're free, and see which time works for the most people.",
  keywords: [
    "meeting",
    "schedule",
    "scheduling",
    "arrange a meeting",
    "when2meet",
    "availability",
    "find a time",
    "call",
    "sync",
    "standup",
    "team meeting",
  ],
  entities: [
    {
      name: "meeting",
      label: "Meeting",
      fields: [
        { key: "title", label: "Meeting", type: "text", required: true },
        { key: "status", label: "Status", type: "status", options: ["proposed", "scheduled"], default: "proposed" },
        { key: "options", label: "Proposed times", type: "multiselect", required: true },
      ],
    },
    {
      name: "availability",
      label: "Availability",
      fields: [
        { key: "meetingId", label: "Meeting", type: "text", required: true },
        { key: "optionId", label: "Time", type: "text", required: true },
        { key: "memberId", label: "Member", type: "person", required: true },
      ],
    },
  ],
  screens: [{ id: "scheduler", title: "Scheduler", icon: "calendar", component: "meeting_scheduler", entity: "meeting" }],
  actions: [
    { name: "add", entity: "meeting", label: "Propose a meeting", allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "generic.add" },
    { name: "vote", entity: "availability", label: "Mark available", allowedRoles: ["owner", "admin", "editor", "participant"], payloadSchemaKey: "meeting.vote" },
    { name: "complete", entity: "meeting", label: "Confirm time", allowedRoles: ["owner", "admin"], payloadSchemaKey: "meeting.close" },
  ],
  computed: [{ key: "tally", label: "Availability tally", dependsOn: ["meeting", "availability"] }],
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
