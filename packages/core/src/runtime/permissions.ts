import type { ActionName, MiniAppSpecification, Role } from "../types";

export class PermissionError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

/**
 * Pure allowlist + role + rule check, extracted from executeAction so it's
 * directly unit-testable without a DB (tests/permissions.test.ts). Throws
 * PermissionError/plain Error on rejection; returns the matched ActionDef.
 */
export function checkActionAllowed(spec: MiniAppSpecification, action: ActionName, entity: string | undefined, role: Role) {
  const actionDef = spec.actions.find((a) => a.name === action && (!a.entity || a.entity === entity));
  if (!actionDef) {
    throw new PermissionError(`Action "${action}" on "${entity}" is not allowed in this app`, 400);
  }
  if (!actionDef.allowedRoles.includes(role)) {
    throw new PermissionError(`Role "${role}" is not permitted to perform "${action}"`, 403);
  }
  for (const rule of spec.rules) {
    if (rule.type === "restrict_action" && rule.action === action) {
      const allowedRoles = Array.isArray(rule.value) ? (rule.value as Role[]) : [];
      if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        throw new PermissionError(`This app restricts "${action}" to: ${allowedRoles.join(", ")}`, 403);
      }
    }
  }
  return actionDef;
}
