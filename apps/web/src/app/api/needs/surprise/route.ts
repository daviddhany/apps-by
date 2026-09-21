import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { handleSurpriseMe } from "@/ai/orchestrator";

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser(req);
  } catch {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  try {
    const outcome = await handleSurpriseMe(user.id);
    return NextResponse.json(outcome);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Something went wrong" }, { status: 500 });
  }
}
