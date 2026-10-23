import { describe, expect, it } from "vitest";
import { parseSqlServerUrl } from "./client";
import { durationSecondsBetween } from "./conventions";

describe("parseSqlServerUrl", () => {
  it("parses JDBC-style SQL Server URLs", () => {
    const cfg = parseSqlServerUrl(
      'sqlserver://localhost:1433;database=pfmp;user=sa;password=Your_strong_Password123;encrypt=true;trustServerCertificate=true',
    );
    expect(cfg.server).toBe("localhost");
    expect(cfg.port).toBe(1433);
    expect(cfg.database).toBe("pfmp");
    expect(cfg.user).toBe("sa");
    expect(cfg.password).toBe("Your_strong_Password123");
    expect(cfg.options?.encrypt).toBe(true);
    expect(cfg.options?.trustServerCertificate).toBe(true);
  });
});

describe("durationSecondsBetween", () => {
  it("returns integer seconds", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    const end = new Date("2026-01-01T00:01:30.500Z");
    expect(durationSecondsBetween(start, end)).toBe(90);
  });
});
