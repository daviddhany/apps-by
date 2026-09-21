import { describe, expect, it, beforeAll } from "vitest";
import { db } from "@/server/db";
import { createJoinCode, redeemJoinCode } from "@/server/joinCode";
import { ensureToolDnaSeeded, getLatestToolDnaVersion } from "@/server/seedToolDna";

// Integration test — needs a migrated DB (`npm run db:push` first, see README).

describe("join codes", () => {
  let appInstanceId: string;

  beforeAll(async () => {
    await ensureToolDnaSeeded();
    const { version } = await getLatestToolDnaVersion("shared-checklist");
    const user = await db.user.create({ data: { name: "Test Owner", email: `owner-${Date.now()}@test.local`, passwordHash: "x" } });
    const app = await db.appInstance.create({
      data: { title: "Test App", toolDnaVersionId: version.id, specJson: "{}", creatorId: user.id },
    });
    appInstanceId = app.id;
  });

  it("generates a code in the unambiguous XXX-XXX format", async () => {
    const joinCode = await createJoinCode(appInstanceId);
    expect(joinCode.code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{3}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{3}$/);
  });

  it("redeems a valid code and is case/whitespace tolerant", async () => {
    const joinCode = await createJoinCode(appInstanceId);
    const result = await redeemJoinCode(`  ${joinCode.code.toLowerCase()}  `);
    expect(result.appInstanceId).toBe(appInstanceId);
  });

  it("rejects an invalid code", async () => {
    await expect(redeemJoinCode("ZZZ-ZZZ")).rejects.toThrow();
  });

  it("enforces maxUses", async () => {
    const joinCode = await db.joinCode.create({ data: { code: `LIM-${Date.now() % 100000}`, appInstanceId, maxUses: 1 } });
    await redeemJoinCode(joinCode.code);
    await expect(redeemJoinCode(joinCode.code)).rejects.toThrow(/use limit/);
  });

  it("enforces expiresAt", async () => {
    const joinCode = await db.joinCode.create({ data: { code: `EXP-${Date.now() % 100000}`, appInstanceId, expiresAt: new Date(Date.now() - 1000) } });
    await expect(redeemJoinCode(joinCode.code)).rejects.toThrow(/expired/);
  });
});
