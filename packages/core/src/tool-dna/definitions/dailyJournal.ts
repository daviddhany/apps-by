import type { ToolDnaDefinition } from "../../types";

export const dailyJournal: ToolDnaDefinition = {
  slug: "daily-journal",
  name: "Daily Micro-Journal",
  category: "reflection",
  description:
    "A shared daily prompt — everyone in the group gets the same random, thought-provoking question each day and answers it in one sentence.",
  keywords: [
    "journal",
    "journaling",
    "daily journal",
    "micro-journal",
    "diary",
    "daily question",
    "daily prompt",
    "one sentence",
    "reflect",
    "reflection",
    "thought-provoking",
    "gratitude",
    "check-in",
    "prompt each day",
  ],
  entities: [
    {
      name: "entry",
      label: "Entry",
      fields: [
        { key: "date", label: "Date", type: "text", required: true },
        { key: "question", label: "Question", type: "text", required: true },
        { key: "answer", label: "Your answer", type: "text", required: true },
        { key: "authorId", label: "Member", type: "person", required: true },
      ],
    },
  ],
  screens: [{ id: "journal", title: "Daily Journal", icon: "sparkles", component: "daily_journal", entity: "entry" }],
  actions: [
    { name: "add", entity: "entry", label: "Answer today's question", allowedRoles: ["owner", "admin", "editor", "participant"], payloadSchemaKey: "journal.answer" },
  ],
  computed: [{ key: "streaks", label: "Answer streaks", dependsOn: ["entry"] }],
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
