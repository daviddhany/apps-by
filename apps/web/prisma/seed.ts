import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ensureToolDnaSeeded } from "../src/server/seedToolDna";
import { buildSpec } from "@needly/core";
import { getToolDna } from "@needly/core";
import { createJoinCode } from "../src/server/joinCode";

const db = new PrismaClient();

async function main() {
  console.log("Seeding Tool DNA registry…");
  await ensureToolDnaSeeded();

  const email = "demo@needly.app";
  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    user = await db.user.create({
      data: { name: "Demo User", email, passwordHash: await bcrypt.hash("password123", 10) },
    });
    console.log(`Created demo user: ${email} / password123`);
  }

  const existingDemoApp = await db.appInstance.findFirst({ where: { creatorId: user.id, title: "Dahab Trip Expenses" } });
  if (!existingDemoApp) {
    const def = getToolDna("expense-splitter")!;
    const spec = buildSpec(def, { title: "Dahab Trip Expenses" });
    const { version } = await getLatestVersion("expense-splitter");

    const appInstance = await db.appInstance.create({
      data: { title: spec.title, icon: spec.icon, toolDnaVersionId: version.id, specJson: JSON.stringify(spec), creatorId: user.id },
    });
    await db.miniAppSpecification.create({ data: { appInstanceId: appInstance.id, version: spec.version, specJson: JSON.stringify(spec), changeSummary: "Seeded demo app" } });
    await db.appMember.create({ data: { appInstanceId: appInstance.id, userId: user.id, role: "owner" } });
    const joinCode = await createJoinCode(appInstance.id);

    const names = ["Ahmed", "Mina", "Sara", "Youssef", "Laila", "Omar", "Nour", "Karim"];
    const participantIds: string[] = [];
    for (const name of names) {
      const p = await db.appData.create({ data: { appInstanceId: appInstance.id, entityType: "expense.participant", data: JSON.stringify({ name }) } });
      participantIds.push(p.id);
    }
    await db.appData.create({
      data: {
        appInstanceId: appInstance.id,
        entityType: "expense.expense",
        data: JSON.stringify({ description: "Snorkeling trip", amount: 800, paidByParticipantId: participantIds[0], splitAmong: participantIds, splitMode: "equal" }),
      },
    });
    await db.appData.create({
      data: {
        appInstanceId: appInstance.id,
        entityType: "expense.expense",
        data: JSON.stringify({ description: "Beach house", amount: 3200, paidByParticipantId: participantIds[1], splitAmong: participantIds, splitMode: "equal" }),
      },
    });

    console.log(`Seeded demo app "Dahab Trip Expenses" with join code ${joinCode.code}`);
  }

  // A published, public template so /discover isn't empty on first run.
  const publicTemplateExists = await db.template.findFirst({ where: { visibility: "public", title: "Knockout Tournament" } });
  if (!publicTemplateExists) {
    const { dna, version } = await getLatestVersion("knockout-tournament");
    await db.template.create({
      data: {
        toolDnaId: dna.id,
        toolDnaVersionId: version.id,
        title: "Knockout Tournament",
        description: "Run a bracket for FIFA/FC, padel, ping pong — anything single-elimination.",
        category: dna.category,
        visibility: "public",
        usageCount: 12,
        remixCount: 2,
      },
    });
    console.log("Seeded a public 'Knockout Tournament' template for Discover.");
  }

  async function getLatestVersion(slug: string) {
    const dna = await db.toolDNA.findUniqueOrThrow({ where: { slug }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
    return { dna, version: dna.versions[0] };
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
