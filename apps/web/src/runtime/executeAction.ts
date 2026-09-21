import { db } from "@/server/db";
import { publish } from "@/server/realtime";
import { ActionPayloadSchemas } from "@needly/core";
import type { MiniAppSpecification, Role, StructuredMutation } from "@needly/core";
import { resolvePersonRef, resolveManyPersonRefs, findByLabel } from "./resolve";
import { advanceBracket, generateBracket } from "@needly/core";
import { checkActionAllowed, PermissionError } from "@needly/core";

export class ActionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface ExecuteParams {
  appInstanceId: string;
  actorId: string;
  actorRole: Role;
  spec: MiniAppSpecification;
  mutation: StructuredMutation;
}

/**
 * Single allowlisted-mutation gateway. Every write to AppData in this app
 * goes through here so the allowlist/permission/audit guarantees in
 * ARCHITECTURE.md §7 hold for every caller (form UI, NL command, remix).
 */
export async function executeAction({ appInstanceId, actorId, actorRole, spec, mutation }: ExecuteParams) {
  let actionDef;
  try {
    actionDef = checkActionAllowed(spec, mutation.action, mutation.entity, actorRole);
  } catch (err) {
    if (err instanceof PermissionError) throw new ActionError(err.message, err.status);
    throw err;
  }

  const result = await runExecutor(appInstanceId, actorId, actionDef.payloadSchemaKey, mutation);

  await db.auditLog.create({
    data: {
      actorId,
      action: mutation.action,
      targetType: mutation.entity ?? "unknown",
      targetId: result.id ?? "n/a",
      afterJson: JSON.stringify(result),
    },
  });

  publish(appInstanceId, { type: "data.changed", entityType: mutation.entity, payload: result, at: new Date().toISOString() });

  return result;
}

