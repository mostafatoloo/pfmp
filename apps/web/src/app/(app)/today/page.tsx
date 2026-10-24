import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requirePageWorkspace } from "@/lib/require-page-auth";
import { createTranslator } from "@pfmp/i18n";
import { getPrisma, TaskService, TimetableService, PomodoroService } from "@pfmp/database";
import { formatJalaliDisplay } from "@pfmp/calendar";
import Link from "next/link";

export default async function TodayPage() {
  const ctx = await requirePageWorkspace(await headers());
  const { t } = createTranslator(ctx.locale);
  const prisma = getPrisma();
  const now = new Date();
  const dayOfWeek = now.getDay();
  const jalaliToday = formatJalaliDisplay(now, "EEEE yyyy/MM/dd");

  const tasks = await new TaskService(prisma).list(ctx.workspace.id);
  const open = tasks.filter((x) => x.status !== "completed" && x.status !== "cancelled");
  const todayKey = now.toISOString().slice(0, 10);
  const dueToday = open.filter((x) => x.dueAtUtc?.toISOString().slice(0, 10) === todayKey);
  const overdue = open.filter(
    (x) => x.dueAtUtc && x.dueAtUtc.toISOString().slice(0, 10) < todayKey,
  );
  const focusCandidates = open.filter((x) => (x.pomodoroEstimate ?? 0) > 0).slice(0, 5);

  const slots = await new TimetableService(prisma).list(ctx.workspace.id);
  const todaySlots = slots
    .filter((s) => s.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const pomo = new PomodoroService(prisma);
  const sessionsToday = (await pomo.listSessions(ctx.workspace.id, { userId: ctx.userId })).filter(
    (s) => s.startedAtUtc.toISOString().slice(0, 10) === todayKey && s.kind === "work",
  );

  function fmtMins(m: number) {
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  }

  const nextActions: { title: string; detail: string; href: string; priority: "high" | "medium" }[] =
    [];
  if (overdue.length > 0) {
    nextActions.push({
      title: t("today.clearOverdue", { count: overdue.length }),
      detail: overdue
        .slice(0, 3)
        .map((x) => x.title)
        .join(" · "),
      href: "/tasks",
      priority: "high",
    });
  }
  if (dueToday.length > 0) {
    nextActions.push({
      title: t("today.finishDueToday", { count: dueToday.length }),
      detail: dueToday
        .slice(0, 3)
        .map((x) => x.title)
        .join(" · "),
      href: "/tasks",
      priority: "high",
    });
  }
  if (todaySlots.length > 0) {
    nextActions.push({
      title: t("today.followTimetable"),
      detail: todaySlots
        .slice(0, 3)
        .map((s) => `${fmtMins(s.startMinutes)} ${s.title}`)
        .join(" · "),
      href: "/study",
      priority: "medium",
    });
  }
  if (focusCandidates.length > 0) {
    nextActions.push({
      title: t("today.runPomodoro"),
      detail: focusCandidates
        .slice(0, 2)
        .map((x) => x.title)
        .join(" · "),
      href: "/time",
      priority: "medium",
    });
  }
  if (nextActions.length === 0) {
    nextActions.push({
      title: t("today.planTheDay"),
      detail: t("today.planTheDayDetail"),
      href: "/tasks",
      priority: "medium",
    });
  }

  return (
    <SignedInShell
      pathname="/today"
      locale={ctx.locale}
      calendarSystem={ctx.calendarSystem}
      weekStartsOn={ctx.weekStartsOn}
    >
      <section className="panel stack">
        <div>
          <h1>{t("today.title")}</h1>
          <p className="panel-lead">{t("today.lead", { date: jalaliToday })}</p>
        </div>

        <div className="card stack">
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{t("today.doThisNext")}</h2>
          <ol className="list-plain" style={{ listStyle: "decimal", paddingInlineStart: "1.25rem" }}>
            {nextActions.map((a) => (
              <li key={a.title} style={{ marginBottom: "0.75rem" }}>
                <Link href={a.href} style={{ fontWeight: 600 }}>
                  {a.title}
                </Link>
                <div className="muted">{a.detail}</div>
                <span className={`badge ${a.priority === "high" ? "warning" : "brand"}`}>
                  {a.priority === "high" ? t("today.priority") : t("today.suggested")}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="row" style={{ alignItems: "stretch" }}>
          <div className="card stack" style={{ flex: "1 1 240px" }}>
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{t("today.classesAndStudy")}</h2>
            {todaySlots.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                {t("today.noTimetable")}{" "}
                <Link href="/study">{t("today.buildWeeklyPlan")}</Link>.
              </p>
            ) : (
              <ul className="list-plain">
                {todaySlots.map((s) => (
                  <li key={s.id} className="list-item">
                    <span>
                      <strong>
                        {fmtMins(s.startMinutes)}–{fmtMins(s.endMinutes)}
                      </strong>{" "}
                      {s.title}
                    </span>
                    <span className="badge">{s.kind.replace("_", " ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card stack" style={{ flex: "1 1 240px" }}>
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{t("today.focusProgress")}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {t("today.focusSessions", { count: sessionsToday.length })}
            </p>
            <Link className="btn secondary" href="/time">
              {t("today.openTimer")}
            </Link>
          </div>
        </div>

        <div className="card stack">
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{t("today.dueAndOverdue")}</h2>
          {dueToday.length === 0 && overdue.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              {t("today.nothingDue")}
            </p>
          ) : (
            <ul className="list-plain">
              {[...overdue, ...dueToday].slice(0, 10).map((task) => (
                <li key={task.id} className="list-item">
                  <span>{task.title}</span>
                  <span className={`badge ${overdue.includes(task) ? "danger" : "warning"}`}>
                    {overdue.includes(task) ? t("today.overdue") : t("today.dueToday")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </SignedInShell>
  );
}
