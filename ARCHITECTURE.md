# Needly — Architecture

> "What do you need?" → Tool DNA match → Mini-App Specification → Universal Runtime → instant collaborative tool.

This document describes the MVP architecture actually implemented in this repo, and the parts of the original spec that were **deliberately descoped or substituted** for a runnable local MVP, with the reasoning, so a future pass can restore them without re-deriving the tradeoffs.

## 0. Scope decisions (read this first)

The full spec calls for a React Native mobile app, a separate Next.js web app, a separate Node/TS API service, Postgres+pgvector, Redis, S3, and a multi-provider LLM layer. Building and being able to **run** all of that in this environment in one pass is not realistic, so the MVP consolidates:

| Spec asked for | MVP has | Why | Restore path |
|---|---|---|---|
| `apps/mobile` (Expo/RN) | **Built** — real Expo/React Native screens (not a WebView), sharing `packages/core` with the web app; see §13 | Verified via Expo's web target in this session (no simulator available here); native rendering needs Expo Go on a real device | n/a — done. Remaining gap: no push notifications, no offline cache |
| `apps/api` (separate Node service) | Next.js Route Handlers (`apps/web/src/app/api/**`) | One process to install/run/test; still plain Node+TS server code, importable independently | Move `src/server/**` into a standalone Express/Fastify app; it has no Next.js-specific imports |
| Postgres + pgvector | SQLite (Prisma) by default, Postgres via `DATABASE_URL` swap | Zero-install local run; Prisma schema is provider-agnostic except for the `embedding` field which is stored as JSON-encoded `Float[]` and compared in application code (cosine similarity) instead of a DB-side vector index | Switch `provider` in `schema.prisma` to `postgresql`, add `pgvector` extension + a migration that adds a `vector` column, move similarity scoring into SQL |
| Redis cache | In-memory LRU (per-process) | No external service to run | Swap `src/server/cache.ts` implementation for `ioredis`; interface is already isolated |
| S3 object storage | Local filesystem under `apps/web/.uploads` (dev only) + storage interface | No cloud creds available | Implement `S3StorageProvider` against the same `StorageProvider` interface in `src/server/storage.ts` |
| WebSockets / Supabase Realtime | Server-Sent Events (`/api/apps/[id]/events`) + in-process pub/sub | Simplest transport that works over plain HTTP, no extra infra, still gives sub-second live updates | Swap `src/server/realtime.ts` publish/subscribe for a Redis pub/sub-backed WS server; consumers only see `subscribe(appId, cb)` / `publish(appId, event)` |
| Multi-provider LLM (OpenAI/Gemini/Anthropic/local) | `AIProvider` interface with a **rule-based `HeuristicAIProvider`** as default (no API key needed to run/demo) + an `AnthropicAIProvider` used automatically when `ANTHROPIC_API_KEY` is set | The whole point of the Tool DNA system is that most requests are handled by deterministic matching, not an LLM call — the heuristic provider demonstrates and exercises that path end-to-end; the Anthropic provider is a thin drop-in for the "genuinely new structure" case | Add more `AIProvider` implementations under `src/ai/providers/*`; the orchestrator never imports a concrete provider directly |
| Payments / marketplace | Not built (per spec, P2) | Explicitly out of MVP scope | n/a |
| Native push notifications | In-app `Notification` records + unread badge | No mobile client to push to | Wire APNs/FCM in the mobile client when it exists |

Folder-name mapping: the spec's `packages/{ui,mini-app-runtime,tool-dna,ai,validation,types}` are implemented as **source folders inside `apps/web/src/`** (`components/runtime`, `runtime`, `tool-dna`, `ai`, `validation`, `types`) rather than separately-published npm packages, to avoid a multi-package TS build pipeline for an MVP with one consumer. They have no circular dependencies and no Next.js-specific imports (except the `components/*` folder), so lifting each into a real workspace package later is a mechanical move, not a rewrite.

Everything else in this document describes what actually exists.

## 1. System architecture

