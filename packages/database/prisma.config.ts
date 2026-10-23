import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prefer already-exported DATABASE_URL (CI / scripts). Else load .env files.
 * `prisma generate` does not need a live DB — fall back to a placeholder URL so
 * unit CI can generate the client without SQL Server.
 */
if (!process.env.DATABASE_URL) {
  loadEnv({ path: resolve(import.meta.dirname, "../../.env") });
  loadEnv({ path: resolve(import.meta.dirname, ".env") });
}

const PLACEHOLDER =
  "sqlserver://localhost:1433;database=pfmp;user=sa;password=Your_strong_Password123;encrypt=true;trustServerCertificate=true";

const databaseUrl = process.env.DATABASE_URL ?? PLACEHOLDER;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
