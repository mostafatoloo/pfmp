import { describe, expect, it, beforeEach } from "vitest";
import { getEnv, resetEnvCache } from "./env";

describe("getEnv", () => {
  beforeEach(() => resetEnvCache());

  it("fails fast when DATABASE_URL missing", () => {
    expect(() =>
      getEnv({
        BETTER_AUTH_SECRET: "x".repeat(32),
      } as NodeJS.ProcessEnv),
    ).toThrow(/DATABASE_URL/);
  });

  it("parses valid env", () => {
    const env = getEnv({
      DATABASE_URL: "sqlserver://localhost:1433;database=pfmp;user=sa;password=x",
      BETTER_AUTH_SECRET: "x".repeat(32),
      APP_URL: "http://localhost:3000",
      AI_ENABLED: "false",
      PASSKEY_ENABLED: "true",
    } as NodeJS.ProcessEnv);
    expect(env.AI_ENABLED).toBe(false);
    expect(env.PASSKEY_ENABLED).toBe(true);
  });
});
