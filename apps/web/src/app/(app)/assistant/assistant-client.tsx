"use client";

import { useState } from "react";

type Message = { role: "user" | "assistant"; content: string; kind?: "verified" | "suggestion" };

export function AssistantClient({ labels }: { labels: Record<string, string> }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [proposal, setProposal] = useState<{ id: string; summary: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? labels.unavailable);
        return;
      }
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: json.data?.reply ?? "",
          kind: json.data?.kind === "suggestion" ? "suggestion" : "verified",
        },
      ]);
      if (json.data?.proposal) {
        setProposal(json.data.proposal);
      }
    } finally {
      setBusy(false);
    }
  }

  async function resolveProposal(action: "accept" | "reject") {
    if (!proposal) return;
    setBusy(true);
    try {
      await fetch(`/api/v1/assistant/proposals/${proposal.id}/${action}`, { method: "POST" });
      setProposal(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      {messages.length === 0 ? <div className="empty-state">{labels.empty}</div> : null}
      <ul className="list-plain">
        {messages.map((m, i) => (
          <li key={`${m.role}-${i}`} className="list-item" style={{ alignItems: "flex-start" }}>
            <div>
              {m.role === "assistant" && m.kind ? (
                <span className={`badge ${m.kind === "verified" ? "success" : "brand"}`}>
                  {m.kind === "verified" ? labels.verifiedData : labels.suggestion}
                </span>
              ) : null}
              <p style={{ margin: "0.35rem 0 0", whiteSpace: "pre-wrap" }}>{m.content}</p>
            </div>
          </li>
        ))}
      </ul>

      {proposal ? (
        <div className="card stack">
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{labels.proposalPreview}</h2>
          <p style={{ margin: 0 }}>{proposal.summary}</p>
          <div className="row">
            <button className="btn" type="button" disabled={busy} onClick={() => void resolveProposal("accept")}>
              {labels.acceptProposal}
            </button>
            <button
              className="btn secondary"
              type="button"
              disabled={busy}
              onClick={() => void resolveProposal("reject")}
            >
              {labels.rejectProposal}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="alert error" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={send} className="row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={labels.placeholder}
          aria-label={labels.placeholder}
          style={{
            flex: "1 1 240px",
            minHeight: "var(--touch-min)",
            paddingInline: "0.85rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--line-strong)",
            font: "inherit",
          }}
        />
        <button className="btn" type="submit" disabled={busy || !input.trim()}>
          {labels.send}
        </button>
      </form>
    </div>
  );
}