```
                         ┌─────────────────────────────┐
                         │        Web client            │
                         │  (Next.js App Router, RSC)   │
                         │  mobile-first UI, SSE client │
                         └───────────────┬──────────────┘
                                         │ HTTP + SSE
                         ┌───────────────▼──────────────┐
                         │     Route Handlers (API)      │
                         │  apps/web/src/app/api/**      │
                         │  - auth                       │
                         │  - needs (orchestrator entry) │
                         │  - apps/[id] (+ mutate, join)  │
                         │  - templates (discover/remix)  │
                         │  - events (SSE)                │
                         └───────────────┬──────────────┘
                                         │
        ┌───────────────┬───────────────┼───────────────┬───────────────┐
        ▼               ▼               ▼               ▼               ▼
 ┌────────────┐  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌───────────┐
 │ Orchestrator│  │ Tool DNA    │ │ Runtime      │ │ Realtime     │ │ Storage/  │
 │ (intent →   │  │ registry +  │ │ action       │ │ pub/sub (SSE)│ │ cache     │
 │  decision)  │  │ matcher     │ │ executor     │ │              │ │           │
 └──────┬─────┘  └─────────────┘ └──────┬───────┘ └──────────────┘ └───────────┘
        │                                │
        ▼                                ▼
 ┌────────────┐                  ┌──────────────┐
 │ AIProvider  │                  │  Prisma ORM   │
 │ (heuristic  │                  │  → SQLite/PG  │
 │  / Anthropic)│                 └──────────────┘
 └────────────┘
```

Request lifecycle for "What do you need?":

1. User types free text into the home input → `POST /api/needs`.
2. **Orchestrator** (`src/ai/orchestrator.ts`) classifies the request into one of: `chat_answer | reminder | mini_app | modify_app`. Simple heuristics run first (regex for "remind me", explicit dates/times); only ambiguous cases call the `AIProvider.understandNeed()`.
3. For `mini_app`, the orchestrator calls `AIProvider.selectToolDNA()`, which runs semantic matching (§6) against the Tool DNA registry and returns ranked candidates plus a REUSE/REMIX/COMPOSE/GENERATE decision.
4. `AIProvider.generateSpecification()` produces a **Mini-App Specification** (§5) — either the template's default spec (REUSE), a patched spec (REMIX/COMPOSE), or a novel one validated against the spec schema (GENERATE, heuristic provider refuses this and asks the user to rephrase; the Anthropic provider can attempt it).
5. Spec is validated (zod), persisted as `AppInstance` + `MiniAppSpecification`, a `JoinCode` is minted, an `AuditLog`/`AIRequest` row is written.
6. Response redirects the client to `/apps/[id]`, which the **Universal Runtime** renders purely from the stored spec + live `AppData`.
7. In-app natural-language commands (`POST /api/apps/[id]/command`) go through the same AI layer but produce an **AIMutation** — a structured, allowlisted action (§7) — never raw code or raw DB writes.

## 2. Data model

Implemented in `apps/web/prisma/schema.prisma`. Summary (see file for full field list):

- **User** — email/password (bcrypt), sessions.
- **ToolDNA** — a reusable pattern's identity (slug, name, category, description, `embedding Json`).
- **ToolDNAVersion** — versioned `definitionJson` (entities/fields/screens/actions/etc., §4), `changelog`, `isActive`. `AppInstance` pins a specific version so template edits never retroactively break running apps.
- **Template** — the *publishable* wrapper around a ToolDNA version (visibility: `private|shared|public`), tracks `usageCount`, `remixCount`, `parentTemplateId` (lineage), `creatorId`.
- **TemplateRemix** — edge table recording `sourceTemplateId → resultTemplateId` remix events (redundant with `parentTemplateId` but keeps a full audit trail even across multiple remix hops).
- **AppInstance** — one running mini-app: `toolDnaVersionId`, `title`, `icon`, `specJson` (the resolved Mini-App Specification, §5 — allowed to diverge from the DNA version via user edits), `status`.
- **MiniAppSpecification** — historized specs; every AI/user modification appends a new row (`version` incrementing) instead of overwriting, so "undo" and audit are possible. `AppInstance.specJson` always mirrors the latest row for fast reads.
- **AppMember** — join of `User`(or guest) ↔ `AppInstance`, `role: owner|admin|editor|participant|viewer`.
- **AppData** — generic entity-record store: `appInstanceId`, `entityType` (e.g. `"participant"`, `"expense"`, `"match"`), `data Json`, validated at write-time against the entity's field schema from the Tool DNA definition (never a raw unvalidated blob — see §8).
- **JoinCode** — `code` (short, unambiguous alphabet), `appInstanceId`, `role` it grants, `expiresAt`, `maxUses`.
- **Invitation** — targeted (email) invite, separate from open join codes.
- **AIRequest** — every orchestrator/AI call: input text, decision, provider, tokens/cost if available, latency.
- **AIMutation** — every structured mutation an AI command produced: `action`, `payload`, `status: proposed|applied|rejected`, links to `AIRequest`.
- **AuditLog** — every state-changing action (human or AI), `actorId`, `action`, `targetType/Id`, `before/after` snapshots.
- **Notification** — in-app notifications with `type`, `payload`, `readAt`.

