import type { ComponentType } from "react";
import type { ComponentKey, ScreenComponentProps } from "@needly/core";
import { GenericRecordsView } from "./GenericRecordsView";
import { ChecklistView } from "./ChecklistView";
import { MemberListView } from "./MemberListView";
import { DashboardView } from "./DashboardView";
import { BracketView } from "./BracketView";
import { LeaderboardView } from "./LeaderboardView";
import { VotingView } from "./VotingView";
import { ProgressView } from "./ProgressView";
import { CalendarView } from "./CalendarView";
import { MeetingSchedulerView } from "./MeetingSchedulerView";
import { TriviaQuizView } from "./TriviaQuizView";

/** Mirrors apps/web/src/components/runtime/registry.ts — same fixed set of
 * component keys a MiniAppSpecification can reference, rendered here as real
 * native views instead of DOM elements. */
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
  meeting_scheduler: MeetingSchedulerView,
  trivia_quiz: TriviaQuizView,
};
