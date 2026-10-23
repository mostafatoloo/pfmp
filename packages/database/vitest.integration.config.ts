import { defineConfig } from "vitest/config";
import "dotenv/config";

export default defineConfig({
  test: {
    name: "database-integration",
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    testTimeout: 60_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
});
