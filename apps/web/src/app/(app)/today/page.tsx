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
      title: `Clear ${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}`,
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
      title: `Finish what is due today (${dueToday.length})`,
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
      title: "Follow today’s timetable",
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
      title: "Run a Pomodoro on a planned task",
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
      title: "Plan the day",
      detail: "Add a task with a due date, or block study time on the weekly timetable.",
      href: "/tasks",
      priority: "medium",
    });
  }

  return (
    <SignedInShell pathname="/today" locale={ctx.locale}>
      <section className="panel stack">
        <div>
          <h1>{t("today.title")}</h1>
          <p className="panel-lead">
            {jalaliToday}. Here is what matters <em>today</em> — start at the top and work down.
          </p>
        </div>

        <div className="card stack">
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Do this next</h2>
          <ol className="list-plain" style={{ listStyle: "decimal", paddingInlineStart: "1.25rem" }}>
            {nextActions.map((a) => (
              <li key={a.title} style={{ marginBottom: "0.75rem" }}>
                <Link href={a.href} style={{ fontWeight: 600 }}>
                  {a.title}
                </Link>
                <div className="muted">{a.detail}</div>
                <span className={`badge ${a.priority === "high" ? "warning" : "brand"}`}>
                  {a.priority === "high" ? "Priority" : "Suggested"}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="row" style={{ alignItems: "stretch" }}>
          <div className="card stack" style={{ flex: "1 1 240px" }}>
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Today’s classes & study</h2>
            {todaySlots.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                No timetable entries for this weekday.{" "}
                <Link href="/study">Build your weekly plan</Link>.
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
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Focus progress</h2>
            <p className="muted" style={{ margin: 0 }}>
              {sessionsToday.length} focus session{sessionsToday.length === 1 ? "" : "s"} completed
              today.
            </p>
            <Link className="btn secondary" href="/time">
              Open timer
            </Link>
          </div>
        </div>

        <div className="card stack">
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Due & overdue</h2>
          {dueToday.length === 0 && overdue.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              Nothing due today. Capture upcoming work in <Link href="/tasks">Tasks</Link> or check{" "}
              <Link href="/calendar">Calendar</Link> for the week ahead.
            </p>
          ) : (
            <ul className="list-plain">
              {[...overdue, ...dueToday].slice(0, 10).map((task) => (
                <li key={task.id} className="list-item">
                  <span>{task.title}</span>
                  <span className={`badge ${overdue.includes(task) ? "danger" : "warning"}`}>
                    {overdue.includes(task) ? "Overdue" : "Due today"}
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
