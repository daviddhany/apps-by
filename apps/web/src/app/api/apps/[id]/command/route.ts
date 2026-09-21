import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { loadAppForMember } from "@/server/loadApp";
import { getAIProvider } from "@needly/core";
import { executeAction, ActionError } from "@/runtime/executeAction";
import { applySpecPatch } from "@needly/core";
import { mergeToolIntoSpec } from "@needly/core";
import { publish } from "@/server/realtime";
import type { MemberRole } from "@/server/auth";

const CommandSchema = z.object({ text: z.string().min(1).max(500) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { user, spec, membership } = await loadAppForMember(id, undefined, req);
    const parsed = CommandSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Say what you'd like to change" }, { status: 400 });

    const role = membership.role as MemberRole;
    const ai = getAIProvider(process.env.ANTHROPIC_API_KEY);
    const started = Date.now();
    const result = await ai.mutateApplication(parsed.data.text, spec, role);

    await db.aIRequest.create({
      data: {
        userId: user.id,
        appInstanceId: id,
        inputText: parsed.data.text,
        decision: "modify_app",
        provider: ai.name,
        outputJson: JSON.stringify(result),
        latencyMs: Date.now() - started,
      },
    });

    if (result.type === "clarify") {
      return NextResponse.json({ type: "clarify", question: result.question });
    }

    if (result.type === "mutation") {
      const data = await executeAction({ appInstanceId: id, actorId: user.id, actorRole: role, spec, mutation: result.mutation });
      return NextResponse.json({ type: "mutation", result: data });
    }

    // spec_patch
    const roleDef = spec.roles.find((r) => r.role === role);
    if (!roleDef?.canEditSpec) {
      return NextResponse.json({ error: "Only owners/admins can change how this app works" }, { status: 403 });
    }

    const mergeMatch = result.summary.match(/^__merge_tool__(.+)$/);
    const nextSpec = mergeMatch ? mergeToolIntoSpec(spec, mergeMatch[1]) : applySpecPatch(spec, result.ops);

    await db.appInstance.update({ where: { id }, data: { specJson: JSON.stringify(nextSpec) } });
    await db.miniAppSpecification.create({
      data: { appInstanceId: id, version: nextSpec.version, specJson: JSON.stringify(nextSpec), changeSummary: result.summary },
    });
    await db.auditLog.create({ data: { actorId: user.id, action: "spec_patch", targetType: "spec", targetId: id, afterJson: JSON.stringify(nextSpec) } });

    publish(id, { type: "spec.updated", payload: nextSpec, at: new Date().toISOString() });

    return NextResponse.json({ type: "spec_patch", summary: result.summary, spec: nextSpec });
  } catch (err) {
    if (err instanceof ActionError) return NextResponse.json({ error: err.message }, { status: err.status });
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status });
  }
}
