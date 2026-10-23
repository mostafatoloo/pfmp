"use client";

import { useEffect, useState } from "react";

type FamilySummary = {
  workspaces: { id: string; name: string; role: string }[];
  pendingInvites: { id: string; workspaceName: string; email: string }[];
};

export function FamilyClient({
  labels,
}: {
  labels: Record<string, string>;
}) {
  const [data, setData] = useState<FamilySummary | null>(null);
  const [name, setName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/family");
    if (!res.ok) {
      setData({ workspaces: [], pendingInvites: [] });
      return;
    }
    const json = await res.json();
    setData(json.data ?? { workspaces: [], pendingInvites: [] });
  }

  useEffect(() => {
    void load();
  }, []);

  async function createFamily(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed");
        return;
      }
      setName("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/family/${activeId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed");
        return;
      }
      setInviteEmail("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function respond(inviteId: string, action: "accept" | "decline") {
    setBusy(true);
    try {
      await fetch(`/api/v1/family/invites/${inviteId}/${action}`, { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const families = data?.workspaces ?? [];

  return (
    <div className="stack">
      {error ? (
        <div className="alert error" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={createFamily} className="card stack">
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{labels.createWorkspace}</h2>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="family-name">{labels.workspaceName}</label>
          <input
            id="family-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <button className="btn" type="submit" disabled={busy || !name.trim()}>
          {labels.createWorkspace}
        </button>
      </form>

      {families.length === 0 ? (
        <div className="empty-state">{labels.noFamily}</div>
      ) : (
        <div className="card stack">
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{labels.overview}</h2>
          <ul className="list-plain">
            {families.map((ws) => (
              <li key={ws.id} className="list-item">
                <span>
                  <strong>{ws.name}</strong> <span className="badge">{ws.role}</span>
                </span>
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={() => setActiveId(ws.id)}
                >
                  {labels.invite}
                </button>
              </li>
            ))}
          </ul>
          {activeId ? (
            <form onSubmit={invite} className="row">
              <input
                type="email"
                placeholder={labels.inviteEmail}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                style={{
                  flex: "1 1 200px",
                  minHeight: "var(--touch-min)",
                  paddingInline: "0.85rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--line-strong)",
                  font: "inherit",
                }}
              />
              <button className="btn" type="submit" disabled={busy}>
                {labels.invite}
              </button>
            </form>
          ) : null}
        </div>
      )}

      {(data?.pendingInvites?.length ?? 0) > 0 ? (
        <div className="card stack">
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{labels.pendingInvites}</h2>
          <ul className="list-plain">
            {data!.pendingInvites.map((inv) => (
              <li key={inv.id} className="list-item">
                <span>{inv.workspaceName}</span>
                <div className="row">
                  <button
                    type="button"
                    className="btn sm"
                    disabled={busy}
                    onClick={() => void respond(inv.id, "accept")}
                  >
                    {labels.accept}
                  </button>
                  <button
                    type="button"
                    className="btn secondary sm"
                    disabled={busy}
                    onClick={() => void respond(inv.id, "decline")}
                  >
                    {labels.decline}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
