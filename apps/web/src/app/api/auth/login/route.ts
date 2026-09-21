import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { verifyPassword, setSessionCookie, createSessionToken } from "@/server/auth";
import { rateLimit } from "@/server/rateLimit";

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`login:${ip}`, { capacity: 10, refillPerSecond: 0.2 })) {
    return NextResponse.json({ error: "Too many attempts, try again shortly" }, { status: 429 });
  }

  const parsed = LoginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Web keeps its httpOnly cookie; a mobile client (no shared cookie jar)
  // stores this `token` instead and sends it back as `Authorization: Bearer`.
  await setSessionCookie(user.id);
  const token = createSessionToken(user.id);
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, token });
}
