import { AppShell, APP_NAV } from "@pfmp/ui";
import { createTranslator, documentLocaleAttrs } from "@pfmp/i18n";
import type { ReactNode } from "react";

export function SignedInShell({
  children,
  pathname,
  locale = "en",
}: {
  children: ReactNode;
  pathname: string;
  locale?: string;
}) {
  const { t } = createTranslator(locale);
  const { dir } = documentLocaleAttrs(locale);
  const labels: Record<string, string> = {
    "nav.primary": t("nav.primary"),
  };
  for (const item of APP_NAV) {
    labels[item.labelKey] = t(item.labelKey);
  }

  return (
    <AppShell
      pathname={pathname}
      brand={t("common.brand")}
      locale={locale}
      dir={dir}
      labels={labels}
    >
      {children}
    </AppShell>
  );
}
