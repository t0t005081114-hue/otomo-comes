import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16.3+ auto-writes a managed block into AGENTS.md / CLAUDE.md on
  // `next dev`/`next build`. This repo's AGENTS.md is the Codex review entry
  // point (see AGENTS.md itself) and must not be modified by tooling.
  agentRules: false,
};

export default nextConfig;
