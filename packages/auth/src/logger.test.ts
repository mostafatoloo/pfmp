import { describe, expect, it, vi } from "vitest";
import { authLogger } from "./logger";

describe("authLogger", () => {
  it("redacts secret-like keys", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    authLogger.info("test", { password: "hunter2", userId: "abc" });
    const meta = spy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(meta.password).toBe("[REDACTED]");
    expect(meta.userId).toBe("abc");
    spy.mockRestore();
  });
});
