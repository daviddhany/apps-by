import type { ToolDnaDefinition } from "../../types";

export const triviaQuiz: ToolDnaDefinition = {
  slug: "trivia-quiz",
  name: "Trivia Quiz",
  category: "games",
  description: "Host a multiple-choice trivia quiz — players answer at their own pace with instant right/wrong feedback and a live scoreboard.",
  keywords: [
    "trivia",
    "quiz",
    "game",
    "games",
    "mini game",
    "mini-game",
    "play a game",
    "questions",
    "scoreboard",
    "leaderboard",
    "who knows",
    "test our knowledge",
    "pub quiz",
  ],
  entities: [
    {
      name: "quiz",
      label: "Quiz",
      fields: [
        { key: "title", label: "Quiz", type: "text", required: true },
        { key: "status", label: "Status", type: "status", options: ["open", "closed"], default: "open" },
      ],
    },
    {
      name: "question",
      label: "Question",
      fields: [
        { key: "quizId", label: "Quiz", type: "text", required: true },
        { key: "text", label: "Question", type: "text", required: true },
        { key: "options", label: "Answer choices", type: "multiselect", required: true },
        { key: "correctOption", label: "Correct choice number (matches the order added)", type: "select", options: ["1", "2", "3", "4", "5", "6"], required: true },
        { key: "points", label: "Points", type: "number", default: 10 },
      ],
    },
    {
      name: "answer",
      label: "Answer",
      fields: [
        { key: "questionId", label: "Question", type: "text", required: true },
        { key: "optionText", label: "Answer", type: "text", required: true },
        { key: "playerId", label: "Player", type: "person", required: true },
        { key: "correct", label: "Correct", type: "boolean", default: false },
        { key: "points", label: "Points", type: "number", default: 0 },
      ],
    },
  ],
  screens: [{ id: "quiz", title: "Trivia", icon: "sparkles", component: "trivia_quiz", entity: "quiz" }],
  actions: [
    { name: "add", entity: "quiz", label: "Start a quiz", allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "generic.add" },
    { name: "add", entity: "question", label: "Add a question", allowedRoles: ["owner", "admin", "editor"], payloadSchemaKey: "generic.add" },
    { name: "vote", entity: "answer", label: "Submit answer", allowedRoles: ["owner", "admin", "editor", "participant"], payloadSchemaKey: "quiz.answer" },
    { name: "complete", entity: "quiz", label: "Close quiz", allowedRoles: ["owner", "admin"], payloadSchemaKey: "quiz.close" },
  ],
  computed: [{ key: "leaderboard", label: "Player scores", dependsOn: ["quiz", "question", "answer"] }],
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
