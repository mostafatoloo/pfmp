"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { format as formatJalali, getMonth, getYear } from "date-fns-jalali";
import { buildJalaliMonth } from "@pfmp/calendar";
import { useT } from "@pfmp/i18n/react";
import { useUserPrefs } from "./user-prefs";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Parse local Gregorian `yyyy-MM-dd` to Date at local noon. */
export function parseIsoDateLocal(iso: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toIsoDateLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function splitDateTimeLocal(value: string): { date: string; time: string } {
  if (!value) return { date: "", time: "00:00" };
  const [date, timePart] = value.split("T");
  return { date: date ?? "", time: (timePart ?? "00:00").slice(0, 5) };
}

function joinDateTimeLocal(date: string, time: string): string {
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
}

const fieldStyle: React.CSSProperties = {
  minHeight: "var(--touch-min)",
  paddingInline: "0.75rem",
  border: "1px solid var(--line-strong)",
  borderRadius: "var(--radius-md)",
  font: "inherit",
  background: "var(--surface, #fff)",
  cursor: "pointer",
  textAlign: "start",
};

export function DateField({
  value,
  onChange,
  id,
  "aria-label": ariaLabel,
  title,
  required,
  disabled,
  allowClear = false,
  style,
}: {
  value: string;
  onChange: (next: string) => void;
  id?: string;
  "aria-label"?: string;
  title?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  style?: React.CSSProperties;
}) {
  const { calendarSystem } = useUserPrefs();
  if (calendarSystem === "gregory") {
    return (
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        title={title}
        required={required}
        disabled={disabled}
        style={{ ...fieldStyle, ...style }}
      />
    );
  }
  return (
    <ShamsiDatePicker
      value={value}
      onChange={onChange}
      id={id}
      aria-label={ariaLabel}
      title={title}
      required={required}
      disabled={disabled}
      allowClear={allowClear}
      style={style}
    />
  );
}

export function DateTimeField({
  value,
  onChange,
  id,
  "aria-label": ariaLabel,
  required,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  id?: string;
  "aria-label"?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const t = useT();
  const { calendarSystem } = useUserPrefs();
  const { date, time } = splitDateTimeLocal(value);

  if (calendarSystem === "gregory") {
    return (
      <input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        required={required}
        disabled={disabled}
        style={fieldStyle}
      />
    );
  }

  return (
    <div className="row" style={{ alignItems: "stretch", flexWrap: "wrap" }}>
      <ShamsiDatePicker
        value={date}
        onChange={(nextDate) => onChange(joinDateTimeLocal(nextDate, time))}
        id={id}
        aria-label={ariaLabel ?? t("calendar.pickDateTime")}
        required={required}
        disabled={disabled}
      />
      <input
        type="time"
        value={time}
        onChange={(e) => onChange(joinDateTimeLocal(date, e.target.value))}
        aria-label={t("time.duration")}
        required={required}
        disabled={disabled || !date}
        style={fieldStyle}
      />
    </div>
  );
}

function ShamsiDatePicker({
  value,
  onChange,
  id,
  "aria-label": ariaLabel,
  title,
  required,
  disabled,
  allowClear = false,
  style,
}: {
  value: string;
  onChange: (next: string) => void;
  id?: string;
  "aria-label"?: string;
  title?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  style?: React.CSSProperties;
}) {
  const t = useT();
  const { weekStartsOn } = useUserPrefs();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = parseIsoDateLocal(value);
  const [viewYear, setViewYear] = useState(() => getYear(selected ?? new Date()));
  const [viewMonth, setViewMonth] = useState(() => getMonth(selected ?? new Date()));

  useEffect(() => {
    if (!selected) return;
    setViewYear(getYear(selected));
    setViewMonth(getMonth(selected));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps -- sync when value string changes

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const month = useMemo(
    () => buildJalaliMonth(viewYear, viewMonth, weekStartsOn === 1 ? 1 : 6),
    [viewYear, viewMonth, weekStartsOn],
  );

  const monthLabel = t(`calendar.monthJalali${viewMonth}` as "calendar.monthJalali0");

  const weekdayLabels =
    weekStartsOn === 1
      ? [
          t("common.weekdayMonShort"),
          t("common.weekdayTueShort"),
          t("common.weekdayWedShort"),
          t("common.weekdayThuShort"),
          t("common.weekdayFriShort"),
          t("common.weekdaySatShort"),
          t("common.weekdaySunShort"),
        ]
      : [
          t("common.weekdaySatShort"),
          t("common.weekdaySunShort"),
          t("common.weekdayMonShort"),
          t("common.weekdayTueShort"),
          t("common.weekdayWedShort"),
          t("common.weekdayThuShort"),
          t("common.weekdayFriShort"),
        ];

  function shiftMonth(delta: number) {
    const next = viewMonth + delta;
    if (next < 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else if (next > 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(next);
    }
  }

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-block", ...style }}>
      <button
        id={id}
        type="button"
        className="btn secondary"
        disabled={disabled}
        aria-label={ariaLabel ?? t("calendar.pickDate")}
        title={title}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        style={{ ...fieldStyle, width: "100%", minWidth: "10rem" }}
      >
        <span className="bidi-isolate">
          {selected ? formatJalali(selected, "yyyy/MM/dd") : t("calendar.pickDate")}
        </span>
      </button>
      {required ? (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => undefined}
          style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1 }}
        />
      ) : null}

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={t("calendar.pickDate")}
          className="card stack"
          style={{
            position: "absolute",
            zIndex: 40,
            insetInlineStart: 0,
            marginBlockStart: "0.35rem",
            minWidth: "17rem",
            padding: "0.75rem",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              className="btn ghost sm"
              aria-label={t("calendar.prevMonth")}
              onClick={() => shiftMonth(-1)}
            >
              ‹
            </button>
            <strong>
              {monthLabel} {viewYear}
            </strong>
            <button
              type="button"
              className="btn ghost sm"
              aria-label={t("calendar.nextMonth")}
              onClick={() => shiftMonth(1)}
            >
              ›
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: "0.2rem",
              fontSize: "0.75rem",
              color: "var(--muted)",
              textAlign: "center",
            }}
          >
            {weekdayLabels.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {month.weeks.map((week) => (
            <div
              key={week.weekIndex}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: "0.2rem",
              }}
            >
              {week.days.map((day) => {
                const iso = toIsoDateLocal(day.date);
                const isSelected = value === iso;
                return (
                  <button
                    key={iso + String(day.inMonth)}
                    type="button"
                    disabled={!day.inMonth}
                    className={`btn sm ${isSelected ? "" : "ghost"}`}
                    style={{
                      minHeight: "2rem",
                      padding: 0,
                      opacity: day.inMonth ? 1 : 0.25,
                      fontVariantNumeric: "tabular-nums",
                    }}
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                  >
                    {day.jalaliDay}
                  </button>
                );
              })}
            </div>
          ))}

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button
              type="button"
              className="btn secondary sm"
              onClick={() => {
                const today = new Date();
                onChange(toIsoDateLocal(today));
                setViewYear(getYear(today));
                setViewMonth(getMonth(today));
                setOpen(false);
              }}
            >
              {t("calendar.today")}
            </button>
            {allowClear ? (
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                {t("calendar.clearDate")}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
