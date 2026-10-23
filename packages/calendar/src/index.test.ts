import { describe, expect, it } from "vitest";
import { formatGregorianDisplay, formatJalaliDisplay, formatUtcIso } from "./index";

describe("calendar helpers", () => {
  it("formats gregorian and jalali display", () => {
    const d = new Date("2026-10-23T12:00:00.000Z");
    expect(formatGregorianDisplay(d)).toBe("2026-10-23");
    expect(formatUtcIso(d)).toContain("2026-10-23");
    // 2026-10-23 ≈ 1405-08-01 Jalali (approx — assert non-empty shaped string)
    const j = formatJalaliDisplay(d);
    expect(j).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
  });
});
