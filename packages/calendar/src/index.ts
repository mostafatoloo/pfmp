import { format } from "date-fns";
import { format as formatJalali } from "date-fns-jalali";

/**
 * Jalali display helpers (ADR-005). Storage remains Gregorian/UTC.
 */

export function formatUtcIso(date: Date): string {
  return date.toISOString();
}

export function formatGregorianDisplay(date: Date, pattern = "yyyy-MM-dd"): string {
  return format(date, pattern);
}

export function formatJalaliDisplay(date: Date, pattern = "yyyy/MM/dd"): string {
  return formatJalali(date, pattern);
}

export function formatJalaliDateTime(date: Date): string {
  return formatJalali(date, "yyyy/MM/dd HH:mm");
}
