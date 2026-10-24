/**
 * Deterministic hard-constraint planning engine (M4).
 * Pure: same inputs → same ordered schedule items. No I/O / AI.
 */

export type PlanningBlockInput = {
  id: string;
  title: string;
  durationSeconds: number;
  /** Earliest allowed start (inclusive) */
  earliestStartUtc: string;
  /** Latest allowed end (exclusive) */
  latestEndUtc: string;
};

export type PlanningEngineInput = {
  /** Window start (ISO UTC) */
  windowStartUtc: string;
  blocks: PlanningBlockInput[];
};

export type PlannedItem = {
  sourceId: string;
  title: string;
  startsAtUtc: string;
  endsAtUtc: string;
  durationSeconds: number;
};

export type PlanningEngineResult = {
  items: PlannedItem[];
  unplaced: { id: string; title: string; reason: string }[];
};

function toMs(iso: string): number {
  return new Date(iso).getTime();
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

/**
 * Pack blocks greedily in stable sort order (earliest deadline, then id).
 * Places each block at the earliest free slot that satisfies its window.
 */
export function planDeterministic(input: PlanningEngineInput): PlanningEngineResult {
  const windowStart = toMs(input.windowStartUtc);
  const sorted = [...input.blocks].sort((a, b) => {
    const da = toMs(a.latestEndUtc) - toMs(b.latestEndUtc);
    if (da !== 0) return da;
    return a.id.localeCompare(b.id);
  });

  type Occ = { start: number; end: number };
  const occupied: Occ[] = [];
  const items: PlannedItem[] = [];
  const unplaced: PlanningEngineResult["unplaced"] = [];

  for (const block of sorted) {
    const durationMs = block.durationSeconds * 1000;
    if (durationMs <= 0) {
      unplaced.push({ id: block.id, title: block.title, reason: "non_positive_duration" });
      continue;
    }
    const earliest = Math.max(windowStart, toMs(block.earliestStartUtc));
    const latestEnd = toMs(block.latestEndUtc);
    if (earliest + durationMs > latestEnd) {
      unplaced.push({ id: block.id, title: block.title, reason: "window_too_small" });
      continue;
    }

    let cursor = earliest;
    let placed: Occ | null = null;
    const gaps = [...occupied].sort((a, b) => a.start - b.start);
    for (const gap of gaps) {
      if (cursor + durationMs <= gap.start && cursor + durationMs <= latestEnd) {
        placed = { start: cursor, end: cursor + durationMs };
        break;
      }
      cursor = Math.max(cursor, gap.end);
      if (cursor < earliest) cursor = earliest;
    }
    if (!placed && cursor + durationMs <= latestEnd) {
      placed = { start: cursor, end: cursor + durationMs };
    }
    if (!placed) {
      unplaced.push({ id: block.id, title: block.title, reason: "no_free_slot" });
      continue;
    }
    occupied.push(placed);
    items.push({
      sourceId: block.id,
      title: block.title,
      startsAtUtc: toIso(placed.start),
      endsAtUtc: toIso(placed.end),
      durationSeconds: block.durationSeconds,
    });
  }

  items.sort((a, b) => toMs(a.startsAtUtc) - toMs(b.startsAtUtc));
  return { items, unplaced };
}
