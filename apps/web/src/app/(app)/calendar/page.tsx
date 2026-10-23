import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requirePageWorkspace } from "@/lib/require-page-auth";
import { createTranslator } from "@pfmp/i18n";
import { getPrisma, CalendarQueryService } from "@pfmp/database";
import { currentJalaliYear } from "@pfmp/calendar";
import { format as formatJalali, newDate } from "date-fns-jalali";
import { JalaliYearCalendar, type CalendarEvent } from "./jalali-year-calendar";

export default async function CalendarPage() {
  const ctx = await requirePageWorkspace(await headers());
  const { t } = createTranslator(ctx.locale);
  const year = currentJalaliYear();

  const from = newDate(year, 0, 1);
  const to = newDate(year, 11, 29);

  let items: Awaited<ReturnType<CalendarQueryService["query"]>> = [];
  try {
    items = await new CalendarQueryService(getPrisma()).query(ctx.workspace.id, from, to);
  } catch {
    items = [];
  }

  const events: CalendarEvent[] = items.map((item) => {
    const d = new Date(item.startsAtUtc);
    return {
      id: item.id,
      kind: item.kind,
      title: item.title,
      dayKey: formatJalali(d, "yyyy-MM-dd"),
    };
  });

  return (
    <SignedInShell pathname="/calendar" locale={ctx.locale}>
      <section className="panel stack">
        <div>
          <h1>{t("calendar.title")}</h1>
          <p className="panel-lead">
            Solar Hijri (Persian) year view. Expand months to see weekly schedules and what you need
            to prepare for.
          </p>
        </div>
        <JalaliYearCalendar events={events} initialYear={year} />
      </section>
    </SignedInShell>
  );
}
