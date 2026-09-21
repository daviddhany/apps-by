import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";

const SESSION_COOKIE = "needly_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set (see .env.example)");
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionToken(userId: string): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expires}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userId, expiresStr, sig] = decoded.split(".");
    if (!userId || !expiresStr || !sig) return null;
    const expected = sign(`${userId}.${expiresStr}`);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    if (Date.now() > Number(expiresStr)) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/**
 * Resolves the current user from either an httpOnly session cookie (the web
 * client) or an `Authorization: Bearer <token>` header (the Expo/React
 * Native client, which has no cookie jar shared with a browser). Both carry
 * the exact same signed token format — login/register hand the token back in
 * the JSON body specifically for the mobile client to store in SecureStore.
 * `req` is optional so existing call sites (Server Components, cookie-only
 * routes) don't need to change; pass it in any Route Handler that a mobile
 * client might call.
 */
export async function getCurrentUser(req?: Request) {
  const bearer = req?.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  let token = bearer;

  if (!token) {
    const jar = await cookies();
    token = jar.get(SESSION_COOKIE)?.value;
  }

  if (!token) return null;
  const userId = verifySessionToken(token);
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

export async function requireUser(req?: Request) {
  const user = await getCurrentUser(req);
  if (!user) {
    const err = new Error("Not authenticated") as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  return user;
}

export type MemberRole = "owner" | "admin" | "editor" | "participant" | "viewer";

/**
 * Re-derives membership + role from the DB for the given app instance and
 * currently authenticated user. Never trusts a client-sent role or appId
 * pairing (ARCHITECTURE.md §10 — IDOR prevention).
 */
export async function requireMember(appInstanceId: string, allowedRoles?: MemberRole[], req?: Request) {
  const user = await requireUser(req);
  const membership = await db.appMember.findUnique({
    where: { appInstanceId_userId: { appInstanceId, userId: user.id } },
  });
  if (!membership) {
    const err = new Error("Not a member of this app") as Error & { status?: number };
    err.status = 403;
    throw err;
  }
  if (allowedRoles && !allowedRoles.includes(membership.role as MemberRole)) {
    const err = new Error("Insufficient role") as Error & { status?: number };
    err.status = 403;
    throw err;
  }
  return { user, membership };
}
