import { DEFAULT_LOCALE, LOCALES, messagesLocaleFor } from "./locales";
import { enMessages, type MessageCatalog } from "./messages/en";
import { faMessages } from "./messages/fa";

export type TranslateParams = Record<string, string | number>;

export type MissingKeyHandler = (key: string, locale: string) => void;

const catalogs: Record<string, MessageCatalog> = {
  en: enMessages,
  fa: faMessages,
};

/** Dev/test: collect missing keys for discovery */
const missingKeys = new Set<string>();

let onMissing: MissingKeyHandler = (key, locale) => {
  missingKeys.add(`${locale}:${key}`);
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[i18n] missing translation: ${key} (locale=${locale})`);
  }
};

export function setMissingKeyHandler(handler: MissingKeyHandler): void {
  onMissing = handler;
}

export function getMissingKeys(): string[] {
  return [...missingKeys].sort();
}

export function clearMissingKeys(): void {
  missingKeys.clear();
}

export function registerCatalog(locale: string, catalog: MessageCatalog): void {
  catalogs[locale] = catalog;
}

type Nested = Record<string, unknown>;

function lookup(catalog: Nested, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = catalog;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Nested)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const v = params[name];
    return v === undefined ? `{${name}}` : String(v);
  });
}

/**
 * Simple pluralization: key, key_one, key_other (ICU-lite).
 * Prefer `key_other` when count !== 1.
 */
function pluralKey(base: string, count: number): string {
  return count === 1 ? `${base}_one` : `${base}_other`;
}

export type Translator = {
  locale: string;
  t: (key: string, params?: TranslateParams & { count?: number }) => string;
};

export function createTranslator(localeCode: string = DEFAULT_LOCALE): Translator {
  const uiLocale = LOCALES[localeCode]?.enabled ? localeCode : DEFAULT_LOCALE;
  const catalogLocale = messagesLocaleFor(uiLocale);
  const primary = catalogs[catalogLocale] ?? catalogs[DEFAULT_LOCALE]!;
  const fallback = catalogs[DEFAULT_LOCALE]!;

  return {
    locale: uiLocale,
    t(key, params) {
      const count = params?.count;
      const tryKeys =
        typeof count === "number" ? [pluralKey(key, count), key] : [key];

      for (const k of tryKeys) {
        const hit = lookup(primary as unknown as Nested, k);
        if (hit !== undefined) return interpolate(hit, params);
      }
      if (catalogLocale !== DEFAULT_LOCALE) {
        for (const k of tryKeys) {
          const hit = lookup(fallback as unknown as Nested, k);
          if (hit !== undefined) {
            onMissing(k, uiLocale);
            return interpolate(hit, params);
          }
        }
      }
      onMissing(key, uiLocale);
      return key;
    },
  };
}
