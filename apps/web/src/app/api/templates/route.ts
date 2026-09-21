import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";

export async function GET() {
  const templates = await db.template.findMany({
    where: { visibility: "public" },
    include: { toolDna: true },
    orderBy: { usageCount: "desc" },
    take: 50,
  });

  return NextResponse.json({
    templates: templates.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      usageCount: t.usageCount,
      remixCount: t.remixCount,
      saveCount: t.saveCount,
      toolDnaSlug: t.toolDna.slug,
      parentTemplateId: t.parentTemplateId,
    })),
  });
}

const PublishSchema = z.object({
  appInstanceId: z.string(),
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  visibility: z.enum(["private", "shared", "public"]).default("public"),
});

export async function POST(req: NextRequest) {
  const user = await requireUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const parsed = PublishSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const appInstance = await db.appInstance.findUnique({ where: { id: parsed.data.appInstanceId }, include: { toolDnaVersion: { include: { toolDna: true } } } });
  if (!appInstance || appInstance.creatorId !== user.id) {
    return NextResponse.json({ error: "Only the app's creator can publish it as a template" }, { status: 403 });
  }

  // Structure only: Template links to the ToolDNAVersion, never to the
  // AppInstance's specJson/AppData, so participant/expense/vote data can
  // never leak through the template/discover path (ARCHITECTURE.md §9).
  const template = await db.template.create({
    data: {
      toolDnaId: appInstance.toolDnaVersion.toolDnaId,
      toolDnaVersionId: appInstance.toolDnaVersionId,
      title: parsed.data.title,
      description: parsed.data.description,
      category: appInstance.toolDnaVersion.toolDna.category,
      visibility: parsed.data.visibility,
      creatorId: user.id,
    },
  });

  await db.appInstance.update({ where: { id: appInstance.id }, data: { templateId: template.id } });

  return NextResponse.json({ id: template.id });
}
