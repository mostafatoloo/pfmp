import { describe, expect, it } from "vitest";
import { apiError } from "@pfmp/api-contracts";

/**
 * Contract-level security smoke (no live server required).
 * Full HTTP session e2e lives under Playwright.
 */
describe("Stage 5 HTTP security contracts", () => {
  it("unauthorized envelope shape", () => {
    const body = apiError("UNAUTHORIZED", "Authentication required");
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("AI unavailable maps to documented code", () => {
    const body = apiError("AI_UNAVAILABLE", "AI schedule proposals are disabled");
    expect(body.error.code).toBe("AI_UNAVAILABLE");
  });

  it("workspace mismatch code exists for forged workspace ids", () => {
    const body = apiError("WORKSPACE_MISMATCH", "Workspace mismatch");
    expect(body.error.code).toBe("WORKSPACE_MISMATCH");
  });
});
