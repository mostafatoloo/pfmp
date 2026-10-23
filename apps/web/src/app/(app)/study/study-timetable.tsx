"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const DAYS = [
  { js: 6, label: "Saturday", school: true },
  { js: 0, label: "Sunday", school: true },
  { js: 1, label: "Monday", school: true },
  { js: 2, label: "Tuesday", school: true },
  { js: 3, label: "Wednesday", school: true },
  { js: 4, label: "Thursday", school: true },
  { js: 5, label: "Friday", school: false },
] as const;

const KIND_LABEL: Record<string, string> = {
  school_class: "School class",
  study_session: "After-school study",
  other_class: "Other class",
};

export type TimetableSlotDto = {
  id: string;
  kind: string;
  title: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  classType: string | null;
};

function fmt(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTime(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function StudyTimetable({ initialSlots }: { initialSlots: TimetableSlotDto[] }) {
  const router = useRouter();
  const [slots, setSlots] = useState(initialSlots);
  const [kind, setKind] = useState<"school_class" | "study_session" | "other_class">("school_class");
  const [title, setTitle] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(6);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:30");
  const [classType, setClassType] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<number, TimetableSlotDto[]>();
    for (const d of DAYS) map.set(d.js, []);
    for (const s of slots) {
      const list = map.get(s.dayOfWeek) ?? [];
      list.push(s);
      map.set(s.dayOfWeek, list);
    }
    for (const [, list] of map) list.sort((a, b) => a.startMinutes - b.startMinutes);
    return map;
  }, [slots]);

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title,
          dayOfWeek,
          startMinutes: parseTime(start),
          endMinutes: parseTime(end),
          classType: kind === "other_class" ? classType || null : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed");
        return;
      }
      setSlots((prev) => [...prev, json.data]);
      setTitle("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeSlot(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/v1/timetable/${id}`, { method: "DELETE" });
      setSlots((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <form onSubmit={addSlot} className="card stack">
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Add to weekly plan</h2>
        <div className="row">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            style={selectStyle}
          >
            <option value="school_class">School class</option>
            <option value="study_session">After-school study</option>
            <option value="other_class">Other class</option>
          </select>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            style={selectStyle}
          >
            {DAYS.map((d) => (
              <option key={d.js} value={d.js}>
                {d.label}
                {d.school ? "" : " (non-school)"}
              </option>
            ))}
          </select>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} required style={inputStyle} />
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required style={inputStyle} />
        </div>
        <div className="row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Math, Chemistry review)"
            required
            style={{ ...inputStyle, flex: "1 1 200px" }}
          />
          {kind === "other_class" ? (
            <input
              value={classType}
              onChange={(e) => setClassType(e.target.value)}
              placeholder="Class type (music, language…)"
              style={{ ...inputStyle, flex: "1 1 160px" }}
            />
          ) : null}
          <button className="btn" type="submit" disabled={busy || !title.trim()}>
            Add
          </button>
        </div>
        {error ? (
          <p className="muted" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <div className="stack">
        {DAYS.map((day) => {
          const list = byDay.get(day.js) ?? [];
          return (
            <div
              key={day.js}
              className="card stack"
              style={{
                borderInlineStart: day.school
                  ? "4px solid var(--brand)"
                  : "4px solid var(--line-strong)",
              }}
            >
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{day.label}</strong>
                <span className={`badge ${day.school ? "brand" : ""}`}>
                  {day.school ? "School day" : "Non-school day"}
                </span>
              </div>
              {list.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  No entries — free for planning.
                </p>
              ) : (
                <ul className="list-plain">
                  {list.map((s) => (
                    <li key={s.id} className="list-item">
                      <div>
                        <strong>{s.title}</strong>
                        <div className="muted" style={{ fontSize: "0.85rem" }}>
                          {fmt(s.startMinutes)}–{fmt(s.endMinutes)} · {KIND_LABEL[s.kind] ?? s.kind}
                          {s.classType ? ` · ${s.classType}` : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn ghost sm"
                        disabled={busy}
                        onClick={() => void removeSlot(s.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  minHeight: "var(--touch-min)",
  paddingInline: "0.75rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--line-strong)",
  font: "inherit",
};

const selectStyle = inputStyle;
