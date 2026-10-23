import { describe, expect, it } from "vitest";
import { formatGregorianDisplay, formatUtcIso } from "./index";

describe("calendar stub", () => {
  it("formats gregorian display", () => {
    const d = new Date("2026-10-23T12:00:00.000Z");
    expect(formatGregorianDisplay(d)).toBe("2026-10-23");
    expect(formatUtcIso(d)).toContain("2026-10-23");
  });
});
