import { db } from "./db";
import { listToolDna } from "@needly/core";
import { embed } from "@needly/core";

/**
 * Idempotently mirrors the code-defined Tool DNA registry (src/tool-dna/definitions)
 * into the DB as ToolDNA + ToolDNAVersion rows, so AppInstance/Template rows
 * can foreign-key to a specific pinned version (ARCHITECTURE.md §2 versioning).
 * Safe to call on every app start; only writes when a definition actually changed.
 */
export async function ensureToolDnaSeeded() {
  for (const def of listToolDna()) {
    const embedding = embed(`${def.name} ${def.description} ${def.keywords.join(" ")}`);
    const definitionJson = JSON.stringify(def);

    const existing = await db.toolDNA.findUnique({ where: { slug: def.slug }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });

    if (!existing) {
      const created = await db.toolDNA.create({
        data: {
          slug: def.slug,
          name: def.name,
          category: def.category,
          description: def.description,
          keywords: JSON.stringify(def.keywords),
          embedding: JSON.stringify(embedding),
          isComposite: Boolean(def.composesFrom),
          composesFrom: def.composesFrom ? JSON.stringify(def.composesFrom) : null,
        },
      });
      await db.toolDNAVersion.create({
        data: { toolDnaId: created.id, version: 1, definitionJson, changelog: "Initial version" },
      });
      continue;
    }

    const latest = existing.versions[0];
    if (!latest || latest.definitionJson !== definitionJson) {
      await db.toolDNAVersion.create({
        data: { toolDnaId: existing.id, version: (latest?.version ?? 0) + 1, definitionJson, changelog: "Definition updated" },
      });
    }
    await db.toolDNA.update({
      where: { id: existing.id },
      data: { name: def.name, category: def.category, description: def.description, keywords: JSON.stringify(def.keywords), embedding: JSON.stringify(embedding) },
    });
  }
}

export async function getLatestToolDnaVersion(slug: string) {
  const dna = await db.toolDNA.findUnique({ where: { slug }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
  if (!dna || dna.versions.length === 0) throw new Error(`Tool DNA "${slug}" is not seeded yet`);
  return { dna, version: dna.versions[0] };
}
