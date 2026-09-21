import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";

/** Everyone this user is friends with, plus requests waiting on either side. */
export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireUser(req);
  } catch {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const rows = await db.friendship.findMany({
    where: { OR: [{ requesterId: user.id }, { addresseeId: user.id }] },
    include: { requester: true, addressee: true },
    orderBy: { createdAt: "desc" },
  });

  const friends = [];
  const incoming = [];
  const outgoing = [];
  for (const r of rows) {
    const other = r.requesterId === user.id ? r.addressee : r.requester;
    const entry = { id: r.id, userId: other.id, name: other.name, email: other.email, createdAt: r.createdAt };
    if (r.status === "accepted") friends.push(entry);
    else if (r.status === "pending" && r.addresseeId === user.id) incoming.push(entry);
    else if (r.status === "pending" && r.requesterId === user.id) outgoing.push(entry);
  }

  return NextResponse.json({ friends, incoming, outgoing });
}

const AddSchema = z.object({ email: z.string().email() });

/** Send a friend request by email. */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser(req);
  } catch {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const parsed = AddSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });

  const target = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase().trim() } });
  if (!target) return NextResponse.json({ error: "No account with that email" }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "That's you" }, { status: 400 });

  const existing = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, addresseeId: target.id },
        { requesterId: target.id, addresseeId: user.id },
      ],
    },
  });

  if (existing) {
    if (existing.status === "accepted") return NextResponse.json({ error: "Already friends" }, { status: 400 });
    if (existing.status === "pending") return NextResponse.json({ error: "Request already pending" }, { status: 400 });
    // A previously declined request from this user to that user can be retried.
    if (existing.requesterId === user.id) {
      const updated = await db.friendship.update({ where: { id: existing.id }, data: { status: "pending", respondedAt: null } });
      await db.notification.create({ data: { userId: target.id, type: "friend_request", payload: JSON.stringify({ fromUserId: user.id, fromName: user.name }) } });
      return NextResponse.json({ id: updated.id, status: updated.status });
    }
  }

  const created = await db.friendship.create({ data: { requesterId: user.id, addresseeId: target.id } });
  await db.notification.create({ data: { userId: target.id, type: "friend_request", payload: JSON.stringify({ fromUserId: user.id, fromName: user.name }) } });
  return NextResponse.json({ id: created.id, status: created.status });
}