Privacy boundary (§9): `ToolDNA`/`ToolDNAVersion`/`Template` contain **only structure** (field names, screens, rules). `AppInstance`/`AppData`/`AppMember`/`Invitation` contain **user data** and are never read by the template-search or publish path. The publish action (`POST /api/templates/publish`) takes an `AppInstance`, strips it down to its `ToolDNAVersion` definition (which never had user data in the first place — see §4), and creates/links a `Template`; it has no code path that can attach `AppData` rows to a `Template`.

## 3. Tool DNA design

A **Tool DNA** is a reusable software pattern, defined as data (`src/tool-dna/definitions/*.ts`), validated by `src/validation/toolDna.ts` (zod). Shape:

```ts
ToolDnaDefinition {
  slug: string                // "expense-splitter"
  name: string
  category: string            // "finance" | "sports" | "planning" | ...
  description: string
  keywords: string[]          // for lexical fallback matching
  entities: EntityDef[]       // data model
  screens: ScreenDef[]        // which universal components render which entities
  actions: ActionDef[]        // allowlisted mutations (§7)
  computed: ComputedDef[]     // derived values (balances, standings, tallies)
  parameters: ParameterDef[]  // configurable settings (playerCount, splitMode, ...)
  roles: RoleDef[]            // which roles exist / can do what, per-action
  defaultSpec: Partial<MiniAppSpecification>
}

EntityDef {
  name: string                 // "participant"
  label: string
  fields: FieldDef[]           // { key, type: 'text'|'number'|'money'|'date'|'person'|... , required, validation }
  relationships?: { field: string; toEntity: string }[]
}
```

10 MVP Tool DNA definitions ship in `src/tool-dna/definitions/`: `expense-splitter`, `knockout-tournament`, `attendance-tracker`, `shared-checklist`, `voting-board`, `savings-tracker`, `habit-challenge`, `room-reservation`, `group-order`, `trip-planner` (the last is a **composition** DNA — see below).

Composition: `trip-planner` doesn't duplicate logic; its definition literally lists `composesFrom: ["expense-splitter", "attendance-tracker", "voting-board"]` plus a `carpool` entity of its own, and the runtime merges each source DNA's entities/screens/actions into one spec under one app (§1 Trip Hub example). `src/tool-dna/compose.ts` implements the merge (namespacing entity types per module to avoid collisions, e.g. `expense.expense` vs a hypothetical future module also named `expense`).

## 4. Mini-App Specification format

The **spec** is what the runtime actually renders; it's derived from a Tool DNA version plus per-instance configuration/edits. It is never shown to the user as JSON.

```ts
MiniAppSpecification {
  version: number
  toolDnaSlug: string | string[]      // string[] for composed apps
  title: string
  icon: string
  entities: string[]                  // active entity types (subset/superset via edits)
  fields: Record<entityName, FieldDef[]>   // allows per-instance field additions e.g. "add phone number"
  screens: ScreenDef[]                // ordered list of { id, component, entity, title, config }
  features: string[]                  // flags like "knockout_bracket", "receipt_upload"
  settings: Record<string, unknown>   // resolved parameters (playerCount: 16, splitMode: "equal", ...)
  rules: RuleDef[]                    // e.g. { type: "restrict_action", action: "expense.split", condition: "isCarOwner" }
  roles: RoleDef[]
}
```

Natural-language edits (§7) are compiled into **patches** against this structure (add a field, add a screen, add/change a rule, change a setting) — never into free-form code — and each patch is written as a new `MiniAppSpecification` row, so history/undo works and existing `AppData` is untouched (schema-additive changes only; removing a field soft-hides it in the UI rather than deleting stored data).

## 5. Universal Runtime

`src/components/runtime/*` implements the universal component primitives from the spec (`MoneyField`, `PersonPicker`, `ListView`, `TableView`, `CardsView`, `FormView`, `ChecklistView`, `CalendarView`, `Bracket`, `VotingBoard`, `Leaderboard`, `ProgressBar`, `Counter`, `Dashboard`, `MemberList`). `AppRuntime` (`src/components/runtime/AppRuntime.tsx`) takes `(spec, data)` and renders the header (icon/title/avatars/share/AI command button) + a bottom-nav of `spec.screens`, each screen resolved to a component by `component` key via a fixed registry (`src/components/runtime/registry.ts`) — the AI/spec can only reference registry keys that exist, so a bad spec fails validation, not rendering.

