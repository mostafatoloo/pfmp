import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import type { NextConfig } from "next";

// Monorepo: load repo-root .env when Next runs from apps/web (cwd = apps/web).
loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), "../../.env") });

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@pfmp/auth",
    "@pfmp/database",
    "@pfmp/api-contracts",
    "@pfmp/validation",
    "@pfmp/domain",
    "@pfmp/ui",
    "@pfmp/calendar",
    "@pfmp/export-engine",
    "@pfmp/ai-gateway",
  ],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
