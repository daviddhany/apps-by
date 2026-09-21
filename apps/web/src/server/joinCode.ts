import crypto from "node:crypto";
import { db } from "./db";

// Unambiguous alphabet: no 0/O, 1/I/L to avoid transcription errors when read
// aloud or off a screen.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomCode(): string {
  const part = () =>
    Array.from({ length: 3 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("");
  return `${part()}-${part()}`;
}

export async function createJoinCode(appInstanceId: string, role: string = "participant") {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const exists = await db.joinCode.findUnique({ where: { code } });
    if (!exists) {
      return db.joinCode.create({ data: { code, appInstanceId, role } });
    }
  }
  throw new Error("Failed to generate a unique join code");
}

export interface RedeemResult {
  appInstanceId: string;
  role: string;
  visibility: string;
}

export async function redeemJoinCode(code: string): Promise<RedeemResult> {
  const normalized = code.trim().toUpperCase();
  const joinCode = await db.joinCode.findUnique({ where: { code: normalized }, include: { appInstance: { select: { visibility: true } } } });
  if (!joinCode) throw new Error("Invalid join code");
  if (joinCode.expiresAt && joinCode.expiresAt < new Date()) throw new Error("This join code has expired");
  if (joinCode.maxUses && joinCode.useCount >= joinCode.maxUses) throw new Error("This join code has reached its use limit");

  await db.joinCode.update({ where: { id: joinCode.id }, data: { useCount: { increment: 1 } } });
  return { appInstanceId: joinCode.appInstanceId, role: joinCode.role, visibility: joinCode.appInstance.visibility };
}
