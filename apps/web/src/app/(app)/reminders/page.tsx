import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requirePageWorkspace } from "@/lib/require-page-auth";
import { createTranslator } from "@pfmp/i18n";
import { getPrisma, ReminderService } from "@pfmp/database";
import { RemindersClient } from "./reminders-client";

export default async function RemindersPage() {
  const ctx = await requirePageWorkspace(await headers());
  const { t } = createTranslator(ctx.locale);
  const rows = await new ReminderService(getPrisma()).list(ctx.workspace.id, ctx.userId);

  return (
    <SignedInShell pathname="/reminders" locale={ctx.locale} calendarSystem={ctx.calendarSystem} weekStartsOn={ctx.weekStartsOn}>
      <section className="panel stack">
        <div>
          <h1>{t("reminders.title")}</h1>
          <p className="panel-lead">{t("reminders.subtitle")}</p>
        </div>
        <RemindersClient
          initial={rows.map((r) => ({
            id: r.id,
            title: r.title,
            notes: r.notes,
            remindAtUtc: r.remindAtUtc.toISOString(),
          }))}
        />
      </section>
    </SignedInShell>
  );
}
