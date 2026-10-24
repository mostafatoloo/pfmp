import { describe, expect, it } from "vitest";
import { canTransitionTaskStatus } from "./index";

describe("task status machine", () => {
  it("allows inbox to planned", () => {
    expect(canTransitionTaskStatus("inbox", "planned")).toBe(true);
  });

  it("blocks completed to inbox", () => {
    expect(canTransitionTaskStatus("completed", "inbox")).toBe(false);
  });
});
