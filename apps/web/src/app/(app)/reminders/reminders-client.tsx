"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useT } from "@pfmp/i18n/react";
import { DateTimeField } from "@/components/date-field";

export type ReminderDto = {
  id: string;
  title: string;
  notes: string | null;
  remindAtUtc: string;
};

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value: string) {
  return new Date(value).toISOString();
}

export function RemindersClient({ initial }: { initial: ReminderDto[] }) {
  const t = useT();
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [when, setWhen] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setMinutes(0, 0, 0);
    return toLocalInputValue(d.toISOString());
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up: ReminderDto[] = [];
    const pa: ReminderDto[] = [];
    for (const r of items) {
      (new Date(r.remindAtUtc).getTime() >= now ? up : pa).push(r);
    }
    return { upcoming: up, past: pa };
  }, [items]);

  async function addReminder(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          notes: notes.trim() || null,
          remindAtUtc: fromLocalInputValue(when),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed");
        return;
      }
      setItems((prev) => [...prev, json.data].sort((a, b) => a.remindAtUtc.localeCompare(b.remindAtUtc)));
      setTitle("");
      setNotes("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/v1/reminders/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function List({ rows, heading }: { rows: ReminderDto[]; heading: string }) {
    if (rows.length === 0) return null;
    return (
      <div className="stack">
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{heading}</h2>
        <ul className="list-plain content-dir">
          {rows.map((r) => (
            <li key={r.id} className="list-item">
              <div>
                <strong className="user-text">{r.title}</strong>
                <div className="muted" style={{ fontSize: "0.85rem" }}>
                  {new Date(r.remindAtUtc).toLocaleString()}
                </div>
                {r.notes ? (
                  <div className="user-text muted" style={{ fontSize: "0.85rem" }}>
                    {r.notes}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="btn ghost sm"
                disabled={busy}
                onClick={() => void remove(r.id)}
              >
                {t("reminders.delete")}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="stack">
      <form onSubmit={(e) => void addReminder(e)} className="card stack">
        <div className="field">
          <label htmlFor="reminder-title">{t("reminders.titleLabel")}</label>
          <input
            id="reminder-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("reminders.titlePlaceholder")}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="reminder-when">{t("reminders.whenLabel")}</label>
          <DateTimeField
            id="reminder-when"
            value={when}
            onChange={setWhen}
            aria-label={t("reminders.whenLabel")}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="reminder-notes">{t("reminders.notesLabel")}</label>
          <textarea
            id="reminder-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("reminders.notesPlaceholder")}
            rows={2}
          />
        </div>
        {error ? (
          <p className="muted" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn" type="submit" disabled={busy || !title.trim()}>
          {t("reminders.add")}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="muted">{t("reminders.empty")}</p>
      ) : (
        <>
          <List rows={upcoming} heading={t("reminders.upcoming")} />
          <List rows={past} heading={t("reminders.past")} />
        </>
      )}
    </div>
  );
}
