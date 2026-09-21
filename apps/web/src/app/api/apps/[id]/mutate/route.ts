import { NextRequest, NextResponse } from "next/server";
import { StructuredMutationSchema } from "@needly/core";
import { loadAppForMember } from "@/server/loadApp";
import { executeAction, ActionError } from "@/runtime/executeAction";
import type { MemberRole } from "@/server/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { user, spec, membership } = await loadAppForMember(id, undefined, req);
    const parsed = StructuredMutationSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid mutation payload" }, { status: 400 });

    const result = await executeAction({
      appInstanceId: id,
      actorId: user.id,
      actorRole: membership.role as MemberRole,
      spec,
      mutation: parsed.data,
    });

    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof ActionError) return NextResponse.json({ error: err.message }, { status: err.status });
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status });
  }
}
