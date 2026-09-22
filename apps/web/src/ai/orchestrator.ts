import { db } from "@/server/db";
import { getAIProvider, buildSpec, listSimpleToolDna } from "@needly/core";
import { ensureToolDnaSeeded, getLatestToolDnaVersion } from "@/server/seedToolDna";
import { createJoinCode } from "@/server/joinCode";
import type { MiniAppSpecification } from "@needly/core";

const RANDOM_ICON_BY_SLUG: Record<string, string> = {
  "expense-splitter": "receipt",
  "knockout-tournament": "trophy",
  "attendance-tracker": "check-square",
  "shared-checklist": "check-square",
  "voting-board": "sparkles",
  "savings-tracker": "receipt",
  "habit-challenge": "trophy",
  "room-reservation": "sparkles",
  "group-order": "receipt",
  "trip-planner": "car",
  "meeting-scheduler": "check-square",
  "trivia-quiz": "trophy",
  "daily-journal": "sparkles",
};

/** Shared by handleNeed's mini_app path and handleSurpriseMe — persists a
 * generated spec as a running app, owned by userId, with a join code. */
async function persistApp(spec: MiniAppSpecification, userId: string) {
  const primarySlug = spec.toolDnaSlug[0];
  const { version } = await getLatestToolDnaVersion(primarySlug);

  const appInstance = await db.appInstance.create({
    data: {
      title: spec.title,
      icon: spec.icon,
      toolDnaVersionId: version.id,
      specJson: JSON.stringify(spec),
      creatorId: userId,
    },
  });

  await db.miniAppSpecification.create({
    data: { appInstanceId: appInstance.id, version: spec.version, specJson: JSON.stringify(spec), changeSummary: "Created" },
  });

  await db.appMember.create({ data: { appInstanceId: appInstance.id, userId, role: "owner" } });
  await createJoinCode(appInstance.id, "participant");

  return appInstance;
}

export type NeedOutcome =
  | { kind: "chat_answer"; text: string }
  | { kind: "reminder"; text: string; at?: string }
  | { kind: "clarify"; question: string }
  | { kind: "mini_app"; appInstanceId: string; title: string }
  | { kind: "unsupported_capability"; missing: string; explanation: string };

/** "Surprise me" — skip the text/AI classification entirely and instantly
 * create an app from a randomly chosen Tool DNA template, for people who
 * don't want to type a description. */
export async function handleSurpriseMe(userId: string): Promise<NeedOutcome> {
  await ensureToolDnaSeeded();
  const templates = listSimpleToolDna();
  const def = templates[Math.floor(Math.random() * templates.length)];
  const spec = buildSpec(def, { title: def.name, icon: RANDOM_ICON_BY_SLUG[def.slug] });
  const appInstance = await persistApp(spec, userId);
  return { kind: "mini_app", appInstanceId: appInstance.id, title: spec.title };
}

/**
 * The single entry point for "What do you need?". Classifies the request,
 * and for the mini_app path runs it through Tool DNA matching + spec
 * generation + persistence + join-code minting. See ARCHITECTURE.md §1.
 */
export async function handleNeed(text: string, userId: string): Promise<NeedOutcome> {
  const started = Date.now();
  const ai = getAIProvider({ anthropicKey: process.env.ANTHROPIC_API_KEY, geminiKey: process.env.GEMINI_API_KEY });
  const hasExistingApps = (await db.appMember.count({ where: { userId } })) > 0;

  const classification = await ai.understandNeed(text, { hasExistingApps });

  await db.aIRequest.create({
    data: {
      userId,
      inputText: text,
      decision: classification.kind,
      provider: ai.name,
      outputJson: JSON.stringify(classification),
      latencyMs: Date.now() - started,
    },
  });

  if (classification.kind === "reminder") {
    await db.notification.create({
      data: {
        userId,
        type: "reminder",
        payload: JSON.stringify({ text: classification.reminderText ?? text, at: classification.reminderAt }),
      },
    });
    return { kind: "reminder", text: classification.reminderText ?? text, at: classification.reminderAt };
  }

  if (classification.kind === "chat_answer") {
    return { kind: "chat_answer", text: classification.chatAnswer ?? "I'm not sure — could you rephrase that as something you need to track or coordinate?" };
  }

  // mini_app: composed directly from the primitive registry (see
  // generativePlanner.ts) rather than matched against the fixed Tool DNA
  // catalog — ensureToolDnaSeeded() is still needed because the offline
  // HeuristicAIProvider's planApp falls back to today's selectToolDNA +
  // generateSpecification behavior internally.
  await ensureToolDnaSeeded();
  let planned;
  try {
    planned = await ai.planApp(text, { hasExistingApps });
  } catch (err) {
    // A provider-level failure (network error, rate limit, temporary
    // outage) — never leak the raw error to the user; ask them to retry
    // rather than silently falling back to template matching. Logged
    // server-side so the actual cause is visible in the dev console.
    console.error("[handleNeed] ai.planApp failed:", err);
    return { kind: "clarify", question: "The AI planner is temporarily unavailable — please try again in a moment." };
  }

  if (planned.status === "clarify") {
    return { kind: "clarify", question: planned.question };
  }
  if (planned.status === "unsupported_capability") {
    return { kind: "unsupported_capability", missing: planned.missing, explanation: planned.explanation };
  }

  const appInstance = await persistApp(planned.spec, userId);
  return { kind: "mini_app", appInstanceId: appInstance.id, title: planned.spec.title };
}
