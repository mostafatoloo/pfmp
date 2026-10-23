"use client";

import { useEffect, useState } from "react";

export function TelegramLinkPanel({
  labels,
}: {
  labels: {
    title: string;
    hint: string;
    link: string;
    unlink: string;
    linked: string;
    notLinked: string;
  };
}) {
  const [status, setStatus] = useState<"unknown" | "linked" | "unlinked">("unknown");
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/v1/telegram/status");
    if (!res.ok) {
      setStatus("unlinked");
      return;
    }
    const data = (await res.json()) as { data?: { linked?: boolean } };
    setStatus(data.data?.linked ? "linked" : "unlinked");
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function startLink() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/telegram/link-token", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error?.message ?? "Unavailable");
        return;
      }
      setToken(data.data?.token ?? null);
      setMessage(data.data?.instructions ?? "Send the token to the bot with /start");
    } finally {
      setBusy(false);
    }
  }

  async function unlink() {
    setBusy(true);
    try {
      await fetch("/api/v1/telegram/unlink", { method: "POST" });
      setToken(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card stack">
      <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{labels.title}</h2>
      <p className="muted" style={{ margin: 0 }}>
        {labels.hint}
      </p>
      <p>
        <span className={`badge ${status === "linked" ? "success" : ""}`}>
          {status === "linked" ? labels.linked : labels.notLinked}
        </span>
      </p>
      <div className="row">
        {status !== "linked" ? (
          <button className="btn" type="button" disabled={busy} onClick={() => void startLink()}>
            {labels.link}
          </button>
        ) : (
          <button className="btn danger" type="button" disabled={busy} onClick={() => void unlink()}>
            {labels.unlink}
          </button>
        )}
      </div>
      {token ? (
        <p className="bidi-isolate">
          <code>{token}</code>
        </p>
      ) : null}
      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
