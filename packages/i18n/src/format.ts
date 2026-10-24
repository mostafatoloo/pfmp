import {
  resolveLocale,
  type CalendarSystem,
  type LocaleDefinition,
} from "./locales";

export type FormatPrefs = {
  locale?: string;
  /** Override Intl locale independently of UI language */
  intlLocale?: string;
  timeZone?: string;
  calendar?: CalendarSystem;
};

function def(prefs?: FormatPrefs): LocaleDefinition {
  return resolveLocale(prefs?.locale);
}

function intlOf(prefs?: FormatPrefs): string {
  return prefs?.intlLocale ?? def(prefs).intlLocale;
}

function tz(prefs?: FormatPrefs): string {
  return prefs?.timeZone ?? "UTC";
}

export function formatNumber(value: number, prefs?: FormatPrefs, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(intlOf(prefs), options).format(value);
}

export function formatPercent(value: number, prefs?: FormatPrefs): string {
  return formatNumber(value, prefs, { style: "percent", maximumFractionDigits: 1 });
}

export function formatCurrency(value: number, currency: string, prefs?: FormatPrefs): string {
  return formatNumber(value, prefs, { style: "currency", currency });
}

export function formatDate(
  date: Date,
  prefs?: FormatPrefs,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  const calendar = prefs?.calendar ?? def(prefs).defaultCalendar;
  return new Intl.DateTimeFormat(intlOf(prefs), {
    ...options,
    timeZone: tz(prefs),
    calendar: calendar === "persian" ? "persian" : "gregory",
  }).format(date);
}

export function formatDateTime(
  date: Date,
  prefs?: FormatPrefs,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
): string {
  return formatDate(date, prefs, options);
}

export function formatDurationSeconds(totalSeconds: number, prefs?: FormatPrefs): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${formatNumber(h, prefs)}h ${formatNumber(m, prefs)}m`;
  }
  if (m > 0) {
    return `${formatNumber(m, prefs)}m ${formatNumber(sec, prefs)}s`;
  }
  return `${formatNumber(sec, prefs)}s`;
}

/** Relative day labels — language from translator; day math uses timeZone. */
export function relativeDayKey(
  date: Date,
  now: Date = new Date(),
  timeZone = "UTC",
): "common.today" | "common.tomorrow" | "common.yesterday" | null {
  const day = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

  const target = day(date);
  const today = day(now);
  if (target === today) return "common.today";

  const tomorrow = new Date(now.getTime() + 86400_000);
  if (target === day(tomorrow)) return "common.tomorrow";

  const yesterday = new Date(now.getTime() - 86400_000);
  if (target === day(yesterday)) return "common.yesterday";

  return null;
}

export function weekStartsOn(prefs?: FormatPrefs): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  return def(prefs).weekStartsOn;
}
