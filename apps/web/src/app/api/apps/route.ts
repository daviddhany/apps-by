import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";

export async function GET(req: NextRequest) {
  const user = await requireUser(req).catch(() => null);
  if (!user) return NextResponse.json({ apps: [] });

  const memberships = await db.appMember.findMany({
    where: { userId: user.id },
    include: { appInstance: true },
    orderBy: { appInstance: { updatedAt: "desc" } },
  });

  const apps = memberships.map((m) => ({
    id: m.appInstance.id,
    title: m.appInstance.title,
    icon: m.appInstance.icon,
    role: m.role,
    status: m.appInstance.status,
    updatedAt: m.appInstance.updatedAt,
  }));

  return NextResponse.json({ apps });
}
