/**
 * Shared persistence conventions (F11).
 * - Timestamps: UTC DateTime2(3); prefer *AtUtc column names on domain tables
 * - Durations: integer seconds (never float hours)
 * - Soft delete: deletedAtUtc IS NULL on default queries; hard-delete only auth tokens / jobs
 */

export const SOFT_DELETE_FILTER = { deletedAtUtc: null } as const;

export function utcNow(): Date {
  return new Date();
}

export function durationSecondsBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  if (ms < 0) {
    throw new Error("durationSecondsBetween: end before start");
  }
  return Math.floor(ms / 1000);
}
