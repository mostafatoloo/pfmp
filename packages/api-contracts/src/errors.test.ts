import { describe, expect, it } from "vitest";
import { apiError } from "./errors";

describe("apiError", () => {
  it("builds envelope", () => {
    const body = apiError("UNAUTHORIZED", "Authentication required");
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
