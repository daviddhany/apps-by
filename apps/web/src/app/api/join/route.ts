import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getCurrentUser, setSessionCookie, createSessionToken } from "@/server/auth";
import { redeemJoinCode } from "@/server/joinCode";
import { rateLimit } from "@/server/rateLimit";
import { publish } from "@/server/realtime";

const JoinSchema = z.object({ code: z.string().min(4).max(16), guestName: z.string().min(1).max(60).optional() });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const parsed = JoinSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a join code" }, { status: 400 });

  if (!rateLimit(`join:${ip}:${parsed.data.code.toUpperCase()}`, { capacity: 8, refillPerSecond: 0.1 })) {
    return NextResponse.json({ error: "Too many attempts, try again shortly" }, { status: 429 });
  }

  let user = await getCurrentUser(req);
  let newGuestToken: string | undefined;
  if (!user) {
    if (!parsed.data.guestName) {
      return NextResponse.json({ error: "needs_name" }, { status: 401 });
    }
    // Guest participation: no password, scoped to whatever role the join
    // code grants (never elevated by client input — redeemJoinCode reads the
    // role from the DB row, not from the request).
    user = await db.user.create({ data: { name: parsed.data.guestName, isGuest: true } });
    await setSessionCookie(user.id);
    newGuestToken = createSessionToken(user.id);
  }

  try {
    const { appInstanceId, role, visibility } = await redeemJoinCode(parsed.data.code);
    const existing = await db.appMember.findUnique({ where: { appInstanceId_userId: { appInstanceId, userId: user.id } } });
    if (existing) {
      return NextResponse.json({ appInstanceId, token: newGuestToken });
    }

    if (visibility === "private") {
      const existingRequest = await db.joinRequest.findUnique({ where: { appInstanceId_userId: { appInstanceId, userId: user.id } } });
      if (!existingRequest) {
        await db.joinRequest.create({ data: { appInstanceId, userId: user.id, role } });
        const owners = await db.appMember.findMany({ where: { appInstanceId, role: { in: ["owner", "admin"] } } });
        await db.notification.createMany({
          data: owners.map((m) => ({ userId: m.userId, type: "join_request", payload: JSON.stringify({ appInstanceId, requesterName: user.name }) })),
        });
      } else if (existingRequest.status === "rejected") {
        await db.joinRequest.update({ where: { id: existingRequest.id }, data: { status: "pending", respondedAt: null, respondedById: null } });
      }
      return NextResponse.json({ pending: true, token: newGuestToken });
    }

    await db.appMember.create({ data: { appInstanceId, userId: user.id, role } });
    publish(appInstanceId, { type: "member.joined", payload: { userId: user.id, name: user.name }, at: new Date().toISOString() });
    return NextResponse.json({ appInstanceId, token: newGuestToken });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Couldn't join" }, { status: 400 });
  }
}
