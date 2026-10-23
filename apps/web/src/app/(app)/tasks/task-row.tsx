"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TaskStatus = "inbox" | "planned" | "in_progress" | "completed" | "cancelled";

type Labels = {
  setDue: string;
  dueDate: string;
  start: string;
  plan: string;
  done: string;
  reopen: string;
};

function nextActions(status: TaskStatus, labels: Labels): { label: string; to: TaskStatus }[] {
  switch (status) {
    case "inbox":
      return [
        { label: labels.start, to: "in_progress" },
        { label: labels.plan, to: "planned" },
      ];
    case "planned":
      return [{ label: labels.start, to: "in_progress" }];
    case "in_progress":
      return [{ label: labels.done, to: "completed" }];
    case "cancelled":
      return [{ label: labels.reopen, to: "inbox" }];
    default:
      return [];
  }
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function dateInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T23:59:59`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function TaskRow(props: {
  id: string;
  title: string;
  status: TaskStatus;
  dueAtUtc: string | null;
  pomodoroEstimate?: number | null;
  pomodorosDone?: number;
  labels: Labels;
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
    await patch({ dueAtUtc: dateInputToIso(due) });
  }

  const actions = nextActions(props.status, props.labels);

  return (
    <li className="list-item">
      <div style={{ flex: "1 1 220px" }}>
        <strong>{props.title}</strong>
        <div className="row" style={{ marginBlockStart: "0.35rem" }}>
          <span className="badge">{props.status.replace("_", " ")}</span>
          <span className="muted bidi-isolate">
            {props.dueAtUtc ? props.dueAtUtc.slice(0, 10) : "—"}
          </span>
          {props.pomodoroEstimate ? (
            <span className="badge brand">
              {props.pomodorosDone ?? 0}/{props.pomodoroEstimate} 🍅
            </span>
          ) : (props.pomodorosDone ?? 0) > 0 ? (
            <span className="badge">{props.pomodorosDone} 🍅</span>
          ) : null}
        </div>
      </div>

      <div className="row">
        <a className="btn secondary sm" href={`/time?task=${props.id}`}>
          Timer
        </a>
        <form onSubmit={saveDue} className="row">
          <label className="muted" htmlFor={`due-${props.id}`}>
            {props.labels.dueDate}
          </label>
          <input
            id={`due-${props.id}`}
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            disabled={busy || props.status === "completed"}
            style={{
              minHeight: "2.25rem",
              paddingInline: "0.5rem",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-sm)",
              font: "inherit",
            }}
          />
          <button
            className="btn secondary sm"
            type="submit"
            disabled={busy || props.status === "completed"}
          >
            {props.labels.setDue}
          </button>
        </form>

        {actions.map((a) => (
          <button
            key={a.to}
            className="btn sm"
            type="button"
            disabled={busy}
            onClick={() => void patch({ status: a.to })}
          >
            {a.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="muted" role="alert" style={{ width: "100%", margin: 0 }}>
          {error}
        </p>
      ) : null}
    </li>
  );
}
