import type { PrismaClient } from "./client";
import { SOFT_DELETE_FILTER, utcNow } from "./conventions";

export class RecurrenceServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "INVALID_RULE" | "NOT_TEMPLATE",
    message: string,
  ) {
    super(message);
    this.name = "RecurrenceServiceError";
  }
}

/** Supported recurrence frequency types. */
export type RecurrenceFrequency = "daily" | "weekly" | "weekdays" | "monthly";

export type RecurrenceRule = {
  frequency: RecurrenceFrequency;
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endAfterOccurrences?: number;
  endByDate?: string;
};

const VALID_FREQUENCIES: ReadonlySet<string> = new Set([
  "daily",
  "weekly",
  "weekdays",
  "monthly",
]);

/** Parse and validate a recurrence rule JSON string. */
export function parseRecurrenceRule(json: string): RecurrenceRule {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new RecurrenceServiceError("INVALID_RULE", "Invalid JSON in recurrence rule");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new RecurrenceServiceError("INVALID_RULE", "Recurrence rule must be an object");
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.frequency !== "string" || !VALID_FREQUENCIES.has(obj.frequency)) {
    throw new RecurrenceServiceError(
      "INVALID_RULE",
      `Invalid frequency: ${String(obj.frequency)}. Must be one of: ${[...VALID_FREQUENCIES].join(", ")}`,
    );
  }

  const rule: RecurrenceRule = { frequency: obj.frequency as RecurrenceFrequency };

  if (obj.interval !== undefined) {
    if (typeof obj.interval !== "number" || obj.interval < 1 || !Number.isInteger(obj.interval)) {
      throw new RecurrenceServiceError("INVALID_RULE", "interval must be a positive integer");
    }
    rule.interval = obj.interval;
  }

  if (obj.daysOfWeek !== undefined) {
    if (
      !Array.isArray(obj.daysOfWeek) ||
      !obj.daysOfWeek.every((d) => typeof d === "number" && d >= 0 && d <= 6)
    ) {
      throw new RecurrenceServiceError("INVALID_RULE", "daysOfWeek must be an array of 0-6");
    }
    rule.daysOfWeek = obj.daysOfWeek;
  }

  if (obj.dayOfMonth !== undefined) {
    if (
      typeof obj.dayOfMonth !== "number" ||
      obj.dayOfMonth < 1 ||
      obj.dayOfMonth > 31 ||
      !Number.isInteger(obj.dayOfMonth)
    ) {
      throw new RecurrenceServiceError("INVALID_RULE", "dayOfMonth must be 1-31");
    }
    rule.dayOfMonth = obj.dayOfMonth;
  }

  if (obj.endAfterOccurrences !== undefined) {
    if (
      typeof obj.endAfterOccurrences !== "number" ||
      obj.endAfterOccurrences < 1 ||
      !Number.isInteger(obj.endAfterOccurrences)
    ) {
      throw new RecurrenceServiceError("INVALID_RULE", "endAfterOccurrences must be a positive integer");
    }
    rule.endAfterOccurrences = obj.endAfterOccurrences;
  }

  if (obj.endByDate !== undefined) {
    if (typeof obj.endByDate !== "string" || Number.isNaN(Date.parse(obj.endByDate))) {
      throw new RecurrenceServiceError("INVALID_RULE", "endByDate must be a valid ISO date string");
    }
    rule.endByDate = obj.endByDate;
  }

  return rule;
}

/** Compute the next occurrence date from a reference date using the recurrence rule. */
export function computeNextOccurrence(rule: RecurrenceRule, fromDate: Date): Date {
  const interval = rule.interval ?? 1;
  const next = new Date(fromDate);

  switch (rule.frequency) {
    case "daily":
      next.setUTCDate(next.getUTCDate() + interval);
      break;

    case "weekly":
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const currentDay = next.getUTCDay();
        const sorted = [...rule.daysOfWeek].sort((a, b) => a - b);
        const nextDay = sorted.find((d) => d > currentDay);
        if (nextDay !== undefined) {
          next.setUTCDate(next.getUTCDate() + (nextDay - currentDay));
        } else {
          const daysUntilFirst = 7 * interval - currentDay + sorted[0]!;
          next.setUTCDate(next.getUTCDate() + daysUntilFirst);
        }
      } else {
        next.setUTCDate(next.getUTCDate() + 7 * interval);
      }
      break;

    case "weekdays": {
      let daysAdded = 0;
      while (daysAdded < interval) {
        next.setUTCDate(next.getUTCDate() + 1);
        const day = next.getUTCDay();
        if (day !== 0 && day !== 6) daysAdded++;
      }
      break;
    }

    case "monthly": {
      const targetDay = rule.dayOfMonth ?? fromDate.getUTCDate();
      const newMonth = next.getUTCMonth() + interval;
      next.setUTCDate(1);
      next.setUTCMonth(newMonth);
      const maxDay = new Date(
        Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
      ).getUTCDate();
      next.setUTCDate(Math.min(targetDay, maxDay));
      break;
    }
  }

  return next;
}

export class RecurrenceService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Expand the next occurrence of a recurrence template task.
   * Idempotent: if an occurrence already exists for the computed date, returns it.
   */
  async expandNextOccurrence(workspaceId: string, templateTaskId: string) {
    const template = await this.prisma.task.findFirst({
      where: {
        id: templateTaskId,
        workspaceId,
        isRecurrenceTemplate: true,
        ...SOFT_DELETE_FILTER,
      },
    });

    if (!template) {
      throw new RecurrenceServiceError("NOT_FOUND", "Template task not found");
    }
    if (!template.recurrenceRuleJson) {
      throw new RecurrenceServiceError("NOT_TEMPLATE", "Task has no recurrence rule");
    }

    const rule = parseRecurrenceRule(template.recurrenceRuleJson);
    const referenceDate = template.dueAtUtc ?? utcNow();
    const nextDue = computeNextOccurrence(rule, referenceDate);

    if (rule.endByDate && nextDue > new Date(rule.endByDate)) {
      return null;
    }

    const existingCount = await this.prisma.task.count({
      where: {
        workspaceId,
        recurrenceParentId: templateTaskId,
        ...SOFT_DELETE_FILTER,
      },
    });

    if (rule.endAfterOccurrences && existingCount >= rule.endAfterOccurrences) {
      return null;
    }

    const existingForDate = await this.prisma.task.findFirst({
      where: {
        workspaceId,
        recurrenceParentId: templateTaskId,
        dueAtUtc: nextDue,
        ...SOFT_DELETE_FILTER,
      },
    });
    if (existingForDate) return existingForDate;

    return this.prisma.task.create({
      data: {
        workspaceId,
        title: template.title,
        notes: template.notes,
        status: "planned",
        dueAtUtc: nextDue,
        originalDueAtUtc: nextDue,
        projectId: template.projectId,
        courseId: template.courseId,
        priority: template.priority,
        createdByUserId: template.createdByUserId,
        recurrenceParentId: templateTaskId,
        isRecurrenceTemplate: false,
      },
    });
  }
}