async function runExecutor(appInstanceId: string, actorId: string, schemaKey: string, mutation: StructuredMutation) {
  switch (schemaKey) {
    case "generic.add": {
      const raw = mutation.payload as { entityType?: string; fields?: Record<string, unknown> };
      const entityType = raw.entityType ?? mutation.entity!;
      const parsed = ActionPayloadSchemas["generic.add"].parse({ entityType, fields: raw.fields ?? mutation.payload });
      return db.appData.create({ data: { appInstanceId, entityType: parsed.entityType, data: JSON.stringify(parsed.fields), createdById: actorId } });
    }
    case "generic.edit": {
      const raw = mutation.payload as { id: string; fields: Record<string, unknown> };
      const existing = await db.appData.findFirstOrThrow({ where: { id: raw.id, appInstanceId } });
      const merged = { ...JSON.parse(existing.data), ...raw.fields };
      return db.appData.update({ where: { id: raw.id }, data: { data: JSON.stringify(merged) } });
    }
    case "generic.delete": {
      const raw = mutation.payload as { id: string };
      return db.appData.delete({ where: { id: raw.id } });
    }
    case "expense.add": {
      const raw = mutation.payload as {
        description: string;
        amount: number;
        paidByParticipantId: string;
        splitAmong?: string[];
        splitMode?: string;
        exactShares?: Record<string, number>;
      };
      const paidBy = await resolvePersonRef(appInstanceId, "expense.participant", raw.paidByParticipantId);
      const splitAmong = raw.splitAmong ? await resolveManyPersonRefs(appInstanceId, "expense.participant", raw.splitAmong) : undefined;
      const payload = ActionPayloadSchemas["expense.add"].parse({ ...raw, paidByParticipantId: paidBy, splitAmong });
      return db.appData.create({
        data: { appInstanceId, entityType: "expense.expense", data: JSON.stringify({ ...payload, createdAt: new Date().toISOString() }), createdById: actorId },
      });
    }
    case "expense.settle": {
      const raw = mutation.payload as { fromParticipantId: string; toParticipantId: string; amount: number };
      const from = await resolvePersonRef(appInstanceId, "expense.participant", raw.fromParticipantId);
      const to = await resolvePersonRef(appInstanceId, "expense.participant", raw.toParticipantId);
      const payload = ActionPayloadSchemas["expense.settle"].parse({ ...raw, fromParticipantId: from, toParticipantId: to });
      return db.appData.create({ data: { appInstanceId, entityType: "expense.settlement", data: JSON.stringify(payload), createdById: actorId } });
    }
    case "tournament.record_score": {
      let raw = mutation.payload as { matchId: string; scoreA: number; scoreB: number };
      if (raw.matchId === "__resolve_by_label__") throw new ActionError("Use the bracket UI to record a score", 400);
      const payload = ActionPayloadSchemas["tournament.record_score"].parse(raw);
      const matchRow = await db.appData.findFirstOrThrow({ where: { id: payload.matchId, appInstanceId, entityType: "tournament.match" } });
      const allMatches = await db.appData.findMany({ where: { appInstanceId, entityType: "tournament.match" } });
      const asMatches = allMatches.map((m) => ({ id: m.id, ...JSON.parse(m.data) }));
      const updated = advanceBracket(asMatches, payload.matchId, payload.scoreA, payload.scoreB);
      for (const m of updated) {
        const { id, ...fields } = m;
        await db.appData.update({ where: { id }, data: { data: JSON.stringify(fields) } });
      }
      return matchRow;
    }
    case "tournament.generate_bracket": {
      const players = await db.appData.findMany({ where: { appInstanceId, entityType: "tournament.player" } });
      if (players.length < 2) throw new ActionError("Add at least 2 players before generating the bracket", 400);
      await db.appData.deleteMany({ where: { appInstanceId, entityType: "tournament.match" } });
      const bracket = generateBracket(players.map((p) => p.id));
      const created = [];
      for (const m of bracket) {
        const { id: _localId, ...fields } = m;
        created.push(await db.appData.create({ data: { appInstanceId, entityType: "tournament.match", data: JSON.stringify(fields), createdById: actorId } }));
      }
      return created[0];
    }
    case "attendance.checkin": {
      const raw = mutation.payload as { participantId: string; eventId?: string; present: boolean };
      const participantId = await resolvePersonRef(appInstanceId, "attendance.participant", raw.participantId);
      const payload = ActionPayloadSchemas["attendance.checkin"].parse({ ...raw, participantId });
      return db.appData.create({ data: { appInstanceId, entityType: "attendance.checkin", data: JSON.stringify(payload), createdById: actorId } });
    }
    case "checklist.complete": {
      let raw = mutation.payload as { itemId: string; itemLabel?: string; done: boolean };
      let itemId = raw.itemId;
      if (itemId === "__resolve_by_label__" && raw.itemLabel) {
        const match = await findByLabel(appInstanceId, "checklist.item", "title", raw.itemLabel);
        if (!match) throw new ActionError(`No checklist item matching "${raw.itemLabel}"`, 404);
        itemId = match.id;
      }
      const payload = ActionPayloadSchemas["checklist.complete"].parse({ itemId, done: raw.done });
      const existing = await db.appData.findFirstOrThrow({ where: { id: payload.itemId, appInstanceId } });
      const merged = { ...JSON.parse(existing.data), done: payload.done };
      return db.appData.update({ where: { id: payload.itemId }, data: { data: JSON.stringify(merged) } });
    }
    case "voting.vote": {
      let raw = mutation.payload as { pollId: string; optionId: string; optionLabel?: string; participantId?: string };
      let pollId = raw.pollId;
      if (pollId === "__open_poll__") {
        const openPoll = (await db.appData.findMany({ where: { appInstanceId, entityType: "voting.poll" } })).find(
          (p) => JSON.parse(p.data).status !== "closed"
        );
        if (!openPoll) throw new ActionError("No open poll to vote on", 404);
        pollId = openPoll.id;
      }
      let optionId = raw.optionId;
      if (optionId === "__resolve_by_label__" && raw.optionLabel) {
        const poll = await db.appData.findFirstOrThrow({ where: { id: pollId, appInstanceId } });
        const options: string[] = JSON.parse(poll.data).options ?? [];
        const found = options.find((o) => o.toLowerCase().includes(raw.optionLabel!.toLowerCase()));
        if (!found) throw new ActionError(`No option matching "${raw.optionLabel}"`, 404);
        optionId = found;
      }
      const payload = ActionPayloadSchemas["voting.vote"].parse({ pollId, optionId });
      return db.appData.create({ data: { appInstanceId, entityType: "voting.vote", data: JSON.stringify({ ...payload, participantId: actorId }), createdById: actorId } });
    }
    case "voting.close": {
      const raw = mutation.payload as { pollId: string };
      const payload = ActionPayloadSchemas["voting.close"].parse(raw);
      const poll = await db.appData.findFirstOrThrow({ where: { id: payload.pollId, appInstanceId } });
      const merged = { ...JSON.parse(poll.data), status: "closed" };
      return db.appData.update({ where: { id: payload.pollId }, data: { data: JSON.stringify(merged) } });
    }
    case "meeting.vote": {
      let raw = mutation.payload as { meetingId: string; optionId: string; optionLabel?: string };
      let meetingId = raw.meetingId;
      if (meetingId === "__open_meeting__") {
        const openMeeting = (await db.appData.findMany({ where: { appInstanceId, entityType: "meeting.meeting" } })).find(
          (m) => JSON.parse(m.data).status !== "scheduled"
        );
        if (!openMeeting) throw new ActionError("No open meeting to mark availability for", 404);
        meetingId = openMeeting.id;
      }
      let optionId = raw.optionId;
      if (optionId === "__resolve_by_label__" && raw.optionLabel) {
        const meeting = await db.appData.findFirstOrThrow({ where: { id: meetingId, appInstanceId } });
        const options: string[] = JSON.parse(meeting.data).options ?? [];
        const found = options.find((o) => o.toLowerCase().includes(raw.optionLabel!.toLowerCase()));
        if (!found) throw new ActionError(`No proposed time matching "${raw.optionLabel}"`, 404);
        optionId = found;
      }
      const payload = ActionPayloadSchemas["meeting.vote"].parse({ meetingId, optionId });
      return db.appData.create({ data: { appInstanceId, entityType: "meeting.availability", data: JSON.stringify({ ...payload, memberId: actorId }), createdById: actorId } });
    }
    case "meeting.close": {
      const raw = mutation.payload as { meetingId: string };
      const payload = ActionPayloadSchemas["meeting.close"].parse(raw);
      const meeting = await db.appData.findFirstOrThrow({ where: { id: payload.meetingId, appInstanceId } });
      const merged = { ...JSON.parse(meeting.data), status: "scheduled" };
      return db.appData.update({ where: { id: payload.meetingId }, data: { data: JSON.stringify(merged) } });
    }
    case "quiz.answer": {
      let raw = mutation.payload as { questionId: string; optionText: string };
      const question = await db.appData.findFirstOrThrow({ where: { id: raw.questionId, appInstanceId, entityType: "quiz.question" } });
      const questionData = JSON.parse(question.data) as { quizId: string; options: string[]; correctOption: string; points?: number };

      const quiz = await db.appData.findFirstOrThrow({ where: { id: questionData.quizId, appInstanceId, entityType: "quiz.quiz" } });
      if (JSON.parse(quiz.data).status === "closed") throw new ActionError("This quiz is closed", 400);

      const already = await db.appData.findMany({ where: { appInstanceId, entityType: "quiz.answer" } });
      const duplicate = already.find((a) => {
        const d = JSON.parse(a.data) as { questionId: string; playerId: string };
        return d.questionId === raw.questionId && d.playerId === actorId;
      });
      if (duplicate) throw new ActionError("You already answered this question", 409);

      const payload = ActionPayloadSchemas["quiz.answer"].parse(raw);
      const correctIndex = Number(questionData.correctOption) - 1;
      const correct = payload.optionText === questionData.options[correctIndex];
      const points = correct ? (questionData.points ?? 10) : 0;
      return db.appData.create({
        data: { appInstanceId, entityType: "quiz.answer", data: JSON.stringify({ ...payload, playerId: actorId, correct, points }), createdById: actorId },
      });
    }
    case "quiz.close": {
      const raw = mutation.payload as { quizId: string };
      const payload = ActionPayloadSchemas["quiz.close"].parse(raw);
      const quiz = await db.appData.findFirstOrThrow({ where: { id: payload.quizId, appInstanceId } });
      const merged = { ...JSON.parse(quiz.data), status: "closed" };
      return db.appData.update({ where: { id: payload.quizId }, data: { data: JSON.stringify(merged) } });
    }
    case "journal.answer": {
      const raw = mutation.payload as { date: string; question: string; answer: string };
      const payload = ActionPayloadSchemas["journal.answer"].parse(raw);
      const existing = await db.appData.findMany({ where: { appInstanceId, entityType: "journal.entry" } });
      const duplicate = existing.find((e) => {
        const d = JSON.parse(e.data) as { authorId: string; date: string };
        return d.authorId === actorId && d.date === payload.date;
      });
      if (duplicate) throw new ActionError("You've already answered today's question", 409);
      return db.appData.create({ data: { appInstanceId, entityType: "journal.entry", data: JSON.stringify({ ...payload, authorId: actorId }), createdById: actorId } });
    }
    case "savings.contribute": {
      const raw = mutation.payload as { participantId: string; amount: number };
      const participantId = await resolvePersonRef(appInstanceId, "savings.participant", raw.participantId);
      const payload = ActionPayloadSchemas["savings.contribute"].parse({ ...raw, participantId });
      return db.appData.create({ data: { appInstanceId, entityType: "savings.contribution", data: JSON.stringify({ ...payload, date: new Date().toISOString() }), createdById: actorId } });
    }
    case "habit.checkin": {
      const raw = mutation.payload as { participantId: string; date: string; done: boolean };
      const participantId = await resolvePersonRef(appInstanceId, "habit.participant", raw.participantId);
      const payload = ActionPayloadSchemas["habit.checkin"].parse({ ...raw, participantId });
      return db.appData.create({ data: { appInstanceId, entityType: "habit.checkin", data: JSON.stringify(payload), createdById: actorId } });
    }
    case "reservation.reserve": {
      const raw = mutation.payload as { resourceId: string; participantId: string; start: string; end: string };
      const participantId = await resolvePersonRef(appInstanceId, "reservation.resource", raw.participantId);
      const payload = ActionPayloadSchemas["reservation.reserve"].parse({ ...raw, participantId });
      return db.appData.create({ data: { appInstanceId, entityType: "reservation.reservation", data: JSON.stringify(payload), createdById: actorId } });
    }
    case "order.add_item": {
      const raw = mutation.payload as { participantId: string; item: string; price: number };
      const participantId = await resolvePersonRef(appInstanceId, "order.participant", raw.participantId);
      const payload = ActionPayloadSchemas["order.add_item"].parse({ ...raw, participantId });
      return db.appData.create({ data: { appInstanceId, entityType: "order.orderItem", data: JSON.stringify(payload), createdById: actorId } });
    }
    default:
      throw new ActionError(`No executor implemented for "${schemaKey}"`, 501);
  }
}
