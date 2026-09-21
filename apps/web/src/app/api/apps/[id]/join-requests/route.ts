import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { loadAppForMember } from "@/server/loadApp";

/** Pending join requests for a private app — owner/admin only. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await loadAppForMember(id, ["owner", "admin"], req);
    const requests = await db.joinRequest.findMany({
      where: { appInstanceId: id, status: "pending" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({
      requests: requests.map((r) => ({ id: r.id, userId: r.userId, name: r.user.name, role: r.role, createdAt: r.createdAt })),
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status });
  }
}
