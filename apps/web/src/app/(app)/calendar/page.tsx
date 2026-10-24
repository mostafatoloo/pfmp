import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requirePageWorkspace } from "@/lib/require-page-auth";
import { createTranslator } from "@pfmp/i18n";
import { getPrisma, CalendarQueryService } from "@pfmp/database";
import { currentJalaliYear } from "@pfmp/calendar";
import { format as formatJalali, newDate } from "date-fns-jalali";
import { JalaliYearCalendar, type CalendarEvent } from "./jalali-year-calendar";
import { GregoryYearCalendar } from "./gregory-year-calendar";

function gregoryDayKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default async function CalendarPage() {
  const ctx = await requirePageWorkspace(await headers());
  const { t } = createTranslator(ctx.locale);
  const useShamsi = ctx.calendarSystem !== "gregory";
  const year = useShamsi ? currentJalaliYear() : new Date().getFullYear();

  const from = useShamsi ? newDate(year, 0, 1) : new Date(Date.UTC(year, 0, 1));
  const to = useShamsi ? newDate(year, 11, 29) : new Date(Date.UTC(year, 11, 31, 23, 59, 59));

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
      dayKey: useShamsi ? formatJalali(d, "yyyy-MM-dd") : gregoryDayKey(d),
    };
  });

  return (
    <SignedInShell pathname="/calendar" locale={ctx.locale} calendarSystem={ctx.calendarSystem} weekStartsOn={ctx.weekStartsOn}>
      <section className="panel stack">
        <div>
          <h1>{t("calendar.title")}</h1>
          <p className="panel-lead">
            {useShamsi ? t("calendar.shamsiLead") : t("calendar.gregoryLead")}
          </p>
        </div>
        {useShamsi ? (
          <JalaliYearCalendar
            events={events}
            initialYear={year}
            weekStartsOn={ctx.weekStartsOn}
          />
        ) : (
          <GregoryYearCalendar
            events={events}
            initialYear={year}
            weekStartsOn={ctx.weekStartsOn}
          />
        )}
      </section>
    </SignedInShell>
  );
}
