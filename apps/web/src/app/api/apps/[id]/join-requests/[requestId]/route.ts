import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { loadAppForMember } from "@/server/loadApp";
import { publish } from "@/server/realtime";

const RespondSchema = z.object({ action: z.enum(["approve", "reject"]) });

/** Approve or reject a pending join request — owner/admin only. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  const { id, requestId } = await params;
  try {
    const { user } = await loadAppForMember(id, ["owner", "admin"], req);
    const parsed = RespondSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    const request = await db.joinRequest.findFirst({ where: { id: requestId, appInstanceId: id, status: "pending" } });
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const status = parsed.data.action === "approve" ? "approved" : "rejected";
    await db.joinRequest.update({ where: { id: request.id }, data: { status, respondedAt: new Date(), respondedById: user.id } });

    if (status === "approved") {
      const existing = await db.appMember.findUnique({ where: { appInstanceId_userId: { appInstanceId: id, userId: request.userId } } });
      if (!existing) {
        await db.appMember.create({ data: { appInstanceId: id, userId: request.userId, role: request.role } });
        publish(id, { type: "member.joined", payload: { userId: request.userId }, at: new Date().toISOString() });
      }
    }

    await db.notification.create({
      data: {
        userId: request.userId,
        type: "join_request_" + status,
        payload: JSON.stringify({ appInstanceId: id }),
      },
    });

    return NextResponse.json({ status });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status });
  }
}
