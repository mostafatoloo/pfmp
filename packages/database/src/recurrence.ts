export type RecurrenceRule = {
  frequency: "daily" | "weekly" | "weekdays" | "monthly";
  interval?: number;
  /** 0=Sun … 6=Sat for weekly */
  byWeekday?: number[];
  startDateUtc: string;
  endDateUtc?: string;
  count?: number;
};

export function parseRecurrenceRule(json: string | null | undefined): RecurrenceRule | null {
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as RecurrenceRule;
    if (!raw.frequency || !raw.startDateUtc) return null;
    return {
      frequency: raw.frequency,
      interval: Math.max(1, raw.interval ?? 1),
      byWeekday: raw.byWeekday,
      startDateUtc: raw.startDateUtc,
      endDateUtc: raw.endDateUtc,
      count: raw.count,
    };
  } catch {
    return null;
  }
}

function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

function addMonths(d: Date, months: number): Date {
  const n = new Date(d);
  n.setUTCMonth(n.getUTCMonth() + months);
  return n;
}

/** Next occurrence strictly after `after` (UTC). */
export function nextOccurrence(rule: RecurrenceRule, after: Date): Date | null {
  const start = new Date(rule.startDateUtc);
  const end = rule.endDateUtc ? new Date(rule.endDateUtc) : null;
  const interval = rule.interval ?? 1;
  let cursor = start.getTime() > after.getTime() ? start : after;
  // Advance at least one unit past `after` when equal/before
  if (cursor.getTime() <= after.getTime()) {
    cursor = addDays(after, 0);
  }

  for (let i = 0; i < 400; i++) {
    let candidate: Date;
    switch (rule.frequency) {
      case "daily": {
        const daysFromStart = Math.ceil(
          (Math.max(cursor.getTime(), after.getTime() + 1) - start.getTime()) / 86400_000,
        );
        const steps = Math.max(0, Math.ceil(daysFromStart / interval));
        candidate = addDays(start, steps * interval);
        if (candidate.getTime() <= after.getTime()) candidate = addDays(candidate, interval);
        break;
      }
      case "weekdays": {
        candidate = addDays(after, 1);
        while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6) {
          candidate = addDays(candidate, 1);
        }
        break;
      }
      case "weekly": {
        const days = rule.byWeekday?.length ? rule.byWeekday : [start.getUTCDay()];
        candidate = addDays(after, 1);
        for (let guard = 0; guard < 14 * interval; guard++) {
          if (days.includes(candidate.getUTCDay())) break;
          candidate = addDays(candidate, 1);
        }
        break;
      }
      case "monthly": {
        let months = 0;
        candidate = new Date(start);
        while (candidate.getTime() <= after.getTime()) {
          months += interval;
          candidate = addMonths(start, months);
        }
        break;
      }
      default:
        return null;
    }

    if (end && candidate.getTime() > end.getTime()) return null;
    if (candidate.getTime() > after.getTime()) return candidate;
    cursor = addDays(candidate, 1);
  }
  return null;
}
