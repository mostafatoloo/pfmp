import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requireWorkspace } from "@pfmp/auth";
import { getPrisma, TaskService } from "@pfmp/database";
import { TaskCaptureForm } from "./task-capture-form";
import { TaskRow } from "./task-row";

type TaskStatus = "inbox" | "planned" | "in_progress" | "completed" | "cancelled";

export default async function TasksPage() {
  const ctx = await requireWorkspace(await headers());
  const service = new TaskService(getPrisma());
  const tasks = await service.list(ctx.workspace.id);

  return (
    <SignedInShell pathname="/tasks">
      <section className="panel">
        <h1>Tasks</h1>
        <p>
          Capture a task (optional due). Use <strong>Set due</strong> to schedule, then{" "}
          <strong>Start</strong> to begin work.
        </p>
        <TaskCaptureForm />
        <ul style={{ listStyle: "none", padding: 0, marginTop: "1.25rem" }}>
          {tasks.length === 0 ? (
            <li className="muted">No tasks yet.</li>
          ) : (
            tasks.map((t) => (
              <TaskRow
                key={t.id}
                id={t.id}
                title={t.title}
                status={t.status as TaskStatus}
                dueAtUtc={t.dueAtUtc?.toISOString() ?? null}
              />
            ))
          )}
        </ul>
      </section>
    </SignedInShell>
  );
}
