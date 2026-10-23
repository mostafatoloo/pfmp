import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requirePageWorkspace } from "@/lib/require-page-auth";
import { createTranslator } from "@pfmp/i18n";
import { getPrisma, TimetableService } from "@pfmp/database";
import { StudyTimetable } from "./study-timetable";

export default async function StudyPage() {
  const ctx = await requirePageWorkspace(await headers());
  const { t } = createTranslator(ctx.locale);
  const slots = await new TimetableService(getPrisma()).list(ctx.workspace.id);

  return (
    <SignedInShell pathname="/study" locale={ctx.locale}>
      <section className="panel stack">
        <div>
          <h1>{t("study.title")}</h1>
          <p className="panel-lead">
            Your weekly timetable. Add school classes, after-school study blocks, and other classes.
            School days are marked so the full week plan is clear.
          </p>
        </div>
        <StudyTimetable
          initialSlots={slots.map((s) => ({
            id: s.id,
            kind: s.kind,
            title: s.title,
            dayOfWeek: s.dayOfWeek,
            startMinutes: s.startMinutes,
            endMinutes: s.endMinutes,
            classType: s.classType,
          }))}
        />
      </section>
    </SignedInShell>
  );
}
