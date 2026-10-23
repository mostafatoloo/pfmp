import { format } from "date-fns";

/**
 * Stage 3 stub — Jalali display helpers land fully in Stage 4 (ADR-005).
 * Storage remains Gregorian/UTC; this package only formats for UI.
 */
export function formatUtcIso(date: Date): string {
  return date.toISOString();
}

export function formatGregorianDisplay(date: Date, pattern = "yyyy-MM-dd"): string {
  return format(date, pattern);
}

/** Placeholder until date-fns-jalali wiring is verified in Stage 4 */
export function formatJalaliDisplay(date: Date): string {
  // Keep dependency present; full Jalali format in Stage 4 calendar module
  void date;
  return formatGregorianDisplay(date) + " (Jalali TBD)";
}