## 6. AI architecture

```ts
interface AIProvider {
  understandNeed(text: string, context): Promise<NeedClassification>
  selectToolDNA(text: string, candidates: ToolDnaSummary[]): Promise<ToolDnaMatch[]>
  generateSpecification(text, match, existingSpec?): Promise<MiniAppSpecification>
  mutateApplication(command: string, spec, data, actorRole): Promise<StructuredMutation>
  summarizeApplication(spec, data): Promise<string>
}
```

- **Cost optimization / matching pipeline** (`src/ai/match.ts`): before any LLM call, run (a) exact/lexical keyword overlap against each DNA's `keywords`, (b) cosine similarity over cached bag-of-words "embeddings" (`src/ai/embeddings.ts` — a deterministic hashed bag-of-words vectorizer used as the pgvector stand-in, see §0) for every `ToolDNA.embedding`. If the top match scores above a threshold, **reuse** it with zero AI calls. Mid-confidence → **remix** (LLM adjusts parameters only). Multiple mid-confidence matches covering disjoint entity sets (e.g. expenses + attendance + voting all firing) → **compose**. Nothing above the floor threshold → **generate** (only path that needs a real LLM; the heuristic provider declines and asks a clarifying question instead of fabricating structure).
- `HeuristicAIProvider` (`src/ai/providers/heuristic.ts`) implements the whole interface without any external API — it's the default so the MVP is fully runnable/demoable offline. `AnthropicAIProvider` (`src/ai/providers/anthropic.ts`) is used automatically when `ANTHROPIC_API_KEY` is set (`src/ai/index.ts` picks the provider); it still routes all output through the same zod schemas before anything touches the DB.
- Every AI call is persisted as an `AIRequest`; every resulting change as an `AIMutation`, whether it came from the heuristic or LLM path.

## 7. AI safety / mutation architecture

```
User command (text)
   → AIProvider.mutateApplication()            [LLM or heuristic, sandboxed prompt]
   → StructuredMutation { action, entity?, payload }   [zod-validated against the ACTION'S OWN schema]
   → Allowlist check: action must exist in the app's resolved Tool DNA action list
   → Permission check: actor's AppMember.role must be permitted for that action (RoleDef)
   → Destructive? (delete/settle/archive) → requires an explicit confirm step (mutation stored as
     status:"proposed"; a second call/click flips it to "applied")
   → Executor (src/runtime/actions/*.ts) — plain TS functions, one per allowlisted action, each doing
     its own field-level validation before writing AppData
   → AuditLog row written
```

The LLM never gets DB/table names, SQL, or code-execution ability — only the Tool DNA's declared `actions` (name + payload schema) are shown to it as its output contract, and its output is re-validated against those exact schemas server-side regardless of what it returns. Prompt injection from untrusted content (e.g. text pasted into an expense description) is mitigated by (a) the mutation prompt only ever including the *current command*, not historical free-text `AppData` values, when asking the LLM to choose an action, and (b) treating any instruction-like text found inside `AppData` fields as inert data — the executors only ever read those fields as display strings/numbers, never as instructions.

## 8. Template matching / semantic search

`src/ai/match.ts` + `src/ai/embeddings.ts`. Each `ToolDNA` gets a cached hashed bag-of-words vector over `name + description + keywords`; user text is vectorized the same way; cosine similarity ranks candidates. This is the pgvector stand-in described in §0 — the interface (`embed(text): number[]`, `cosineSimilarity(a,b): number`) is what would move server-side into a Postgres `vector` column + `ORDER BY embedding <=> query` in the Postgres migration path.

## 9. Real-time strategy

