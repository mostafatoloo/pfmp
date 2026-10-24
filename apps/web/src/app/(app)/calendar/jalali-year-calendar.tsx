"use client";

import { useEffect, useMemo, useState } from "react";
import { getMonth, getYear } from "date-fns-jalali";
import {
  buildJalaliYear,
  currentJalaliYear,
  jalaliKey,
  type JalaliMonthBlock,
} from "@pfmp/calendar";
import { useT } from "@pfmp/i18n/react";

export type CalendarEvent = {
  id: string;
  kind: string;
  title: string;
  dayKey: string;
};

function eventsForDay(events: CalendarEvent[], dayKey: string) {
  return events.filter((e) => e.dayKey === dayKey);
}

function MonthCard({
  month,
  events,
  expanded,
  onToggle,
  weekdayLabels,
}: {
  month: JalaliMonthBlock;
  events: CalendarEvent[];
  expanded: boolean;
  onToggle: () => void;
  weekdayLabels: string[];
}) {
  const t = useT();
  const monthEventCount = useMemo(() => {
    let n = 0;
    for (const w of month.weeks) {
      for (const d of w.days) {
        if (!d.inMonth) continue;
        n += eventsForDay(events, jalaliKey(d.date)).length;
      }
    }
    return n;
  }, [month, events]);

  return (
    <div className="card stack content-dir" style={{ gap: "0.75rem" }}>
      <button
        type="button"
        className="row"
        onClick={onToggle}
        aria-expanded={expanded}
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
            {t(`calendar.monthJalali${month.monthIndex}` as "calendar.monthJalali0")} {month.year}
          </strong>
          {monthEventCount > 0 ? (
            <span className="badge brand" style={{ marginInlineStart: "0.5rem" }}>
              {t("calendar.itemsCount", { count: monthEventCount })}
            </span>
          ) : null}
        </span>
        <span className="muted" aria-hidden>
          {expanded ? "▾" : "▸"}
        </span>
      </button>

      {expanded ? (
        <div className="stack" style={{ gap: "1rem" }}>
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
            {weekdayLabels.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {month.weeks.map((week) => {
            const weekItems = week.days.flatMap((d) => {
              if (!d.inMonth) return [];
              const key = jalaliKey(d.date);
              return eventsForDay(events, key).map((e) => ({
                day: d.jalaliDay,
                label: e.title,
                kind: e.kind,
              }));
            });

            return (
              <div key={week.weekIndex} className="stack" style={{ gap: "0.5rem" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    gap: "0.25rem",
                  }}
                >
                  {week.days.map((d) => {
                    const key = jalaliKey(d.date);
                    const dayEvents = d.inMonth ? eventsForDay(events, key) : [];
                    const busy = dayEvents.length;
                    return (
                      <div
                        key={key + String(d.inMonth)}
                        style={{
                          minHeight: "3.25rem",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--line)",
                          padding: "0.35rem",
                          background: d.inMonth
                            ? busy
                              ? "var(--brand-soft)"
                              : "var(--bg-elevated)"
                            : "var(--bg-muted)",
                          opacity: d.inMonth ? 1 : 0.45,
                          fontSize: "0.8rem",
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{d.inMonth ? d.jalaliDay : ""}</div>
                        {busy > 0 ? (
                          <div className="muted" style={{ fontSize: "0.65rem" }}>
                            {busy}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {weekItems.length > 0 ? (
                  <ul className="list-plain" style={{ gap: "0.35rem" }}>
                    {weekItems.map((item, i) => (
                      <li
                        key={`${item.day}-${item.label}-${i}`}
                        className="muted user-text"
                        style={{ fontSize: "0.85rem" }}
                      >
                        <span className="badge">{item.day}</span> {item.label}{" "}
                        <span className="badge">
                          {item.kind === "reminder" ? t("calendar.reminder") : item.kind}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function JalaliYearCalendar({
  events,
  initialYear,
  weekStartsOn = 6,
}: {
  events: CalendarEvent[];
  initialYear?: number;
  weekStartsOn?: 1 | 6;
}) {
  const t = useT();
  const [year, setYear] = useState(initialYear ?? currentJalaliYear());
  const [openMonths, setOpenMonths] = useState<Record<number, boolean>>({});

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

  useEffect(() => {
    if (year === getYear(new Date())) {
      setOpenMonths({ [getMonth(new Date())]: true });
    } else {
      setOpenMonths({ 0: true });
    }
  }, [year]);

  const months = useMemo(() => buildJalaliYear(year, weekStartsOn), [year, weekStartsOn]);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button type="button" className="btn secondary sm" onClick={() => setYear((y) => y - 1)}>
          ← {year - 1}
        </button>
        <h2 style={{ margin: 0, fontSize: "1.15rem" }}>
          {t("settings.calendarPersian")} {year}
        </h2>
        <button type="button" className="btn secondary sm" onClick={() => setYear((y) => y + 1)}>
          {year + 1} →
        </button>
      </div>
      {months.map((m) => {
        const expanded = Boolean(openMonths[m.monthIndex]);
        return (
          <MonthCard
            key={`${m.year}-${m.monthIndex}`}
            month={m}
            events={events}
            expanded={expanded}
            weekdayLabels={weekdayLabels}
            onToggle={() =>
              setOpenMonths((prev) => ({
                ...prev,
                [m.monthIndex]: !expanded,
              }))
            }
          />
        );
      })}
    </div>
  );
}
