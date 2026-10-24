/**
 * Locale registry — English, Finglish (Latin-script Persian, LTR), Persian (RTL).
 */

export type TextDirection = "ltr" | "rtl";

export type CalendarSystem = "gregory" | "persian";

export type LocaleDefinition = {
  code: string;
  englishName: string;
  nativeName: string;
  direction: TextDirection;
  contentDirection?: TextDirection;
  messagesLocale?: string;
  intlLocale: string;
  defaultCalendar: CalendarSystem;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  enabled: boolean;
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
    defaultCalendar: "persian",
    weekStartsOn: 6,
    enabled: true,
  },
  /**
   * Full LTR. UI copy is Persian words spelled with Latin letters (e.g. Kar-ha).
   */
  finglish: {
    code: "finglish",
    englishName: "Finglish",
    nativeName: "Finglish",
    direction: "ltr",
    contentDirection: "ltr",
    messagesLocale: "finglish",
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

export function enabledLocales(): LocaleDefinition[] {
  return Object.values(LOCALES).filter((l) => l.enabled);
}

export function resolveLocale(code: string | null | undefined): LocaleDefinition {
  if (code && LOCALES[code]?.enabled) return LOCALES[code]!;
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

export function documentLocaleAttrs(locale: string): {
  lang: string;
  dir: TextDirection;
  contentDir: TextDirection;
} {
  const def = resolveLocale(locale);
  return {
    lang: def.code === "fa" ? "fa" : "en",
    dir: def.direction,
    contentDir: def.contentDirection ?? def.direction,
  };
}
