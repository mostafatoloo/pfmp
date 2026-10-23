"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TaskCaptureForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? `Failed (${res.status})`);
        return;
      }
      setTitle("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quick capture…"
        aria-label="New task title"
        style={{ flex: "1 1 220px", padding: "0.55rem 0.7rem", border: "1px solid var(--line)" }}
      />
      <button className="btn" type="submit" disabled={busy || !title.trim()}>
        Add
      </button>
      {error ? <p className="muted">{error}</p> : null}
    </form>
  );
}
