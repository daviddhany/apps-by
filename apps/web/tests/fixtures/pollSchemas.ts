// Two hand-authored MiniAppSpecifications proving the generic "poll"
// primitive (packages/core, apps/web/src/components/runtime/screens/PollView.tsx)
// can express two semantically different apps — a vote and a meeting
// availability check — through the SAME component, verbs, and formula
// engine, with zero concept-specific code. See
// /root/.claude/plans/linked-drifting-popcorn.md.
//
// These are test fixtures, not registered Tool DNA: they never go through
// buildSpec.ts or the AI matcher. They're written by hand exactly as an
// AI planner would eventually be expected to produce them.

import type { MiniAppSpecification, RoleDef } from "@needly/core";

const STANDARD_ROLES: RoleDef[] = [
  { role: "owner", canManageMembers: true, canEditSpec: true },
  { role: "admin", canManageMembers: true, canEditSpec: true },
  { role: "editor" },
  { role: "participant" },
  { role: "viewer" },
];

export const votingBoardPollSpec: MiniAppSpecification = {
  version: 1,
  toolDnaSlug: ["generic-poll-demo"],
  title: "Where should we eat?",
  icon: "sparkles",
  entities: ["votingpoll.optionset", "votingpoll.selection"],
  fields: {
    "votingpoll.optionset": [
      { key: "title", label: "Question", type: "text", required: true },
      { key: "options", label: "Options", type: "multiselect", required: true },
      { key: "status", label: "Status", type: "status", options: ["open", "closed"], default: "open" },
    ],
    "votingpoll.selection": [
      { key: "optionsetId", label: "Poll", type: "text", required: true },
      { key: "optionText", label: "Option", type: "text", required: true },
      { key: "voterId", label: "Voter", type: "person", required: true },
    ],
  },
  screens: [
    {
      id: "votingpoll.main",
      title: "Vote",
      icon: "sparkles",
      component: "poll",
      entity: "votingpoll.optionset",
      binding: {
        titleField: "title",
        optionsField: "options",
        statusField: "status",
        votesCollection: "votingpoll.selection",
        voteParentField: "optionsetId",
        voteOptionField: "optionText",
        voterField: "voterId",
      },
    },
  ],
  features: [],
  settings: {},
  rules: [],
  roles: STANDARD_ROLES,
  actions: [
    { name: "add", entity: "votingpoll.optionset", label: "Create poll", allowedRoles: ["owner", "admin", "editor"], verb: "create_record" },
    {
      name: "vote",
      entity: "votingpoll.selection",
      label: "Vote",
      allowedRoles: ["owner", "admin", "editor", "participant"],
      verb: "create_record",
      effects: { voterId: "actor.id" },
    },
    {
      name: "complete",
      entity: "votingpoll.optionset",
      label: "Close voting",
      allowedRoles: ["owner", "admin"],
      verb: "update_record",
      effects: { status: "'closed'" },
    },
  ],
  computed: [{ key: "tally", label: "Vote tally", dependsOn: ["votingpoll.selection"], formula: "groupCount(votingpoll.selection, 'optionText')" }],
};

export const meetingSchedulerPollSpec: MiniAppSpecification = {
  version: 1,
  toolDnaSlug: ["generic-poll-demo"],
  title: "When should we meet?",
  icon: "sparkles",
  entities: ["meetingpoll.optionset", "meetingpoll.selection"],
  fields: {
    "meetingpoll.optionset": [
      { key: "title", label: "Meeting", type: "text", required: true },
      { key: "options", label: "Proposed times", type: "multiselect", required: true },
      { key: "status", label: "Status", type: "status", options: ["open", "closed"], default: "open" },
    ],
    "meetingpoll.selection": [
      { key: "optionsetId", label: "Meeting", type: "text", required: true },
      { key: "optionText", label: "Time", type: "text", required: true },
      { key: "voterId", label: "Member", type: "person", required: true },
    ],
  },
  screens: [
    {
      id: "meetingpoll.main",
      title: "Scheduler",
      icon: "calendar",
      component: "poll",
      entity: "meetingpoll.optionset",
      binding: {
        titleField: "title",
        optionsField: "options",
        statusField: "status",
        votesCollection: "meetingpoll.selection",
        voteParentField: "optionsetId",
        voteOptionField: "optionText",
        voterField: "voterId",
      },
    },
  ],
  features: [],
  settings: {},
  rules: [],
  roles: STANDARD_ROLES,
  actions: [
    { name: "add", entity: "meetingpoll.optionset", label: "Propose a meeting", allowedRoles: ["owner", "admin", "editor"], verb: "create_record" },
    {
      name: "vote",
      entity: "meetingpoll.selection",
      label: "Mark available",
      allowedRoles: ["owner", "admin", "editor", "participant"],
      verb: "create_record",
      effects: { voterId: "actor.id" },
    },
    {
      name: "complete",
      entity: "meetingpoll.optionset",
      label: "Confirm time",
      allowedRoles: ["owner", "admin"],
      verb: "update_record",
      effects: { status: "'closed'" },
    },
  ],
  computed: [{ key: "tally", label: "Availability tally", dependsOn: ["meetingpoll.selection"], formula: "groupCount(meetingpoll.selection, 'optionText')" }],
};
