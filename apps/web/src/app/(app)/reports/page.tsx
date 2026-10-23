import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requirePageWorkspace } from "@/lib/require-page-auth";
import { createTranslator } from "@pfmp/i18n";

export default async function ReportsPage() {
  const ctx = await requirePageWorkspace(await headers());
  const { t } = createTranslator(ctx.locale);
  return (
    <SignedInShell pathname="/reports" locale={ctx.locale}>
      <section className="panel stack">
        <div>
          <h1>{t("reports.title")}</h1>
          <p className="panel-lead">{t("reports.subtitle")}</p>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>{t("reports.progress")}</h2>
          <p className="muted">{t("reports.byDay")} · {t("reports.byProject")}</p>
          <a className="btn secondary" href="/api/v1/progress/summary">
            {t("reports.export")}
          </a>
        </div>
      </section>
    </SignedInShell>
  );
}
