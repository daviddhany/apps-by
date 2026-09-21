// Public API of @needly/core — the framework-agnostic domain layer shared by
// apps/web (Next.js) and apps/mobile (Expo/React Native). Everything here is
// plain TypeScript with zero DOM/Node/React Native/Next.js/Prisma
// dependencies (Anthropic's SDK is the one exception, and it's isomorphic).
// See ARCHITECTURE.md §0 / the mobile app addendum for the split rationale.

export * from "./types";
export * from "./validation/schema";

export * from "./tool-dna/registry";
export * from "./tool-dna/buildSpec";
export * from "./tool-dna/compose";
export * from "./tool-dna/namespaces";
export * from "./tool-dna/remix";
export * from "./tool-dna/dailyQuestions";

export * from "./ai/provider";
export * from "./ai/match";
export * from "./ai/embeddings";
export * from "./ai/index";
export { HeuristicAIProvider } from "./ai/providers/heuristic";
export { AnthropicAIProvider } from "./ai/providers/anthropic";

export * from "./runtime/screenProps";
export * from "./runtime/compute";
export * from "./runtime/computeForSpec";
export * from "./runtime/patchSpec";
export * from "./runtime/permissions";

export * from "./primitives/expression";
export * from "./primitives/actionEngine";
export * from "./primitives/computeEngine";
