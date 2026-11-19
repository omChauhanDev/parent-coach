import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CLAUDE.md is the agent guide; don't let `next dev` write AGENTS.md (scaffolded with --no-agents-md).
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
