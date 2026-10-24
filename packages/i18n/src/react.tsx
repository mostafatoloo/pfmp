"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { createTranslator, type TranslateParams, type Translator } from "./translate";
import { directionForLocale, documentLocaleAttrs } from "./locales";

const I18nContext = createContext<Translator | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  const value = useMemo(() => createTranslator(locale), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Translator {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return createTranslator("en");
  }
  return ctx;
}

export function useT() {
  const { t } = useI18n();
  return t;
}

export function useLocaleDirection(locale: string): "ltr" | "rtl" {
  return directionForLocale(locale);
}

export { documentLocaleAttrs };
export type { TranslateParams };
