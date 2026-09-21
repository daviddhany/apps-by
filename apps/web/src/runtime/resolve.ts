import { db } from "@/server/db";

/**
 * Resolves a "person-ish" reference (either an existing AppData id, or a
 * plain name typed by a user/AI) to an AppData row id for the given entity
 * type, creating a new record if no match exists. This is what lets natural
 * language like "Ahmed paid 20 for dinner" work without the user ever
 * touching an ID — see ARCHITECTURE.md §7.
 */
export async function resolvePersonRef(appInstanceId: string, entityType: string, ref: string): Promise<string> {
  const existingById = await db.appData.findFirst({ where: { id: ref, appInstanceId, entityType } });
  if (existingById) return existingById.id;

  const candidates = await db.appData.findMany({ where: { appInstanceId, entityType } });
  const match = candidates.find((c) => {
    const data = JSON.parse(c.data) as Record<string, unknown>;
    return typeof data.name === "string" && data.name.toLowerCase() === ref.trim().toLowerCase();
  });
  if (match) return match.id;

  const created = await db.appData.create({
    data: { appInstanceId, entityType, data: JSON.stringify({ name: ref.trim() }) },
  });
  return created.id;
}

export async function resolveManyPersonRefs(appInstanceId: string, entityType: string, refs: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const r of refs) ids.push(await resolvePersonRef(appInstanceId, entityType, r));
  return ids;
}

export async function findByLabel(appInstanceId: string, entityType: string, labelField: string, label: string) {
  const candidates = await db.appData.findMany({ where: { appInstanceId, entityType } });
  return candidates.find((c) => {
    const data = JSON.parse(c.data) as Record<string, unknown>;
    const v = data[labelField];
    return typeof v === "string" && v.toLowerCase().includes(label.trim().toLowerCase());
  });
}
