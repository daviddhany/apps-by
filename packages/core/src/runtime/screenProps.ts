import type { ActionDef, FieldDef, MiniAppSpecification, ScreenDef } from "../types";

export interface RuntimeRecord {
  id: string;
  entityType: string;
  data: Record<string, unknown>;
}

export interface RuntimeMember {
  id: string;
  name: string;
  role: string;
  isGuest?: boolean;
}

export interface MutationInput {
  action: string;
  entity?: string;
  payload: Record<string, unknown>;
}

export interface ScreenComponentProps {
  spec: MiniAppSpecification;
  screen: ScreenDef;
  records: RuntimeRecord[]; // records matching screen.entity
  allRecords: RuntimeRecord[]; // every record in the app (for cross-entity lookups)
  fields: FieldDef[]; // fields for screen.entity
  actions: ActionDef[]; // actions available for screen.entity
  computed: Record<string, unknown>;
  role: string;
  members: RuntimeMember[];
  currentUserId: string;
  busy: boolean;
  onMutate: (mutation: MutationInput) => Promise<unknown>;
}

export function canDo(actions: ActionDef[], name: string, role: string): boolean {
  const def = actions.find((a) => a.name === name);
  return Boolean(def && def.allowedRoles.includes(role as never));
}

export function labelFor(records: RuntimeRecord[], id: string | undefined, fallback = "—"): string {
  if (!id) return fallback;
  const record = records.find((r) => r.id === id);
  const name = record?.data?.name as string | undefined;
  return name ?? fallback;
}
