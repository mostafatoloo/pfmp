import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requireWorkspace } from "@pfmp/auth";
import { getPrisma, TaskService } from "@pfmp/database";
import { TaskCaptureForm } from "./task-capture-form";

export default async function TasksPage() {
  const ctx = await requireWorkspace(await headers());
  const service = new TaskService(getPrisma());
  const tasks = await service.list(ctx.workspace.id);

  return (
    <SignedInShell pathname="/tasks">
      <section className="panel">
        <h1>Tasks</h1>
        <p>Quick capture and list. Reschedule preserves the original due date.</p>
        <TaskCaptureForm />
        <ul style={{ listStyle: "none", padding: 0, marginTop: "1.25rem" }}>
          {tasks.length === 0 ? (
            <li className="muted">No tasks yet.</li>
          ) : (
            tasks.map((t) => (
              <li
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  padding: "0.55rem 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span>
                  <strong>{t.title}</strong>
                  <span className="muted"> · {t.status}</span>
                </span>
                <span className="muted">
                  {t.dueAtUtc ? t.dueAtUtc.toISOString().slice(0, 10) : "no due"}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </SignedInShell>
  );
}
