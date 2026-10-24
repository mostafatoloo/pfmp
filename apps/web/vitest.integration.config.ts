import { defineConfig } from "vitest/config";
import "dotenv/config";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    testTimeout: 60_000,
    fileParallelism: false,
  },
});
