import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requirePageWorkspace } from "@/lib/require-page-auth";
import { createTranslator } from "@pfmp/i18n";
import { getPrisma, PomodoroService, TaskService } from "@pfmp/database";
import { PomodoroBoard } from "./pomodoro-board";

export default async function TimePage() {
  const ctx = await requirePageWorkspace(await headers());
  const { t } = createTranslator(ctx.locale);
  const prisma = getPrisma();
  const pomo = new PomodoroService(prisma);
  const config = await pomo.getOrCreateConfig(ctx.workspace.id);
  const sessions = await pomo.listSessions(ctx.workspace.id);
  const tasks = await new TaskService(prisma).list(ctx.workspace.id);
  const open = tasks.filter((x) => x.status !== "completed" && x.status !== "cancelled");

  const taskOptions = await Promise.all(
    open.map(async (task) => ({
      id: task.id,
      title: task.title,
      pomodoroEstimate: task.pomodoroEstimate ?? null,
      completedPomodoros: await pomo.countCompletedWorkForTask(ctx.workspace.id, task.id),
    })),
  );

  return (
    <SignedInShell
      pathname="/time"
      locale={ctx.locale}
      calendarSystem={ctx.calendarSystem}
      weekStartsOn={ctx.weekStartsOn}
    >
      <section className="panel stack">
        <div>
          <h1>{t("time.title")}</h1>
          <p className="panel-lead">{t("time.pageLead")}</p>
        </div>
        <PomodoroBoard
          tasks={taskOptions}
          config={{
            workSeconds: config.workSeconds,
            shortBreakSeconds: config.shortBreakSeconds,
            longBreakSeconds: config.longBreakSeconds,
            longBreakEvery: config.longBreakEvery,
          }}
          recentSessions={sessions.map((s) => ({
            id: s.id,
            kind: s.kind,
            taskId: s.taskId,
            startedAtUtc: s.startedAtUtc.toISOString(),
            endedAtUtc: s.endedAtUtc?.toISOString() ?? null,
            durationSeconds: s.durationSeconds,
          }))}
        />
      </section>
    </SignedInShell>
  );
}
