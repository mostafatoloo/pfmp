import { describe, expect, it } from "vitest";
import { durationSeconds, dateOnly } from "./index";

describe("validation helpers", () => {
  it("accepts integer seconds", () => {
    expect(durationSeconds.parse(90)).toBe(90);
    expect(() => durationSeconds.parse(1.5)).toThrow();
  });

  it("accepts date-only strings", () => {
    expect(dateOnly.parse("2026-10-23")).toBe("2026-10-23");
    expect(() => dateOnly.parse("23/10/2026")).toThrow();
  });
});
