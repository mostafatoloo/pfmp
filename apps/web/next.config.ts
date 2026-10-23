import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
