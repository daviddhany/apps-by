// Composition entry point referenced by ARCHITECTURE.md §3.
// The actual namespacing/merge logic lives in buildSpec.ts alongside the
// single-DNA builder since they share helpers; re-exported here under the
// name the architecture doc uses.
export { buildSpecFromComposition as composeToolDna } from "./buildSpec";
