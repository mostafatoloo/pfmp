import { describe, expect, it } from "vitest";
import { nextOccurrence, parseRecurrenceRule } from "./recurrence";

describe("recurrence", () => {
  it("parses rules", () => {
    const rule = parseRecurrenceRule(
      JSON.stringify({ frequency: "daily", startDateUtc: "2026-01-01T00:00:00.000Z", interval: 2 }),
    );
    expect(rule?.frequency).toBe("daily");
    expect(rule?.interval).toBe(2);
  });

  it("computes next daily occurrence", () => {
    const rule = parseRecurrenceRule(
      JSON.stringify({ frequency: "daily", startDateUtc: "2026-01-01T09:00:00.000Z" }),
    )!;
    const next = nextOccurrence(rule, new Date("2026-01-01T09:00:00.000Z"));
    expect(next?.toISOString().startsWith("2026-01-02")).toBe(true);
  });

  it("skips weekends for weekdays frequency", () => {
    const rule = parseRecurrenceRule(
      JSON.stringify({ frequency: "weekdays", startDateUtc: "2026-01-02T09:00:00.000Z" }),
    )!;
    // Friday
    const next = nextOccurrence(rule, new Date("2026-01-02T09:00:00.000Z"));
    expect(next?.getUTCDay()).not.toBe(0);
    expect(next?.getUTCDay()).not.toBe(6);
  });
});
