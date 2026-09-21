import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { createJoinCode } from "@/server/joinCode";
import { buildSpec } from "@needly/core";
import type { ToolDnaDefinition } from "@needly/core";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const template = await db.template.findUnique({ where: { id }, include: { toolDnaVersion: true } });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  if (template.visibility === "private" && template.creatorId !== user.id) {
    return NextResponse.json({ error: "This template is private" }, { status: 403 });
  }

  const def = JSON.parse(template.toolDnaVersion.definitionJson) as ToolDnaDefinition;
  const spec = buildSpec(def, { title: template.title });

  const appInstance = await db.appInstance.create({
    data: {
      title: spec.title,
      icon: spec.icon,
      toolDnaVersionId: template.toolDnaVersionId,
      templateId: template.id,
      specJson: JSON.stringify(spec),
      creatorId: user.id,
    },
  });
  await db.miniAppSpecification.create({ data: { appInstanceId: appInstance.id, version: spec.version, specJson: JSON.stringify(spec), changeSummary: `Created from template "${template.title}"` } });
  await db.appMember.create({ data: { appInstanceId: appInstance.id, userId: user.id, role: "owner" } });
  await createJoinCode(appInstance.id, "participant");
  await db.template.update({ where: { id }, data: { usageCount: { increment: 1 } } });

  return NextResponse.json({ appInstanceId: appInstance.id });
}
