"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TaskStatus = "inbox" | "planned" | "in_progress" | "completed" | "cancelled";

const NEXT: Record<TaskStatus, { label: string; to: TaskStatus }[]> = {
  inbox: [
    { label: "Start", to: "in_progress" },
    { label: "Plan", to: "planned" },
  ],
  planned: [{ label: "Start", to: "in_progress" }],
  in_progress: [{ label: "Done", to: "completed" }],
  completed: [],
  cancelled: [{ label: "Reopen", to: "inbox" }],
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function dateInputToIso(value: string): string | null {
  if (!value) return null;
  // End of local day → UTC ISO (includes Z offset for API schema)
  const d = new Date(`${value}T23:59:59`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function TaskRow(props: {
  id: string;
  title: string;
  status: TaskStatus;
  dueAtUtc: string | null;
}) {
  const router = useRouter();
  const [due, setDue] = useState(toDateInputValue(props.dueAtUtc));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/tasks/${props.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? `Failed (${res.status})`);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveDue(e: React.FormEvent) {
    e.preventDefault();
    const dueAtUtc = dateInputToIso(due);
    await patch({ dueAtUtc });
  }

  const actions = NEXT[props.status] ?? [];

  return (
    <li
      style={{
        display: "grid",
        gap: "0.55rem",
        padding: "0.75rem 0",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <span>
          <strong>{props.title}</strong>
          <span className="muted"> · {props.status.replace("_", " ")}</span>
        </span>
        <span className="muted">{props.dueAtUtc ? props.dueAtUtc.slice(0, 10) : "no due"}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        <form onSubmit={saveDue} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <label className="muted" htmlFor={`due-${props.id}`}>
            Due
          </label>
          <input
            id={`due-${props.id}`}
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            disabled={busy || props.status === "completed"}
            style={{ padding: "0.35rem 0.5rem", border: "1px solid var(--line)", font: "inherit" }}
          />
          <button className="btn secondary" type="submit" disabled={busy || props.status === "completed"}>
            Set due
          </button>
        </form>

        {actions.map((a) => (
          <button
            key={a.to}
            className="btn"
            type="button"
            disabled={busy}
            onClick={() => void patch({ status: a.to })}
          >
            {a.label}
          </button>
        ))}
      </div>

      {error ? <p className="muted">{error}</p> : null}
    </li>
  );
}
