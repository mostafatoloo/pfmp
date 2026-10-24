import { describe, expect, it } from "vitest";
import {
  parseRecurrenceRule,
  computeNextOccurrence,
  type RecurrenceRule,
} from "./recurrence-service";

describe("parseRecurrenceRule", () => {
  it("parses a valid daily rule", () => {
    const rule = parseRecurrenceRule('{"frequency":"daily"}');
    expect(rule).toEqual({ frequency: "daily" });
  });

  it("parses a weekly rule with daysOfWeek", () => {
    const rule = parseRecurrenceRule(
      '{"frequency":"weekly","daysOfWeek":[1,3,5],"interval":2}',
    );
    expect(rule).toEqual({ frequency: "weekly", daysOfWeek: [1, 3, 5], interval: 2 });
  });

  it("parses a monthly rule with dayOfMonth", () => {
    const rule = parseRecurrenceRule('{"frequency":"monthly","dayOfMonth":15}');
    expect(rule).toEqual({ frequency: "monthly", dayOfMonth: 15 });
  });

  it("parses a weekdays rule", () => {
    const rule = parseRecurrenceRule('{"frequency":"weekdays"}');
    expect(rule).toEqual({ frequency: "weekdays" });
  });

  it("parses endAfterOccurrences", () => {
    const rule = parseRecurrenceRule('{"frequency":"daily","endAfterOccurrences":5}');
    expect(rule.endAfterOccurrences).toBe(5);
  });

  it("parses endByDate", () => {
    const rule = parseRecurrenceRule('{"frequency":"daily","endByDate":"2027-01-01"}');
    expect(rule.endByDate).toBe("2027-01-01");
  });

  it("rejects invalid JSON", () => {
    expect(() => parseRecurrenceRule("not json")).toThrow("Invalid JSON");
  });

  it("rejects non-object", () => {
    expect(() => parseRecurrenceRule('"just a string"')).toThrow("must be an object");
  });

  it("rejects missing frequency", () => {
    expect(() => parseRecurrenceRule('{"interval":1}')).toThrow("Invalid frequency");
  });

  it("rejects unknown frequency", () => {
    expect(() => parseRecurrenceRule('{"frequency":"hourly"}')).toThrow("Invalid frequency");
  });

  it("rejects non-positive interval", () => {
    expect(() => parseRecurrenceRule('{"frequency":"daily","interval":0}')).toThrow(
      "positive integer",
    );
  });

  it("rejects float interval", () => {
    expect(() => parseRecurrenceRule('{"frequency":"daily","interval":1.5}')).toThrow(
      "positive integer",
    );
  });

  it("rejects invalid daysOfWeek values", () => {
    expect(() =>
      parseRecurrenceRule('{"frequency":"weekly","daysOfWeek":[7]}'),
    ).toThrow("0-6");
  });

  it("rejects dayOfMonth out of range", () => {
    expect(() =>
      parseRecurrenceRule('{"frequency":"monthly","dayOfMonth":32}'),
    ).toThrow("1-31");
  });

  it("rejects non-integer endAfterOccurrences", () => {
    expect(() =>
      parseRecurrenceRule('{"frequency":"daily","endAfterOccurrences":1.5}'),
    ).toThrow("positive integer");
  });

  it("rejects invalid endByDate", () => {
    expect(() =>
      parseRecurrenceRule('{"frequency":"daily","endByDate":"not-a-date"}'),
    ).toThrow("valid ISO date");
  });
});

describe("computeNextOccurrence", () => {
  it("advances daily by 1 day", () => {
    const rule: RecurrenceRule = { frequency: "daily" };
    const from = new Date("2026-10-23T10:00:00Z");
    const next = computeNextOccurrence(rule, from);
    expect(next.toISOString()).toBe("2026-10-24T10:00:00.000Z");
  });

  it("advances daily by interval days", () => {
    const rule: RecurrenceRule = { frequency: "daily", interval: 3 };
    const from = new Date("2026-10-23T10:00:00Z");
    const next = computeNextOccurrence(rule, from);
    expect(next.toISOString()).toBe("2026-10-26T10:00:00.000Z");
  });

  it("advances weekly by 7 days", () => {
    const rule: RecurrenceRule = { frequency: "weekly" };
    const from = new Date("2026-10-23T10:00:00Z");
    const next = computeNextOccurrence(rule, from);
    expect(next.toISOString()).toBe("2026-10-30T10:00:00.000Z");
  });

  it("advances weekly with daysOfWeek to next matching day", () => {
    const rule: RecurrenceRule = { frequency: "weekly", daysOfWeek: [1, 3, 5] };
    // 2026-10-23 is a Friday (day 5)
    const from = new Date("2026-10-23T10:00:00Z");
    const next = computeNextOccurrence(rule, from);
    // Next Mon (day 1) of the following week
    expect(next.toISOString()).toBe("2026-10-26T10:00:00.000Z");
  });

  it("advances weekly with daysOfWeek within same week", () => {
    const rule: RecurrenceRule = { frequency: "weekly", daysOfWeek: [1, 3, 5] };
    // 2026-10-19 is a Monday (day 1)
    const from = new Date("2026-10-19T10:00:00Z");
    const next = computeNextOccurrence(rule, from);
    // Next Wed (day 3) same week
    expect(next.toISOString()).toBe("2026-10-21T10:00:00.000Z");
  });

  it("advances weekdays skipping weekends", () => {
    const rule: RecurrenceRule = { frequency: "weekdays" };
    // 2026-10-23 is Friday
    const from = new Date("2026-10-23T10:00:00Z");
    const next = computeNextOccurrence(rule, from);
    // Should skip Sat+Sun → Monday Oct 26
    expect(next.toISOString()).toBe("2026-10-26T10:00:00.000Z");
  });

  it("advances monthly", () => {
    const rule: RecurrenceRule = { frequency: "monthly" };
    const from = new Date("2026-10-23T10:00:00Z");
    const next = computeNextOccurrence(rule, from);
    expect(next.toISOString()).toBe("2026-11-23T10:00:00.000Z");
  });

  it("clamps monthly to end of shorter month", () => {
    const rule: RecurrenceRule = { frequency: "monthly", dayOfMonth: 31 };
    const from = new Date("2026-01-31T10:00:00Z");
    const next = computeNextOccurrence(rule, from);
    // Feb has 28 days in 2026
    expect(next.getUTCDate()).toBe(28);
    expect(next.getUTCMonth()).toBe(1);
  });

  it("handles monthly interval > 1", () => {
    const rule: RecurrenceRule = { frequency: "monthly", interval: 3 };
    const from = new Date("2026-10-15T10:00:00Z");
    const next = computeNextOccurrence(rule, from);
    expect(next.toISOString()).toBe("2027-01-15T10:00:00.000Z");
  });
});
