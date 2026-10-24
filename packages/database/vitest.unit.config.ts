import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "database-unit",
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
