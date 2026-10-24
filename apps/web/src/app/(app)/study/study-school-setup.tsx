"use client";

import { useMemo, useState } from "react";
import { useT } from "@pfmp/i18n/react";
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
  const t = useT();
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
    setMessage(t("settings.prefsSaved"));
  }

  return (
    <section className="study-school card stack">
      <div>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{t("study.schoolSchedule")}</h2>
        <p className="muted" style={{ margin: "0.35rem 0 0" }}>
          {t("study.schoolLead")}
        </p>
      </div>

      <form onSubmit={(e) => void savePrefs(e)} className="stack">
        <div className="row study-school__prefs">
          <label className="study-inline-field">
            <span>{t("study.starts")}</span>
            <input
              type="time"
              value={schoolStart}
              onChange={(e) => setSchoolStart(e.target.value)}
              required
            />
          </label>
          <label className="study-inline-field">
            <span>{t("study.ends")}</span>
            <input
              type="time"
              value={schoolEnd}
              onChange={(e) => setSchoolEnd(e.target.value)}
              required
            />
          </label>
          <label className="study-inline-field">
            <span>{t("study.schoolWeek")}</span>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value as SchoolWeekPattern)}
            >
              <option value="sat_thu">{t("study.schoolWeekSatThu")}</option>
              <option value="sat_wed">{t("study.schoolWeekSatWed")}</option>
            </select>
          </label>
          <label className="study-inline-field">
            <span>{t("study.defaultBlocks")}</span>
            <input
              type="number"
              min={1}
              max={16}
              value={columns}
              onChange={(e) => setColumns(Number(e.target.value) || 7)}
            />
          </label>
          <button type="submit" className="btn secondary" disabled={busy}>
            {t("study.savePreferences")}
          </button>
        </div>
      </form>

      <div className="study-school__days content-dir stack">
        {WEEK_DAYS.filter((d) => schoolDays.has(d.js)).map((day) => (
          <div key={day.js} className="study-school__day-row">
            <strong className="study-school__day-name">{t(day.labelKey)}</strong>
            <input
              value={daySubjects[day.js] ?? ""}
              onChange={(e) =>
                setDaySubjects((prev) => ({ ...prev, [day.js]: e.target.value }))
              }
              placeholder={t("study.subjectsExample")}
              aria-label={t(day.labelKey)}
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
                  setMessage(t("settings.prefsSaved")),
                );
              }}
            >
              {t("study.apply")}
            </button>
          </div>
        ))}
      </div>

      {message ? <p className="muted" style={{ margin: 0 }}>{message}</p> : null}
    </section>
  );
}