`src/server/realtime.ts` exposes `publish(appInstanceId, event)` / `subscribe(appInstanceId, handler)` backed by a module-level `EventEmitter` (per-process; fine for single-instance MVP). `GET /api/apps/[id]/events` is a Server-Sent Events endpoint that subscribes and streams. Every mutation executor calls `publish()` after a successful write. The client (`src/hooks/useAppRealtime.ts`) opens an `EventSource`, applies optimistic local updates immediately on submit, and reconciles on the next server event (last-write-wins per field; full-record replace per event — sufficient for the MVP's collision rate). Multi-instance/production deployment needs the Redis/WS swap noted in §0.

## 10. Security model

- Auth: httpOnly, `SameSite=Lax` signed session cookie (`src/lib/auth.ts`), bcrypt password hashing, per-route `requireUser()`/`requireMember(appId, roles[])` guards — every `/api/apps/[id]/**` route re-derives membership+role from the DB using the session's `userId`, never trusting a client-sent role/appId pairing.
- Guests can join via join code with a server-issued guest `User` row (no password) scoped to `participant` role by default — never elevated by client input.
- Join codes: unambiguous 32-char alphabet (no `0/O/1/I`), rate-limited redemption (`src/lib/rateLimit.ts`, in-memory token bucket per IP+code — swap to Redis for multi-instance), optional `expiresAt`/`maxUses`.
- All mutations re-validate: input schema (zod) → allowlist membership → role permission → object-level ownership (`appInstanceId` scoping on every query) — classic IDOR prevention.
- File uploads (receipts, images): extension+MIME allowlist, size cap, stored under a per-app UUID path, never trusts client-supplied filenames for paths.
- Output encoding: React escapes by default; the one raw-HTML case (none in MVP) would need explicit sanitization — avoided entirely.
- Secrets: `.env` only, `.env.example` documents required keys, never committed.

## 11. Folder structure (actual)

```
packages/core/                 # @needly/core — shared, framework-agnostic domain layer
  src/
    types/                     # shared TS types (MiniAppSpecification, FieldDef, ...)
    validation/                # zod schemas: spec, actions, ai-outputs — the allowlist boundary
    tool-dna/                  # definitions/, registry.ts, buildSpec.ts, compose.ts, remix.ts
    ai/                        # AIProvider interface, heuristic + Anthropic providers, matching, embeddings
    runtime/                   # compute.ts, computeForSpec.ts, patchSpec.ts, permissions.ts, screenProps.ts
apps/web/
  prisma/schema.prisma
  prisma/seed.ts
  src/
    app/                      # Next.js routes (pages + API route handlers)
    components/               # UI, including components/runtime (universal web components)
    ai/orchestrator.ts         # DB-touching: turns a need into a persisted AppInstance
    runtime/                   # DB-touching: executeAction.ts, resolve.ts (name→id lookups)
    server/                   # db client, auth (cookie + bearer token), realtime, storage, cache, rateLimit
    lib/
    hooks/
  tests/                       # vitest
apps/mobile/                   # @needly/mobile — Expo/React Native client (see §13)
  src/
    api/                       # apiFetch, token storage, AuthContext
    navigation/                 # RootNavigator (auth gate), MainTabs
    screens/                   # Login/Register/Home/Create/Discover/MyApps/Profile/Join
    screens/runtime/            # native mini-app runtime + per-component-key screens
    components/                 # Icon, AppHeader, BottomSheet, NeedInput
ARCHITECTURE.md
README.md
.env.example
```

`apps/web`'s `ai/`, `tool-dna/`, `validation/`, `types/`, and most of `runtime/` from earlier in this document now live in `packages/core` — see §13 for why and what stayed behind.

## 12. MVP test coverage

`apps/web/tests/*` (vitest): tool-dna matching thresholds, expense split calculation (equal/uneven/exclusion rules), tournament bracket progression + reseeding on score entry, voting tally + close, join-code generation/redemption + expiry/max-uses, permission checks per role per action, spec patch application (add field/screen preserves existing AppData), AI output schema rejection (malformed/unsupported action, disallowed action for role), prompt-injection string in an AppData field is never executed as an instruction, rate limiter blocks excess join attempts. All of these now import their subject modules from `@needly/core`, so they exercise exactly the code the mobile app also runs.

## 13. Mobile app (Expo / React Native)

The mobile client (`apps/mobile`) is genuine React Native — real `View`/`Text`/`Pressable`/`FlatList` components rendered through React Navigation, not a WebView wrapping the Next.js UI. It was added after the initial MVP once "mobile app" was clarified to mean this specifically (see chat history); the change that made it tractable was extracting everything framework-agnostic into `packages/core` first.

### 13.1 The `@needly/core` split

Everything in the original `apps/web/src/{types,validation,tool-dna,ai,runtime/compute+computeForSpec+patchSpec+permissions}` had zero Next.js/Prisma/DOM imports already (a deliberate property of the original design — see the ARCHITECTURE.md intro's emphasis on keeping the runtime UI-framework-agnostic). Moving it into `packages/core` was therefore a mechanical file move plus import-path rewrite, not a rewrite of logic:

- **Stayed in `apps/web`** (DB/Next-coupled): `ai/orchestrator.ts` (writes `AppInstance`/`AIRequest` rows), `runtime/executeAction.ts` + `runtime/resolve.ts` (write `AppData`, do Prisma name→id lookups), all of `server/*`.
- **Moved to `packages/core`**: Tool DNA definitions/registry/composition/remix, the zod validation schemas, the `AIProvider` interface + `HeuristicAIProvider`/`AnthropicAIProvider`, semantic matching/embeddings, and every pure `runtime/*` compute function (`computeBalances`, `generateBracket`/`advanceBracket`, `tallyVotes`, `computeStreak`, `applySpecPatch`, `checkActionAllowed`).

Both apps declare `"@needly/core": "*"` and resolve it via the npm workspace symlink (`node_modules/@needly/core` → `packages/core`). Neither app pre-compiles it: Next.js transpiles it via `transpilePackages` in `next.config.mjs`, and Metro bundles it as source directly (it's plain TS with no JSX). One consequence worth knowing: `getAIProvider()` now takes the Anthropic API key as an explicit parameter instead of reading `process.env` itself, since `process.env` doesn't mean the same thing in a React Native bundle — each app passes its own platform-appropriate key.

### 13.2 Auth: cookie *and* bearer token

The web app's session was httpOnly-cookie-only, which doesn't work for a mobile client (no shared cookie jar with a browser). `server/auth.ts`'s `getCurrentUser(req?)` now checks an `Authorization: Bearer <token>` header first, falling back to the cookie — both carry the exact same signed token format (`createSessionToken`/`verifySessionToken`), so no second auth system was needed. `/api/auth/login`, `/api/auth/register`, and `/api/join` (guest join) now return `token` in the JSON body in addition to setting the cookie; the mobile app stores it in `expo-secure-store` (falling back to `localStorage` on Expo's web target, where SecureStore isn't available) and sends it back as a bearer header on every request (`apps/mobile/src/api/client.ts`).

### 13.3 Design system parity via NativeWind

The mobile app uses NativeWind so screen code can use the *same* Tailwind utility classes and color/typography tokens as the web app (`bg-primary`, `text-on-surface-variant`, `rounded-2xl`, ...), compiled to real `StyleSheet` objects rather than DOM CSS. `apps/mobile/tailwind.config.js` is a literal copy of the relevant slice of `apps/web/tailwind.config.ts` rather than a cross-package import, because Tailwind/NativeWind's config loader runs outside Metro's bundling pipeline and can't reliably pull in the untranspiled `@needly/core` TS source at that stage — if the palette changes, both files need updating.

### 13.4 What's substituted on mobile (and why)

| Web has | Mobile has | Why |
|---|---|---|
| Server-Sent Events (`/api/apps/[id]/events`) | 4-second polling of `GET /api/apps/[id]` while the screen is focused | React Native has no built-in `EventSource`; polling needs no extra native dependency and is a straightforward swap for a real WS/SSE client later |
| Material Symbols Outlined (web font) | `@expo/vector-icons`' `MaterialIcons` (filled, not outlined) | Outlined Material Symbols isn't bundled with Expo's default icon fonts; `MaterialIcons` covers the same glyph names closely enough (`src/components/Icon.tsx` maps the same snake_case name vocabulary both apps use) |
| Calendar as a chronological agenda list | Same simplification, same reason | Consistent with the web MVP's own descope (see §5) |
| Receipt/photo upload wired to a storage provider but not the form | Not wired either | Same open gap as web |
| httpOnly cookie session | Bearer token in SecureStore | See §13.2 |

### 13.5 Verifying it actually runs

This session verified the mobile screens render correctly using Expo's web target (`expo start --web`, i.e. React Native rendered via `react-native-web` in the same browser tooling used to verify the Next.js app) — this exercises the same component tree, navigation, and API calls as the native build, just not the native renderer itself. Confirming true native behavior (gestures, native navigation transitions, SecureStore, the status bar, etc.) requires Expo Go on a real iOS/Android device, which this environment cannot do — run `npm run dev:mobile` from the repo root, scan the QR code Expo prints with the Expo Go app, and point `EXPO_PUBLIC_API_BASE_URL` (or `app.json`'s `extra.apiBaseUrl`) at your computer's LAN IP rather than `localhost`, since a physical phone can't resolve your dev machine's `localhost`.
