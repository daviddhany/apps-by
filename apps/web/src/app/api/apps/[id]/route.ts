import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { loadAppForMember } from "@/server/loadApp";
import { computeForSpec } from "@needly/core";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { spec, membership, appInstance } = await loadAppForMember(id, undefined, req);

    const isOwnerOrAdmin = membership.role === "owner" || membership.role === "admin";
    const [records, members, joinCodes, pendingRequestCount] = await Promise.all([
      db.appData.findMany({ where: { appInstanceId: id } }),
      db.appMember.findMany({ where: { appInstanceId: id }, include: { user: true } }),
      db.joinCode.findMany({ where: { appInstanceId: id } }),
      isOwnerOrAdmin ? db.joinRequest.count({ where: { appInstanceId: id, status: "pending" } }) : 0,
    ]);

    const parsedRecords = records.map((r) => ({ id: r.id, entityType: r.entityType, data: JSON.parse(r.data) }));
    const computed = computeForSpec(spec, parsedRecords);

    return NextResponse.json({
      appInstanceId: id,
      spec,
      status: appInstance.status,
      visibility: appInstance.visibility,
      role: membership.role,
      data: parsedRecords,
      computed,
      members: members.map((m) => ({ id: m.userId, name: m.user.name, role: m.role, isGuest: m.user.isGuest })),
      joinCodes: joinCodes.map((j) => ({ code: j.code, role: j.role })),
      pendingRequestCount,
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Not found" }, { status });
  }
}

const PatchSchema = z.object({
  status: z.enum(["active", "archived"]).optional(),
  visibility: z.enum(["public", "private"]).optional(),
});

/** Archive/unarchive and/or toggle public/private — reversible, owner or admin only. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await loadAppForMember(id, ["owner", "admin"], req);
    const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success || (!parsed.data.status && !parsed.data.visibility)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await db.appInstance.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ status: updated.status, visibility: updated.visibility });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status });
  }
}

/** Permanent delete — irreversible, owner only. Cascades to every related
 * row via the schema's onDelete: Cascade relations (members, data, join
 * codes, spec history, invitations, AI mutations). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { user } = await loadAppForMember(id, ["owner"], req);
    await db.auditLog.create({ data: { actorId: user.id, action: "delete_app", targetType: "AppInstance", targetId: id } });
    await db.appInstance.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status });
  }
}
