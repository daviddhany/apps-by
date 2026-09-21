import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";

const RespondSchema = z.object({ action: z.enum(["accept", "decline"]) });

/** Accept or decline an incoming friend request. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user;
  try {
    user = await requireUser(req);
  } catch {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const parsed = RespondSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const friendship = await db.friendship.findFirst({ where: { id, addresseeId: user.id, status: "pending" } });
  if (!friendship) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const status = parsed.data.action === "accept" ? "accepted" : "declined";
  const updated = await db.friendship.update({ where: { id }, data: { status, respondedAt: new Date() } });

  if (status === "accepted") {
    await db.notification.create({
      data: { userId: friendship.requesterId, type: "friend_request_accepted", payload: JSON.stringify({ byUserId: user.id, byName: user.name }) },
    });
  }

  return NextResponse.json({ status: updated.status });
}

/** Remove an accepted friend, or cancel a request you sent. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user;
  try {
    user = await requireUser(req);
  } catch {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const friendship = await db.friendship.findFirst({ where: { id, OR: [{ requesterId: user.id }, { addresseeId: user.id }] } });
  if (!friendship) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.friendship.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
