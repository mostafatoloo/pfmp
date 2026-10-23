"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function dateInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T23:59:59`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function TaskCaptureForm({
  labels,
}: {
  labels: { placeholder: string; add: string; dueDate: string; pomodoros: string };
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [pomodoros, setPomodoros] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const body: { title: string; dueAtUtc?: string; pomodoroEstimate?: number } = {
        title: title.trim(),
      };
      const dueAtUtc = dateInputToIso(due);
      if (dueAtUtc) body.dueAtUtc = dueAtUtc;
      const estimate = Number(pomodoros);
      if (Number.isFinite(estimate) && estimate >= 1) body.pomodoroEstimate = estimate;

      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? `Failed (${res.status})`);
        return;
      }
      setTitle("");
      setDue("");
      setPomodoros("1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="row" style={{ alignItems: "stretch" }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={labels.placeholder}
        aria-label={labels.placeholder}
        style={fieldStyle}
      />
      <input
        type="date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        aria-label={labels.dueDate}
        title={labels.dueDate}
        style={fieldStyle}
      />
      <label className="row" style={{ gap: "0.35rem" }}>
        <span className="muted" style={{ whiteSpace: "nowrap" }}>
          {labels.pomodoros}
        </span>
        <input
          type="number"
          min={1}
          max={100}
          value={pomodoros}
          onChange={(e) => setPomodoros(e.target.value)}
          style={{ ...fieldStyle, width: "4.5rem" }}
        />
      </label>
      <button className="btn" type="submit" disabled={busy || !title.trim()}>
        {labels.add}
      </button>
      {error ? (
        <p className="muted" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

const fieldStyle: React.CSSProperties = {
  flex: "1 1 160px",
  minHeight: "var(--touch-min)",
  paddingInline: "0.85rem",
  border: "1px solid var(--line-strong)",
  borderRadius: "var(--radius-md)",
  font: "inherit",
};
