"use client";

import { useMemo, useState } from "react";
import {
  WEEK_DAYS,
  minutesToTimeInput,
  parseTimeInput,
  schoolDaysForPattern,
  type SchoolWeekPattern,
  type StudySettingsDto,
} from "./study-types";

type Props = {
  settings: StudySettingsDto;
  busy?: boolean;
  onSaveSettings: (patch: Partial<StudySettingsDto>) => Promise<void>;
  onApplySchoolDay: (dayOfWeek: number, subjects: string[]) => Promise<void>;
};

export function StudySchoolSetup({
  settings,
  busy,
  onSaveSettings,
  onApplySchoolDay,
}: Props) {
  const [schoolStart, setSchoolStart] = useState(minutesToTimeInput(settings.schoolStartMinutes));
  const [schoolEnd, setSchoolEnd] = useState(minutesToTimeInput(settings.schoolEndMinutes));
  const [pattern, setPattern] = useState<SchoolWeekPattern>(settings.schoolWeekPattern);
  const [columns, setColumns] = useState(settings.defaultColumnCount);
  const [daySubjects, setDaySubjects] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const schoolDays = useMemo(() => schoolDaysForPattern(pattern), [pattern]);

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    await onSaveSettings({
      schoolStartMinutes: parseTimeInput(schoolStart),
      schoolEndMinutes: parseTimeInput(schoolEnd),
      schoolWeekPattern: pattern,
      defaultColumnCount: columns,
    });
    setMessage("School preferences saved.");
  }

  return (
    <section className="study-school card stack">
      <div>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>School schedule</h2>
        <p className="muted" style={{ margin: "0.35rem 0 0" }}>
          Set school hours and week pattern, then enter each school day as a list of subjects
          (for example: Calculus, Physics, Calculus, History). Subjects split the school window
          evenly. Remaining empty time on the grid stays free for study and other activities.
        </p>
      </div>

      <form onSubmit={(e) => void savePrefs(e)} className="stack">
        <div className="row study-school__prefs">
          <label className="study-inline-field">
            <span>Starts</span>
            <input
              type="time"
              value={schoolStart}
              onChange={(e) => setSchoolStart(e.target.value)}
              required
            />
          </label>
          <label className="study-inline-field">
            <span>Ends</span>
            <input
              type="time"
              value={schoolEnd}
              onChange={(e) => setSchoolEnd(e.target.value)}
              required
            />
          </label>
          <label className="study-inline-field">
            <span>School week</span>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value as SchoolWeekPattern)}
            >
              <option value="sat_thu">Saturday – Thursday</option>
              <option value="sat_wed">Saturday – Wednesday</option>
            </select>
          </label>
          <label className="study-inline-field">
            <span>Default blocks</span>
            <input
              type="number"
              min={1}
              max={16}
              value={columns}
              onChange={(e) => setColumns(Number(e.target.value) || 7)}
              title="Default number of equal time blocks when adding on empty space (not fixed columns)"
            />
          </label>
          <button type="submit" className="btn secondary" disabled={busy}>
            Save preferences
          </button>
        </div>
      </form>

      <div className="study-school__days content-dir stack">
        {WEEK_DAYS.filter((d) => schoolDays.has(d.js)).map((day) => (
          <div key={day.js} className="study-school__day-row">
            <strong className="study-school__day-name">{day.label}</strong>
            <input
              value={daySubjects[day.js] ?? ""}
              onChange={(e) =>
                setDaySubjects((prev) => ({ ...prev, [day.js]: e.target.value }))
              }
              placeholder="Calculus, Physics, Calculus, History"
              aria-label={`${day.label} subjects`}
            />
            <button
              type="button"
              className="btn sm"
              disabled={busy || !(daySubjects[day.js] ?? "").trim()}
              onClick={() => {
                const subjects = (daySubjects[day.js] ?? "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                void onApplySchoolDay(day.js, subjects).then(() =>
                  setMessage(`${day.label} school timetable applied.`),
                );
              }}
            >
              Apply
            </button>
          </div>
        ))}
      </div>

      {message ? <p className="muted" style={{ margin: 0 }}>{message}</p> : null}
    </section>
  );
}
