"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function dateInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T23:59:59`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function TaskCaptureForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const body: { title: string; dueAtUtc?: string } = { title: title.trim() };
      const dueAtUtc = dateInputToIso(due);
      if (dueAtUtc) body.dueAtUtc = dueAtUtc;

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
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quick capture…"
        aria-label="New task title"
        style={{ flex: "1 1 220px", padding: "0.55rem 0.7rem", border: "1px solid var(--line)" }}
      />
      <input
        type="date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        aria-label="Due date"
        title="Optional due date"
        style={{ padding: "0.55rem 0.7rem", border: "1px solid var(--line)", font: "inherit" }}
      />
      <button className="btn" type="submit" disabled={busy || !title.trim()}>
        Add
      </button>
      {error ? <p className="muted">{error}</p> : null}
    </form>
  );
}
