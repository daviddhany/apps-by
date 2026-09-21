import type { ComponentType } from "react";
import type { ComponentKey } from "@needly/core";
import type { ScreenComponentProps } from "./types";
import { GenericRecordsView } from "./screens/GenericRecordsView";
import { ChecklistView } from "./screens/ChecklistView";
import { MemberListView } from "./screens/MemberListView";
import { DashboardView } from "./screens/DashboardView";
import { BracketView } from "./screens/BracketView";
import { LeaderboardView } from "./screens/LeaderboardView";
import { VotingView } from "./screens/VotingView";
import { ProgressView } from "./screens/ProgressView";
import { CalendarView } from "./screens/CalendarView";

/**
 * Fixed registry the spec's `screens[].component` must resolve through — a
 * spec can only ever reference one of these keys (enforced by the zod enum
 * in src/validation/schema.ts), so a bad/AI-generated spec fails validation
 * long before it reaches rendering (ARCHITECTURE.md §5).
 */
export const COMPONENT_REGISTRY: Record<ComponentKey, ComponentType<ScreenComponentProps>> = {
  list: GenericRecordsView,
  table: GenericRecordsView,
  cards: GenericRecordsView,
  form: GenericRecordsView,
  checklist: ChecklistView,
  calendar: CalendarView,
  timeline: GenericRecordsView,
  kanban: GenericRecordsView,
  counter: GenericRecordsView,
  progress: ProgressView,
  chart: GenericRecordsView,
  voting: VotingView,
  leaderboard: LeaderboardView,
  bracket: BracketView,
  gallery: GenericRecordsView,
  dashboard: DashboardView,
  member_list: MemberListView,
};
