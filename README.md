# Apps By — "What do you need?"

A consumer platform that turns a described need ("we're 8 friends splitting a trip") into an
instant, collaborative mini-app, built on a reusable Tool DNA + Universal Runtime instead of
generating bespoke code per request. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design
and, importantly, the **§0 Scope decisions** table explaining what was substituted to make this an
MVP that actually runs locally (SQLite instead of Postgres+pgvector, SSE instead of WebSockets, a
deterministic rule-based AI provider by default instead of requiring an API key, etc.).

## Requirements

- Node.js 20+ and npm 10+
- No external services required for local dev (SQLite file DB, in-process realtime/cache, local
  filesystem storage — see ARCHITECTURE.md §0 for the production swap paths)

## Setup

```bash
npm install
cp .env.example apps/web/.env
```

Edit `apps/web/.env` and set `SESSION_SECRET` to a random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Leave `ANTHROPIC_API_KEY` unset to run fully offline on the deterministic `HeuristicAIProvider`
(this is the default and is what the product test below exercises). Set it to route AI-generated
mini-app structures and free-form natural-language commands through Claude instead.

Create the local database and seed it:

```bash
npm run db:push -w apps/web
npm run db:seed -w apps/web
```

Seeding creates a demo account (`demo@needly.app` / `password123`) with a pre-populated expense
splitter and publishes one public template to Discover.

## Run

```bash
npm run dev
```

Open http://localhost:3000, sign in with the demo account (or register a new one), and try:

> "We are 8 friends traveling together and want to split all expenses."

You'll land in a working expense splitter in well under a second — add participants, add an
expense, tap the 🔗 button to get a join code, and open `/join` in another browser/incognito
window to join and watch balances update live.

## Run the mobile app (Expo / React Native)

The mobile client is real React Native (not a WebView) sharing its business logic with the web app
via `packages/core`. It talks to the same backend, so the web server above must be running too.

```bash
npm run dev:mobile
```

This starts the Expo dev server and prints a QR code. Scan it with the **Expo Go** app on your
phone (iOS or Android — install it from the App Store / Play Store first) to run it natively.

Your phone can't resolve your computer's `localhost`, so point it at your machine's LAN IP instead:
edit `apiBaseUrl` in `apps/mobile/app.json`, or set `EXPO_PUBLIC_API_BASE_URL` before starting, e.g.

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:3000 npm run dev:mobile
```

(Find your LAN IP with `ipconfig` on Windows or `ifconfig`/`ip a` on macOS/Linux — both your phone
and computer need to be on the same Wi-Fi network.)

To preview it in a browser instead of on a phone (useful for a quick check, though it renders via
`react-native-web` rather than Expo Go's native renderer):

```bash
npm run web -w apps/mobile
```

See [ARCHITECTURE.md §13](./ARCHITECTURE.md#13-mobile-app-expo--react-native) for how the
web/mobile code-sharing and auth work.

## Test

```bash
npm run db:push -w apps/web   # tests/joinCode.test.ts needs a migrated DB
npm test
```

36 tests cover: Tool DNA semantic matching, expense-splitting math (equal/exact/exclusion +
settlement minimization), tournament bracket generation/advancement/standings, spec patching
(additive field/screen/rule changes), permission/allowlist enforcement per role, join code
generation/redemption/expiry/max-uses, AI output schema rejection, prompt-injection resistance at
the mutation-command boundary, Tool DNA composition (Trip Hub), and rate limiting.

## Project layout

```
packages/core/       @needly/core — shared domain layer (types, Tool DNA, AI, validation, compute)
apps/web/            Next.js app — web client + API route handlers (the "backend")
  prisma/            Schema + seed script
  src/app/           Pages and API routes
  src/ai/            Orchestrator (DB-touching; everything else moved to packages/core)
  src/runtime/       DB-touching action executor + name/id resolver
  src/server/        DB client, auth (cookie + bearer token), realtime (SSE), storage, cache, join codes
  src/components/    UI, including components/runtime (the Universal Runtime component registry)
  tests/             vitest — imports from @needly/core, same code the mobile app runs
apps/mobile/         Expo/React Native app — native screens, not a WebView
  src/api/           apiFetch, token storage, AuthContext
  src/navigation/    Auth-gated stack + bottom tabs
  src/screens/       Native screens, including screens/runtime (the mobile component registry)
ARCHITECTURE.md      Full design doc + explicit scope-reduction rationale (§13: the mobile app)
```

## The 10 MVP Tool DNA templates

Expense Splitter, Knockout Tournament, Attendance Tracker, Shared Checklist, Voting Board,
Savings/Payment Tracker, Habit Challenge, Room Reservation, Group Order, and Trip Planner (a
composition of Expense Splitter + Attendance Tracker + Voting Board — the "Trip Hub" product test).

## Known MVP limitations

See ARCHITECTURE.md §0 (and §13 for mobile specifically) for the full list and rationale. Notably:
receipt/photo upload has a storage provider but isn't wired into the add-item form yet on either
platform, the calendar screens are a chronological agenda list rather than a month grid, the mobile
app polls for updates instead of using real-time push (no `EventSource` in React Native), and this
session verified the mobile screens via Expo's web target — true native behavior on a phone needs
you to check it with Expo Go.
