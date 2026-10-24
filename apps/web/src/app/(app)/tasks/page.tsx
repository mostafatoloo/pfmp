import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requirePageWorkspace } from "@/lib/require-page-auth";
import { getPrisma, PomodoroService, TaskService } from "@pfmp/database";
import { createTranslator } from "@pfmp/i18n";
import { TaskCaptureForm } from "./task-capture-form";
import { TaskRow } from "./task-row";

type TaskStatus = "inbox" | "planned" | "in_progress" | "completed" | "cancelled";

function statusLabel(t: (key: string) => string, status: TaskStatus) {
  switch (status) {
    case "inbox":
      return t("tasks.statusInbox");
    case "planned":
      return t("tasks.statusPlanned");
    case "in_progress":
      return t("tasks.statusInProgress");
    case "completed":
      return t("tasks.statusCompleted");
    case "cancelled":
      return t("tasks.statusCancelled");
    default:
      return status;
  }
}

export default async function TasksPage() {
  const ctx = await requirePageWorkspace(await headers());
  const { t } = createTranslator(ctx.locale);
  const prisma = getPrisma();
  const service = new TaskService(prisma);
  const pomo = new PomodoroService(prisma);
  const tasks = await service.list(ctx.workspace.id);

  const rows = await Promise.all(
    tasks.map(async (task) => ({
      task,
      done: await pomo.countCompletedWorkForTask(ctx.workspace.id, task.id),
    })),
  );

  return (
    <SignedInShell
      pathname="/tasks"
      locale={ctx.locale}
      calendarSystem={ctx.calendarSystem}
      weekStartsOn={ctx.weekStartsOn}
    >
      <section className="panel stack">
        <div>
          <h1>{t("tasks.title")}</h1>
          <p className="panel-lead">{t("tasks.pageLead")}</p>
        </div>
        <TaskCaptureForm
          labels={{
            placeholder: t("tasks.capturePlaceholder"),
            add: t("tasks.add"),
            dueDate: t("tasks.dueDate"),
            pomodoros: t("tasks.pomodoros"),
          }}
        />
        <ul className="list-plain">
          {rows.length === 0 ? (
            <li className="empty-state">{t("tasks.noTasks")}</li>
          ) : (
            rows.map(({ task, done }) => (
              <TaskRow
                key={task.id}
                id={task.id}
                title={task.title}
                status={task.status as TaskStatus}
                statusLabel={statusLabel(t, task.status as TaskStatus)}
                dueAtUtc={task.dueAtUtc?.toISOString() ?? null}
                pomodoroEstimate={task.pomodoroEstimate}
                pomodorosDone={done}
                labels={{
                  setDue: t("tasks.setDue"),
                  dueDate: t("tasks.dueDate"),
                  start: t("tasks.start"),
                  plan: t("tasks.plan"),
                  done: t("tasks.done"),
                  reopen: t("tasks.reopen"),
                  openTimer: t("tasks.openTimer"),
                }}
              />
            ))
          )}
        </ul>
      </section>
    </SignedInShell>
  );
}
