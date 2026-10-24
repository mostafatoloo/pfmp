import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requirePageWorkspace } from "@/lib/require-page-auth";
import { createTranslator } from "@pfmp/i18n";
import { getPrisma, TimetableService } from "@pfmp/database";
import { StudySchedule } from "./study-schedule";

export default async function StudyPage() {
  const ctx = await requirePageWorkspace(await headers());
  const { t } = createTranslator(ctx.locale);
  const service = new TimetableService(getPrisma());
  const [slots, settings] = await Promise.all([
    service.list(ctx.workspace.id),
    service.getSettings(ctx.workspace.id),
  ]);

  return (
    <SignedInShell pathname="/study" locale={ctx.locale}>
      <section className="panel stack">
        <div>
          <h1>{t("study.title")}</h1>
          <p className="panel-lead">
            Plan the week as a schedule grid: school classes first, then fill free time with study
            and other activities. Each day keeps its own time divisions.
          </p>
        </div>
        <StudySchedule
          initialSlots={slots.map((s) => ({
            id: s.id,
            kind: s.kind,
            title: s.title,
            description: s.description,
            dayOfWeek: s.dayOfWeek,
            startMinutes: s.startMinutes,
            endMinutes: s.endMinutes,
            classType: s.classType,
            notes: s.notes,
          }))}
          initialSettings={settings}
        />
      </section>
    </SignedInShell>
  );
}
