import type { ToolDnaDefinition } from "../../types";

export const knockoutTournament: ToolDnaDefinition = {
  slug: "knockout-tournament",
  name: "Knockout Tournament",
  category: "sports",
  description: "Run a single-elimination bracket with score entry and automatic winner advancement.",
  keywords: [
    "tournament",
    "bracket",
    "knockout",
    "fc",
    "football",
    "fifa",
    "padel",
    "match",
    "players",
    "teams",
    "championship",
    "elimination",
  ],
  entities: [
    {
      name: "player",
      label: "Player",
      fields: [
        { key: "name", label: "Name", type: "person", required: true },
        { key: "seed", label: "Seed", type: "number" },
      ],
    },
    {
      name: "match",
      label: "Match",
      fields: [
        { key: "round", label: "Round", type: "number", required: true },
        { key: "slot", label: "Slot", type: "number", required: true },
        { key: "playerAId", label: "Player A", type: "person" },
        { key: "playerBId", label: "Player B", type: "person" },
        { key: "scoreA", label: "Score A", type: "number" },
        { key: "scoreB", label: "Score B", type: "number" },
        { key: "status", label: "Status", type: "status", options: ["pending", "in_progress", "done"], default: "pending" },
        { key: "bestOf", label: "Best of", type: "number", default: 1 },
      ],
    },
  ],
  screens: [
    { id: "bracket", title: "Bracket", icon: "trophy", component: "bracket", entity: "match" },
    { id: "players", title: "Players", icon: "users", component: "member_list", entity: "player" },
    { id: "standings", title: "Standings", icon: "medal", component: "leaderboard", entity: "player", config: { computed: "standings" } },
  ],
  actions: [
    { name: "add", entity: "player", label: "Add player", allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "generic.add" },
    { name: "record_score", entity: "match", label: "Record score", allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "tournament.record_score" },
    { name: "randomize", entity: "match", label: "Generate bracket", allowedRoles: ["owner", "admin"], payloadSchemaKey: "tournament.generate_bracket" },
  ],
  computed: [{ key: "standings", label: "Standings", dependsOn: ["player", "match"] }],
  parameters: [
    { key: "playerCount", label: "Number of players", type: "number", default: 8 },
    { key: "bestOf", label: "Best of (games per match)", type: "number", default: 1 },
  ],
  roles: [
    { role: "owner", canManageMembers: true, canEditSpec: true },
    { role: "admin", canManageMembers: true, canEditSpec: true },
    { role: "editor" },
    { role: "participant" },
    { role: "viewer" },
  ],
  defaultSettings: { playerCount: 8, bestOf: 1, format: "knockout" },
};
