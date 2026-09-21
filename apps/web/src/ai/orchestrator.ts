import { db } from "@/server/db";
import { getAIProvider } from "@needly/core";
import { ensureToolDnaSeeded, getLatestToolDnaVersion } from "@/server/seedToolDna";
import { createJoinCode } from "@/server/joinCode";
import type { MiniAppSpecification } from "@needly/core";

export type NeedOutcome =
  | { kind: "chat_answer"; text: string }
  | { kind: "reminder"; text: string; at?: string }
  | { kind: "clarify"; question: string }
  | { kind: "mini_app"; appInstanceId: string; title: string };

/**
 * The single entry point for "What do you need?". Classifies the request,
 * and for the mini_app path runs it through Tool DNA matching + spec
 * generation + persistence + join-code minting. See ARCHITECTURE.md §1.
 */
export async function handleNeed(text: string, userId: string): Promise<NeedOutcome> {
  const started = Date.now();
  const ai = getAIProvider(process.env.ANTHROPIC_API_KEY);
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

  // mini_app
  await ensureToolDnaSeeded();
  const match = await ai.selectToolDNA(text);
  if (match.decision === "clarify") {
    return { kind: "clarify", question: match.clarifyingQuestion ?? "Could you tell me more about what you need?" };
  }

  let spec: MiniAppSpecification;
  try {
    spec = await ai.generateSpecification(text, match);
  } catch (err) {
    return { kind: "clarify", question: err instanceof Error ? err.message : "Could you describe that differently?" };
  }

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

  return { kind: "mini_app", appInstanceId: appInstance.id, title: spec.title };
}
