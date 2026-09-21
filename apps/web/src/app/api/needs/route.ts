import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handleNeed } from "@/ai/orchestrator";

const NeedSchema = z.object({ text: z.string().min(1).max(2000) });

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser(req);
  } catch {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const parsed = NeedSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Tell me a bit more" }, { status: 400 });

  try {
    const outcome = await handleNeed(parsed.data.text, user.id);
    return NextResponse.json(outcome);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Something went wrong" }, { status: 500 });
  }
}
