/**
 * Locale registry — Phase 2 enables English only.
 * Adding a language: register here, add messages/<code>/, enable when translations are complete.
 */

export type TextDirection = "ltr" | "rtl";

export type CalendarSystem = "gregory" | "persian";

export type LocaleDefinition = {
  /** BCP 47 language tag used as stable id (never translate this) */
  code: string;
  /** English name for admin / docs */
  englishName: string;
  /** Native endonym */
  nativeName: string;
  direction: TextDirection;
  /** Intl locale for number/date formatting (may differ from UI language later) */
  intlLocale: string;
  /** Default calendar for display helpers (user prefs can override) */
  defaultCalendar: CalendarSystem;
  /** Week starts on: 0 = Sunday … 6 = Saturday */
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** When false, locale must not appear in production language selectors */
  enabled: boolean;
  /** Dev-only: allow RTL layout simulation without shipping translations */
  rtlSimulation?: boolean;
};

export const LOCALES: Record<string, LocaleDefinition> = {
  en: {
    code: "en",
    englishName: "English",
    nativeName: "English",
    direction: "ltr",
    intlLocale: "en-US",
    defaultCalendar: "gregory",
    weekStartsOn: 1,
    enabled: true,
  },
  /**
   * Registered for architecture / RTL simulation only — not selectable in production.
   * Enable after complete message catalogs pass review.
   */
  fa: {
    code: "fa",
    englishName: "Persian",
    nativeName: "فارسی",
    direction: "rtl",
    intlLocale: "fa-IR",
    defaultCalendar: "persian",
    weekStartsOn: 6,
    enabled: false,
    rtlSimulation: true,
  },
};

export const DEFAULT_LOCALE = "en";

/** Production-selectable locales (English only in Phase 2). */
export function enabledLocales(): LocaleDefinition[] {
  return Object.values(LOCALES).filter((l) => l.enabled);
}

export function resolveLocale(code: string | null | undefined): LocaleDefinition {
  if (code && LOCALES[code]?.enabled) return LOCALES[code]!;
  // Dev RTL simulation: PFMP_FORCE_RTL=1 uses fa direction with English messages
  if (process.env.PFMP_FORCE_RTL === "1" || process.env.PFMP_FORCE_RTL === "true") {
    return { ...LOCALES.en!, direction: "rtl", code: "en" };
  }
  return LOCALES[DEFAULT_LOCALE]!;
}

export function directionForLocale(code: string | null | undefined): TextDirection {
  return resolveLocale(code).direction;
}

/** Safe for Server Components — do not place in a `"use client"` module. */
export function documentLocaleAttrs(locale: string): { lang: string; dir: TextDirection } {
  const def = resolveLocale(locale);
  return { lang: def.code, dir: def.direction };
}
