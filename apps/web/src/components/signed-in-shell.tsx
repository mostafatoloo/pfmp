import { AppShell, APP_NAV } from "@pfmp/ui";
import { createTranslator, documentLocaleAttrs } from "@pfmp/i18n";
import { I18nProvider } from "@pfmp/i18n/react";
import type { ReactNode } from "react";
import {
  UserPrefsProvider,
  type CalendarSystemPref,
  type WeekStartsOnPref,
} from "./user-prefs";

export function SignedInShell({
  children,
  pathname,
  locale = "en",
  calendarSystem = "persian",
  weekStartsOn = 6,
}: {
  children: ReactNode;
  pathname: string;
  locale?: string;
  calendarSystem?: CalendarSystemPref;
  weekStartsOn?: WeekStartsOnPref;
}) {
  const { t } = createTranslator(locale);
  const { lang, dir, contentDir } = documentLocaleAttrs(locale);
  const labels: Record<string, string> = {
    "nav.primary": t("nav.primary"),
  };
  for (const item of APP_NAV) {
    labels[item.labelKey] = t(item.labelKey);
  }

  return (
    <I18nProvider locale={locale}>
      <UserPrefsProvider calendarSystem={calendarSystem} weekStartsOn={weekStartsOn}>
        <AppShell
          pathname={pathname}
          brand={t("common.brand")}
          locale={locale}
          lang={lang}
          dir={dir}
          contentDir={contentDir}
          labels={labels}
        >
          {children}
        </AppShell>
      </UserPrefsProvider>
    </I18nProvider>
  );
}
