// A shared, deterministic "question of the day" for the Daily Micro-Journal
// Tool DNA. No database row is needed for the prompt itself — every member's
// client derives the same question from the same calendar date, so nothing
// has to be created/synced before the group can use it (only each person's
// *answer* is persisted). Picking by day-of-year keeps it stable across a
// year, then wraps.
export const DAILY_QUESTIONS: string[] = [
  "What's one thing you're looking forward to this week?",
  "What made you smile today?",
  "What's a small win you had recently?",
  "What's something you're grateful for right now?",
  "If you could change one thing about today, what would it be?",
  "What's a lesson you learned the hard way?",
  "What's something you're proud of that no one noticed?",
  "What would you tell your younger self right now?",
  "What's the best advice you've ever ignored?",
  "What's a habit you'd like to build?",
  "What's a habit you'd like to break?",
  "Who made your day better recently, and how?",
  "What's something you've been avoiding?",
  "What's a fear you'd like to face this year?",
  "What does a perfect ordinary day look like for you?",
  "What's a risk that paid off for you?",
  "What's something new you tried recently?",
  "What's a place you'd love to revisit?",
  "What's something you're curious about right now?",
  "What's a question you wish someone would ask you?",
  "What's the kindest thing someone has done for you lately?",
  "What's a belief you've changed your mind about?",
  "What's something you did today that your future self will thank you for?",
  "What's a memory that always makes you laugh?",
  "What's something you're excited to learn?",
  "What would you do with an unexpected free afternoon?",
  "What's a compliment you received that you still remember?",
  "What's one thing you want more of in your life?",
  "What's one thing you want less of in your life?",
  "What's a small thing that made today better?",
  "What's something you're nervous about right now?",
  "What's a goal you're quietly working toward?",
  "What's the last thing that surprised you?",
  "What's a rule you live by?",
  "What's something you wish you did more often?",
  "What's a song or sound that instantly changes your mood?",
  "What's something you've gotten better at this year?",
  "What's a decision you're glad you made?",
  "What's something you'd like to apologize for?",
  "What's something you'd like to forgive yourself for?",
  "What's a tradition you'd like to start?",
  "What's the most peaceful moment you had this week?",
  "What's something you're holding onto that you should let go of?",
  "What's a skill you wish you had?",
  "What's something about today you want to remember?",
  "What's a question you've been sitting with lately?",
  "What's something you did for someone else recently?",
  "What's a version of yourself you're working toward?",
  "What's something that felt hard but worth it today?",
  "What's one word that describes how you feel right now?",
];

export function todayDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

export function questionForDate(d: Date = new Date()): { date: string; question: string } {
  const idx = ((dayOfYear(d) % DAILY_QUESTIONS.length) + DAILY_QUESTIONS.length) % DAILY_QUESTIONS.length;
  return { date: todayDateString(d), question: DAILY_QUESTIONS[idx] };
}
