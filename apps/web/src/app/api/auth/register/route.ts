import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword, setSessionCookie, createSessionToken } from "@/server/auth";

const RegisterSchema = z.object({
  name: z.string().min(1).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  const parsed = RegisterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({ data: { name, email, passwordHash } });
  await setSessionCookie(user.id);
  const token = createSessionToken(user.id);

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, token });
}
