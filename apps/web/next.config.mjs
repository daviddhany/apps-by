/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @needly/core ships as plain TS source (no build step) — Next needs to
  // run it through its own compiler rather than treating it as pre-built.
  transpilePackages: ["@needly/core"],
};

export default nextConfig;
