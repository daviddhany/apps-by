import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { applyRemixToDefinition } from "@needly/core";
import type { ToolDnaDefinition } from "@needly/core";

const RemixSchema = z.object({ instruction: z.string().min(1).max(300), title: z.string().min(1).max(80).optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const parsed = RemixSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Describe how you'd like to remix this" }, { status: 400 });

  const source = await db.template.findUnique({ where: { id }, include: { toolDnaVersion: true } });
  if (!source) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const sourceDef = JSON.parse(source.toolDnaVersion.definitionJson) as ToolDnaDefinition;
  const remixedTitle = parsed.data.title ?? `${source.title} (remix)`;
  const remixedDef = applyRemixToDefinition(sourceDef, parsed.data.instruction, remixedTitle);

  const latestVersion = await db.toolDNAVersion.findFirst({ where: { toolDnaId: source.toolDnaId }, orderBy: { version: "desc" } });
  const newVersion = await db.toolDNAVersion.create({
    data: {
      toolDnaId: source.toolDnaId,
      version: (latestVersion?.version ?? 0) + 1,
      definitionJson: JSON.stringify(remixedDef),
      changelog: `Remix: ${parsed.data.instruction}`,
    },
  });

  const resultTemplate = await db.template.create({
    data: {
      toolDnaId: source.toolDnaId,
      toolDnaVersionId: newVersion.id,
      title: remixedTitle,
      description: `${source.description} — remixed: ${parsed.data.instruction}`,
      category: source.category,
      visibility: "private",
      creatorId: user.id,
      parentTemplateId: source.id,
    },
  });

  await db.templateRemix.create({
    data: { sourceTemplateId: source.id, resultTemplateId: resultTemplate.id, instructionText: parsed.data.instruction },
  });
  await db.template.update({ where: { id: source.id }, data: { remixCount: { increment: 1 } } });

  return NextResponse.json({ id: resultTemplate.id });
}
