import type { ToolDnaDefinition } from "../../types";

export const votingBoard: ToolDnaDefinition = {
  slug: "voting-board",
  name: "Voting Board",
  category: "planning",
  description: "Create a poll with options, let the group vote, and see live results.",
  keywords: ["vote", "voting", "poll", "decide", "choose", "where should we go", "restaurant", "election"],
  entities: [
    {
      name: "poll",
      label: "Poll",
      fields: [
        { key: "question", label: "Question", type: "text", required: true },
        { key: "status", label: "Status", type: "status", options: ["open", "closed"], default: "open" },
        { key: "options", label: "Options", type: "multiselect", required: true },
      ],
    },
    {
      name: "vote",
      label: "Vote",
      fields: [
        { key: "pollId", label: "Poll", type: "text", required: true },
        { key: "optionId", label: "Option", type: "text", required: true },
        { key: "participantId", label: "Voter", type: "person", required: true },
      ],
    },
  ],
  screens: [{ id: "voting", title: "Voting", icon: "check-circle", component: "voting", entity: "poll" }],
  actions: [
    { name: "add", entity: "poll", label: "Create poll", allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "generic.add" },
    { name: "vote", entity: "vote", label: "Vote", allowedRoles: ["owner", "admin", "editor", "participant"], payloadSchemaKey: "voting.vote" },
    { name: "complete", entity: "poll", label: "Close voting", allowedRoles: ["owner", "admin"], payloadSchemaKey: "voting.close" },
  ],
  computed: [{ key: "tally", label: "Vote tally", dependsOn: ["poll", "vote"] }],
  parameters: [{ key: "allowChangeVote", label: "Allow changing vote", type: "boolean", default: true }],
  roles: [
    { role: "owner", canManageMembers: true, canEditSpec: true },
    { role: "admin", canManageMembers: true, canEditSpec: true },
    { role: "editor" },
    { role: "participant" },
    { role: "viewer" },
  ],
  defaultSettings: { allowChangeVote: true },
};
