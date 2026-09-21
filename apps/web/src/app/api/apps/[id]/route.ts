import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { loadAppForMember } from "@/server/loadApp";
import { computeForSpec } from "@needly/core";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { spec, membership, appInstance } = await loadAppForMember(id, undefined, req);

    const [records, members, joinCodes] = await Promise.all([
      db.appData.findMany({ where: { appInstanceId: id } }),
      db.appMember.findMany({ where: { appInstanceId: id }, include: { user: true } }),
      db.joinCode.findMany({ where: { appInstanceId: id } }),
    ]);

    const parsedRecords = records.map((r) => ({ id: r.id, entityType: r.entityType, data: JSON.parse(r.data) }));
    const computed = computeForSpec(spec, parsedRecords);

    return NextResponse.json({
      appInstanceId: id,
      spec,
      status: appInstance.status,
      role: membership.role,
      data: parsedRecords,
      computed,
      members: members.map((m) => ({ id: m.userId, name: m.user.name, role: m.role, isGuest: m.user.isGuest })),
      joinCodes: joinCodes.map((j) => ({ code: j.code, role: j.role })),
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Not found" }, { status });
  }
}

const PatchSchema = z.object({ status: z.enum(["active", "archived"]) });

/** Archive/unarchive — reversible, owner or admin only. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await loadAppForMember(id, ["owner", "admin"], req);
    const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    await db.appInstance.update({ where: { id }, data: { status: parsed.data.status } });
    return NextResponse.json({ status: parsed.data.status });
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
