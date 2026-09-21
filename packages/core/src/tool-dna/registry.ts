import type { ToolDnaDefinition } from "../types";
import { expenseSplitter } from "./definitions/expenseSplitter";
import { knockoutTournament } from "./definitions/knockoutTournament";
import { attendanceTracker } from "./definitions/attendanceTracker";
import { sharedChecklist } from "./definitions/sharedChecklist";
import { votingBoard } from "./definitions/votingBoard";
import { savingsTracker } from "./definitions/savingsTracker";
import { habitChallenge } from "./definitions/habitChallenge";
import { roomReservation } from "./definitions/roomReservation";
import { groupOrder } from "./definitions/groupOrder";
import { tripPlanner } from "./definitions/tripPlanner";
import { meetingScheduler } from "./definitions/meetingScheduler";
import { triviaQuiz } from "./definitions/triviaQuiz";

export const TOOL_DNA_REGISTRY: Record<string, ToolDnaDefinition> = {
  [expenseSplitter.slug]: expenseSplitter,
  [knockoutTournament.slug]: knockoutTournament,
  [attendanceTracker.slug]: attendanceTracker,
  [sharedChecklist.slug]: sharedChecklist,
  [votingBoard.slug]: votingBoard,
  [savingsTracker.slug]: savingsTracker,
  [habitChallenge.slug]: habitChallenge,
  [roomReservation.slug]: roomReservation,
  [groupOrder.slug]: groupOrder,
  [tripPlanner.slug]: tripPlanner,
  [meetingScheduler.slug]: meetingScheduler,
  [triviaQuiz.slug]: triviaQuiz,
};

export function getToolDna(slug: string): ToolDnaDefinition | undefined {
  return TOOL_DNA_REGISTRY[slug];
}

export function listToolDna(): ToolDnaDefinition[] {
  return Object.values(TOOL_DNA_REGISTRY);
}

export function listSimpleToolDna(): ToolDnaDefinition[] {
  return listToolDna().filter((d) => !d.composesFrom);
}
