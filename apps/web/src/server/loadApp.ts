import { db } from "./db";
import type { MiniAppSpecification } from "@needly/core";
import { requireMember, type MemberRole } from "./auth";

export async function loadAppForMember(appInstanceId: string, allowedRoles?: MemberRole[], req?: Request) {
  const { user, membership } = await requireMember(appInstanceId, allowedRoles, req);
  const appInstance = await db.appInstance.findUniqueOrThrow({ where: { id: appInstanceId } });
  const spec = JSON.parse(appInstance.specJson) as MiniAppSpecification;
  return { user, membership, appInstance, spec };
}
