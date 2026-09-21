import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
}
