import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@needly/core";
import { requireUser } from "@/server/auth";

const ImproveSchema = z.object({ text: z.string().min(1).max(2000) });

export async function POST(req: NextRequest) {
  try {
    await requireUser(req);
  } catch {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const parsed = ImproveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Nothing to improve" }, { status: 400 });

  try {
    const ai = getAIProvider({ anthropicKey: process.env.ANTHROPIC_API_KEY, geminiKey: process.env.GEMINI_API_KEY });
    const improved = await ai.improveNeed(parsed.data.text);
    return NextResponse.json({ improved });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Couldn't improve that" }, { status: 500 });
  }
}
