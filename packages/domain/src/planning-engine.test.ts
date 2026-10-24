import { describe, expect, it } from "vitest";
import { planDeterministic } from "./planning-engine";

describe("planDeterministic", () => {
  const base = {
    windowStartUtc: "2026-11-01T08:00:00.000Z",
    blocks: [
      {
        id: "b",
        title: "B",
        durationSeconds: 3600,
        earliestStartUtc: "2026-11-01T08:00:00.000Z",
        latestEndUtc: "2026-11-01T18:00:00.000Z",
      },
      {
        id: "a",
        title: "A",
        durationSeconds: 1800,
        earliestStartUtc: "2026-11-01T08:00:00.000Z",
        latestEndUtc: "2026-11-01T12:00:00.000Z",
      },
    ],
  };

  it("is deterministic for same inputs", () => {
    const r1 = planDeterministic(base);
    const r2 = planDeterministic(base);
    expect(r1).toEqual(r2);
    expect(r1.items[0]?.sourceId).toBe("a");
    expect(r1.unplaced).toEqual([]);
  });

  it("marks unplaceable blocks", () => {
    const r = planDeterministic({
      windowStartUtc: "2026-11-01T08:00:00.000Z",
      blocks: [
        {
          id: "x",
          title: "Too long",
          durationSeconds: 10_000,
          earliestStartUtc: "2026-11-01T08:00:00.000Z",
          latestEndUtc: "2026-11-01T09:00:00.000Z",
        },
      ],
    });
    expect(r.items).toEqual([]);
    expect(r.unplaced[0]?.reason).toBe("window_too_small");
  });
});
