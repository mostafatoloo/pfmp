import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

// Prefer already-exported DATABASE_URL (CI / scripts). Else load .env files.
if (!process.env.DATABASE_URL) {
  loadEnv({ path: resolve(import.meta.dirname, "../../.env") });
  loadEnv({ path: resolve(import.meta.dirname, ".env") });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set (check .env / .env.example)");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
