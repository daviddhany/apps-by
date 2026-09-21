import type {
  ActionDef,
  ComputedDef,
  EntityDef,
  FieldDef,
  MiniAppSpecification,
  RoleDef,
  RuleDef,
  ScreenDef,
  ToolDnaDefinition,
} from "../types";
import { namespaceFor } from "./namespaces";
import { getToolDna } from "./registry";

interface NamespacedDefinition {
  namespace: string;
  entities: EntityDef[];
  screens: ScreenDef[];
  actions: ActionDef[];
  computed: ComputedDef[];
  roles: RoleDef[];
  settings: Record<string, unknown>;
}

function namespaceDefinition(def: ToolDnaDefinition, settingsOverride?: Record<string, unknown>): NamespacedDefinition {
  const ns = namespaceFor(def.slug);
  const entities = def.entities.map((e) => ({ ...e, name: `${ns}.${e.name}` }));
  const screens = def.screens.map((s) => ({
    ...s,
    id: `${ns}.${s.id}`,
    entity: s.entity ? `${ns}.${s.entity}` : undefined,
  }));
  const actions = def.actions.map((a) => ({ ...a, entity: a.entity ? `${ns}.${a.entity}` : undefined }));
  const computed = def.computed.map((c) => ({ ...c, key: `${ns}.${c.key}`, dependsOn: c.dependsOn.map((d) => `${ns}.${d}`) }));
  return {
    namespace: ns,
    entities,
    screens,
    actions,
    computed,
    roles: def.roles,
    settings: { ...def.defaultSettings, ...settingsOverride },
  };
}

function fieldsMap(entities: EntityDef[]): Record<string, FieldDef[]> {
  const out: Record<string, FieldDef[]> = {};
  for (const e of entities) out[e.name] = e.fields;
  return out;
}

function mergeRoles(all: RoleDef[][]): RoleDef[] {
  const merged = new Map<string, RoleDef>();
  for (const roles of all) {
    for (const r of roles) {
      const existing = merged.get(r.role);
      merged.set(r.role, {
        role: r.role,
        canManageMembers: existing?.canManageMembers || r.canManageMembers,
        canEditSpec: existing?.canEditSpec || r.canEditSpec,
      });
    }
  }
  return [...merged.values()];
}

/**
 * Builds a MiniAppSpecification from a single (non-composite) Tool DNA
 * definition. Used for the REUSE/REMIX decisions.
 */
export function buildSpecFromSingleDna(
  def: ToolDnaDefinition,
  opts: { title: string; icon?: string; settings?: Record<string, unknown>; rules?: RuleDef[] }
): MiniAppSpecification {
  if (def.composesFrom) {
    throw new Error(`${def.slug} is a composite Tool DNA; use buildSpecFromComposition instead`);
  }
  const nd = namespaceDefinition(def, opts.settings);
  return {
    version: 1,
    toolDnaSlug: [def.slug],
    title: opts.title,
    icon: opts.icon ?? "sparkles",
    entities: nd.entities.map((e) => e.name),
    fields: fieldsMap(nd.entities),
    screens: nd.screens,
    features: [],
    settings: nd.settings,
    rules: opts.rules ?? [],
    roles: nd.roles,
    actions: nd.actions,
    computed: nd.computed,
  };
}

/**
 * Builds a MiniAppSpecification for a composite Tool DNA (e.g. trip-planner):
 * merges every DNA it composesFrom plus its own entities/screens/actions,
 * each namespaced so nothing collides. See ARCHITECTURE.md §3.
 */
export function buildSpecFromComposition(
  def: ToolDnaDefinition,
  opts: { title: string; icon?: string; settings?: Record<string, unknown>; rules?: RuleDef[] }
): MiniAppSpecification {
  const sourceSlugs = def.composesFrom ?? [];
  const sources = sourceSlugs.map((slug) => {
    const sourceDef = getToolDna(slug);
    if (!sourceDef) throw new Error(`Unknown composed Tool DNA "${slug}"`);
    return namespaceDefinition(sourceDef);
  });
  const own = namespaceDefinition(def, opts.settings);
  const all = [...sources, own];

  const entities = all.flatMap((d) => d.entities);
  const screens = all.flatMap((d) => d.screens);
  const actions = all.flatMap((d) => d.actions);
  const computed = all.flatMap((d) => d.computed);
  const settings = Object.assign({}, ...all.map((d) => d.settings));

  return {
    version: 1,
    toolDnaSlug: [def.slug, ...sourceSlugs],
    title: opts.title,
    icon: opts.icon ?? "sparkles",
    entities: entities.map((e) => e.name),
    fields: fieldsMap(entities),
    screens,
    features: ["composed"],
    settings,
    rules: opts.rules ?? [],
    roles: mergeRoles(all.map((d) => d.roles)),
    actions,
    computed,
  };
}

/**
 * Merges an additional Tool DNA module into an already-running app's spec
 * (e.g. "add a page where we vote" onto an existing Expense Splitter app).
 * Additive only: never removes or renames anything already in `spec`.
 */
export function mergeToolIntoSpec(spec: MiniAppSpecification, slug: string): MiniAppSpecification {
  const def = getToolDna(slug);
  if (!def || def.composesFrom) throw new Error(`"${slug}" cannot be merged in`);
  if (spec.toolDnaSlug.includes(slug)) return spec; // already composed in

  const nd = namespaceDefinition(def);
  return {
    ...spec,
    version: spec.version + 1,
    toolDnaSlug: [...spec.toolDnaSlug, slug],
    entities: [...spec.entities, ...nd.entities.map((e) => e.name)],
    fields: { ...spec.fields, ...fieldsMap(nd.entities) },
    screens: [...spec.screens, ...nd.screens],
    features: [...spec.features, "composed"],
    settings: { ...spec.settings, ...nd.settings },
    roles: mergeRoles([spec.roles, nd.roles]),
    actions: [...spec.actions, ...nd.actions],
    computed: [...spec.computed, ...nd.computed],
  };
}

export function buildSpec(
  def: ToolDnaDefinition,
  opts: { title: string; icon?: string; settings?: Record<string, unknown>; rules?: RuleDef[] }
): MiniAppSpecification {
  return def.composesFrom ? buildSpecFromComposition(def, opts) : buildSpecFromSingleDna(def, opts);
}
