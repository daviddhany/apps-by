const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("node:path");

// metro-config's exclusionList helper isn't exposed as a stable export in
// this Metro version — a plain RegExp combinator does the same job.
function exclusionList(patterns) {
  return new RegExp(`(${patterns.map((p) => p.source).join("|")})`);
}

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo support: Metro needs to see packages/core (hence watching the
// workspace root) and resolve node_modules from both the app and the
// workspace root (npm workspaces hoist most packages there). It does NOT
// need apps/web at all — that's a separate Next.js app with its own huge
// node_modules/.next, and letting Metro crawl those made startup extremely
// slow (minutes) on Windows, so they're excluded explicitly.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.blockList = exclusionList([
  /apps[\\/]web[\\/].*/,
  /\.git[\\/].*/,
  /_design_ref[\\/].*/,
]);
// @needly/core ships untranspiled TypeScript; let Metro pull it in as source.
config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, { input: "./global.css" });
