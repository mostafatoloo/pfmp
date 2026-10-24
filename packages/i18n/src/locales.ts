/**
 * Locale registry — English, Finglish (English UI + content RTL), and Persian (full RTL).
 */

export type TextDirection = "ltr" | "rtl";

export type CalendarSystem = "gregory" | "persian";

export type LocaleDefinition = {
  /** Stable id stored on User.locale (never translate this) */
  code: string;
  /** English name for admin / docs */
  englishName: string;
  /** Native endonym / selector label */
  nativeName: string;
  /** Document / chrome direction (nav, shell) */
  direction: TextDirection;
  /**
   * Direction for data tables, schedule grids, and user-authored content.
   * Defaults to `direction` when omitted.
   */
  contentDirection?: TextDirection;
  /**
   * Message catalog to load. Finglish uses English copy while keeping its own code.
   */
  messagesLocale?: string;
  /** Intl locale for number/date formatting */
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
    contentDirection: "ltr",
    messagesLocale: "en",
    intlLocale: "en-US",
    defaultCalendar: "gregory",
    weekStartsOn: 1,
    enabled: true,
  },
  /**
   * English UI chrome + labels; tables/grids/user content are RTL (Persian typing).
   * Does not flip the whole shell.
   */
  finglish: {
    code: "finglish",
    englishName: "Finglish",
    nativeName: "Finglish",
    direction: "ltr",
    contentDirection: "rtl",
    messagesLocale: "en",
    intlLocale: "en-US",
    defaultCalendar: "persian",
    weekStartsOn: 6,
    enabled: true,
  },
  fa: {
    code: "fa",
    englishName: "Persian",
    nativeName: "فارسی",
    direction: "rtl",
    contentDirection: "rtl",
    messagesLocale: "fa",
    intlLocale: "fa-IR",
    defaultCalendar: "persian",
    weekStartsOn: 6,
    enabled: true,
  },
};

export const DEFAULT_LOCALE = "en";

export const LOCALE_CODES = ["en", "finglish", "fa"] as const;
export type LocaleCode = (typeof LOCALE_CODES)[number];

/** Production-selectable locales. */
export function enabledLocales(): LocaleDefinition[] {
  return Object.values(LOCALES).filter((l) => l.enabled);
}

export function resolveLocale(code: string | null | undefined): LocaleDefinition {
  if (code && LOCALES[code]?.enabled) return LOCALES[code]!;
  // Dev RTL simulation: PFMP_FORCE_RTL=1 uses English messages with full RTL chrome
  if (process.env.PFMP_FORCE_RTL === "1" || process.env.PFMP_FORCE_RTL === "true") {
    return {
      ...LOCALES.en!,
      direction: "rtl",
      contentDirection: "rtl",
      code: "en",
    };
  }
  return LOCALES[DEFAULT_LOCALE]!;
}

export function directionForLocale(code: string | null | undefined): TextDirection {
  return resolveLocale(code).direction;
}

export function contentDirectionForLocale(code: string | null | undefined): TextDirection {
  const def = resolveLocale(code);
  return def.contentDirection ?? def.direction;
}

export function messagesLocaleFor(code: string | null | undefined): string {
  const def = resolveLocale(code);
  return def.messagesLocale ?? def.code;
}

/** Safe for Server Components — do not place in a `"use client"` module. */
export function documentLocaleAttrs(locale: string): {
  lang: string;
  dir: TextDirection;
  contentDir: TextDirection;
} {
  const def = resolveLocale(locale);
  return {
    lang: def.messagesLocale === "fa" || def.code === "fa" ? "fa" : "en",
    dir: def.direction,
    contentDir: def.contentDirection ?? def.direction,
  };
}
