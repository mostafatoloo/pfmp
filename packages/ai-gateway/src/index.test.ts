import { describe, expect, it } from "vitest";
import { createAiGateway } from "./index";

describe("ai gateway stub", () => {
  it("is disabled by default", () => {
    expect(createAiGateway({}).isEnabled()).toBe(false);
  });
});
