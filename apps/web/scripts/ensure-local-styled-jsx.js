// Next.js's internal `styled-jsx` calls React.useContext, so it must run
// against the SAME React module instance as the rest of this app (React
// hooks aren't safe across two separate copies of React, even same-version).
// In this workspace, npm sometimes hoists `styled-jsx` to the repo root and
// resolves it there against whatever React the *other* workspace (apps/mobile,
// on React 19) put at the root, while apps/web keeps its own nested React 18
// (the two apps need different major versions, so npm can't hoist a single
// shared copy for both). The mismatch surfaces as `next build` crashing with
// "Cannot read properties of null (reading 'useContext')" while prerendering
// /404 and /500. Giving apps/web its own local copy of styled-jsx makes Node
// resolve it — and the React it calls into — from apps/web's own tree.
// Declaring styled-jsx as a direct dependency here isn't enough on its own:
// npm reuses the already-hoisted root copy instead of duplicating it, since
// nothing about that resolution violates a version range. Runs every
// `npm install` via postinstall so this survives lockfile/reinstall churn.
const fs = require("node:fs");
const path = require("node:path");

const target = path.join(__dirname, "..", "node_modules", "styled-jsx");
if (fs.existsSync(target)) process.exit(0);

const source = path.join(__dirname, "..", "..", "..", "node_modules", "styled-jsx");
if (!fs.existsSync(source)) {
  console.warn("[ensure-local-styled-jsx] No hoisted styled-jsx found at workspace root — skipping.");
  process.exit(0);
}

fs.cpSync(source, target, { recursive: true });
console.log("[ensure-local-styled-jsx] Copied styled-jsx into apps/web/node_modules for React-instance isolation.");
