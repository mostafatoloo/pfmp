"use client";

import { useMemo, useState } from "react";
import { useT } from "@pfmp/i18n/react";
import type { CalendarEvent } from "./jalali-year-calendar";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeek(d: Date, weekStartsOn: 1 | 6) {
  const day = d.getDay(); // 0 Sun … 6 Sat
  const diff = weekStartsOn === 1 ? (day + 6) % 7 : (day + 1) % 7;
  const out = new Date(d);
  out.setDate(d.getDate() - diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

function eventsForDay(events: CalendarEvent[], key: string) {
  return events.filter((e) => e.dayKey === key);
}

export function GregoryYearCalendar({
  events,
  initialYear,
  weekStartsOn = 6,
}: {
  events: CalendarEvent[];
  initialYear?: number;
  weekStartsOn?: 1 | 6;
}) {
  const t = useT();
  const [year, setYear] = useState(initialYear ?? new Date().getFullYear());
  const [openMonths, setOpenMonths] = useState<Record<number, boolean>>({
    [new Date().getMonth()]: true,
  });

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

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 0);
      const gridStart = startOfWeek(monthStart, weekStartsOn);
      const gridEnd = startOfWeek(monthEnd, weekStartsOn);
      gridEnd.setDate(gridEnd.getDate() + 6);
      const days: Date[] = [];
      for (let cur = new Date(gridStart); cur <= gridEnd; cur.setDate(cur.getDate() + 1)) {
        days.push(new Date(cur));
      }
      const weeks: { weekIndex: number; days: Date[] }[] = [];
      for (let i = 0; i < days.length; i += 7) {
        weeks.push({ weekIndex: weeks.length, days: days.slice(i, i + 7) });
      }
      return { monthIndex, weeks };
    });
  }, [year, weekStartsOn]);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button type="button" className="btn secondary sm" onClick={() => setYear((y) => y - 1)}>
          ← {year - 1}
        </button>
        <h2 style={{ margin: 0, fontSize: "1.15rem" }}>
          {t("settings.calendarGregory")} {year}
        </h2>
        <button type="button" className="btn secondary sm" onClick={() => setYear((y) => y + 1)}>
          {year + 1} →
        </button>
      </div>
      {months.map((m) => {
        const expanded = Boolean(openMonths[m.monthIndex]);
        let count = 0;
        for (const w of m.weeks) {
          for (const d of w.days) {
            if (d.getMonth() !== m.monthIndex) continue;
            count += eventsForDay(events, dayKey(d)).length;
          }
        }
        return (
          <div key={m.monthIndex} className="card stack content-dir" style={{ gap: "0.75rem" }}>
            <button
              type="button"
              className="row"
              onClick={() =>
                setOpenMonths((prev) => ({ ...prev, [m.monthIndex]: !expanded }))
              }
              style={{
                width: "100%",
                justifyContent: "space-between",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                font: "inherit",
                textAlign: "start",
              }}
            >
              <span>
                <strong>
                  {t(`calendar.monthGreg${m.monthIndex}` as "calendar.monthGreg0")} {year}
                </strong>
                {count > 0 ? (
                  <span className="badge brand" style={{ marginInlineStart: "0.5rem" }}>
                    {t("calendar.itemsCount", { count })}
                  </span>
                ) : null}
              </span>
              <span className="muted">{expanded ? "▾" : "▸"}</span>
            </button>
            {expanded ? (
              <div className="stack" style={{ gap: "0.75rem" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    gap: "0.25rem",
                    fontSize: "0.75rem",
                    color: "var(--muted)",
                    textAlign: "center",
                  }}
                >
                  {weekdayLabels.map((label) => (
                    <div key={label}>{label}</div>
                  ))}
                </div>
                {m.weeks.map((week) => (
                  <div
                    key={week.weekIndex}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                      gap: "0.25rem",
                    }}
                  >
                    {week.days.map((d) => {
                      const inMonth = d.getMonth() === m.monthIndex;
                      const key = dayKey(d);
                      const dayEvents = inMonth ? eventsForDay(events, key) : [];
                      return (
                        <div
                          key={key}
                          style={{
                            minHeight: "3.25rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--line)",
                            padding: "0.35rem",
                            background: inMonth
                              ? dayEvents.length
                                ? "var(--brand-soft)"
                                : "var(--bg-elevated)"
                              : "var(--bg-muted)",
                            opacity: inMonth ? 1 : 0.45,
                            fontSize: "0.8rem",
                          }}
                          title={dayEvents.map((e) => e.title).join(", ")}
                        >
                          <div style={{ fontWeight: 600 }}>{inMonth ? d.getDate() : ""}</div>
                          {dayEvents.slice(0, 2).map((e) => (
                            <div key={e.id} className="user-text muted" style={{ fontSize: "0.65rem" }}>
                              {e.title}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
