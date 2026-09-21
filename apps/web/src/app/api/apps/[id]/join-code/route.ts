import { NextResponse } from "next/server";
import { loadAppForMember } from "@/server/loadApp";
import { createJoinCode } from "@/server/joinCode";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await loadAppForMember(id, ["owner", "admin"], req);
    const joinCode = await createJoinCode(id, "participant");
    return NextResponse.json({ code: joinCode.code });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status });
  }
}
