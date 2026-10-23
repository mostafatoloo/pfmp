import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../generated/prisma/index";

export type { PrismaClient } from "../generated/prisma/index";
export * from "../generated/prisma/index";

export type MssqlConfig = {
  server: string;
  port: number;
  database: string;
  user: string;
  password: string;
  options?: {
    encrypt?: boolean;
    trustServerCertificate?: boolean;
  };
};

/**
 * Parse Prisma-style SQL Server URL into node-mssql config.
 * Example: sqlserver://localhost:1433;database=pfmp;user=sa;password=...;encrypt=true;trustServerCertificate=true
 */
export function parseSqlServerUrl(url: string): MssqlConfig {
  const trimmed = url.trim().replace(/^"|"$/g, "");
  if (!trimmed.startsWith("sqlserver://")) {
    throw new Error("DATABASE_URL must start with sqlserver://");
  }

  const withoutScheme = trimmed.slice("sqlserver://".length);
  const [hostPart, ...paramParts] = withoutScheme.split(";");
  const params = new Map<string, string>();
  for (const part of paramParts) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim().toLowerCase();
    let value = part.slice(eq + 1).trim();
    if (value.startsWith("{") && value.endsWith("}")) {
      value = value.slice(1, -1);
    }
    params.set(key, value);
  }

  const [server, portRaw] = (hostPart ?? "localhost").split(":");
  const port = Number(portRaw ?? params.get("port") ?? "1433");
  const database = params.get("database") ?? params.get("initial catalog") ?? "master";
  const user = params.get("user") ?? params.get("username") ?? params.get("uid") ?? "sa";
  const password = params.get("password") ?? params.get("pwd") ?? "";
  const encrypt = (params.get("encrypt") ?? "true").toLowerCase() !== "false";
  const trustServerCertificate =
    (params.get("trustservercertificate") ?? "false").toLowerCase() === "true";

  return {
    server: server || "localhost",
    port: Number.isFinite(port) ? port : 1433,
    database,
    user,
    password,
    options: { encrypt, trustServerCertificate },
  };
}

export function createPrismaClient(databaseUrl = process.env.DATABASE_URL): PrismaClient {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const config = parseSqlServerUrl(databaseUrl);
  const adapter = new PrismaMssql({
    server: config.server,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    options: {
      encrypt: config.options?.encrypt ?? true,
      trustServerCertificate: config.options?.trustServerCertificate ?? true,
    },
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { __pfmpPrisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.__pfmpPrisma) {
    globalForPrisma.__pfmpPrisma = createPrismaClient();
  }
  return globalForPrisma.__pfmpPrisma;
}
