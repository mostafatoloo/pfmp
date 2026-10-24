"use client";

import { useState } from "react";

export function AiPreferenceForm({ labels }: { labels: { title: string; hint: string } }) {
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  async function save(next: boolean) {
    setEnabled(next);
    const res = await fetch("/api/v1/me/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiAssistantEnabled: next }),
    });
    setStatus(res.ok ? "Saved." : "Could not save preference.");
  }

  return (
    <div className="card stack">
      <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{labels.title}</h2>
      <p className="muted" style={{ margin: 0 }}>
        {labels.hint}
      </p>
      <label className="row" style={{ gap: "0.5rem" }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => void save(e.target.checked)}
        />
        <span>{labels.title}</span>
      </label>
      {status ? (
        <p className="muted" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
