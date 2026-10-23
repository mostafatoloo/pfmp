"use client";

import { useEffect, useMemo, useState } from "react";
import { getMonth, getYear } from "date-fns-jalali";
import {
  IR_WEEKDAY_LABELS,
  buildJalaliYear,
  currentJalaliYear,
  jalaliKey,
  occasionsForDay,
  type JalaliMonthBlock,
} from "@pfmp/calendar";

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
}: {
  month: JalaliMonthBlock;
  events: CalendarEvent[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const monthEventCount = useMemo(() => {
    let n = 0;
    for (const w of month.weeks) {
      for (const d of w.days) {
        if (!d.inMonth) continue;
        n += eventsForDay(events, jalaliKey(d.date)).length;
        n += occasionsForDay(d.jalaliMonth, d.jalaliDay).length;
      }
    }
    return n;
  }, [month, events]);

  return (
    <div className="card stack" style={{ gap: "0.75rem" }}>
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
            {month.monthName} {month.year}
          </strong>
          {monthEventCount > 0 ? (
            <span className="badge brand" style={{ marginInlineStart: "0.5rem" }}>
              {monthEventCount} items
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
            {IR_WEEKDAY_LABELS.map((d) => (
              <div key={d}>{d.slice(0, 3)}</div>
            ))}
          </div>

          {month.weeks.map((week) => {
            const weekItems = week.days.flatMap((d) => {
              if (!d.inMonth) return [];
              const key = jalaliKey(d.date);
              return [
                ...occasionsForDay(d.jalaliMonth, d.jalaliDay).map((o) => ({
                  day: d.jalaliDay,
                  label: o.title,
                  kind: "occasion",
                })),
                ...eventsForDay(events, key).map((e) => ({
                  day: d.jalaliDay,
                  label: e.title,
                  kind: e.kind,
                })),
              ];
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
                    const occasions = d.inMonth
                      ? occasionsForDay(d.jalaliMonth, d.jalaliDay)
                      : [];
                    const busy = dayEvents.length + occasions.length;
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
                            {busy} prep
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {weekItems.length > 0 ? (
                  <div
                    style={{
                      borderInlineStart: "3px solid var(--brand)",
                      paddingInlineStart: "0.75rem",
                    }}
                  >
                    <div className="muted" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                      Week {week.weekIndex + 1} schedule
                    </div>
                    <ul className="list-plain" style={{ gap: "0.35rem" }}>
                      {weekItems.map((item, i) => (
                        <li
                          key={`${item.day}-${item.label}-${i}`}
                          className="muted"
                          style={{ fontSize: "0.85rem" }}
                        >
                          <span className="badge">{item.day}</span> {item.label}{" "}
                          <span className="badge">{item.kind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>
                    Week {week.weekIndex + 1}: nothing scheduled — a lighter prep week.
                  </p>
                )}
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
}: {
  events: CalendarEvent[];
  initialYear?: number;
}) {
  const [year, setYear] = useState(initialYear ?? currentJalaliYear());
  const [openMonths, setOpenMonths] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (year === getYear(new Date())) {
      setOpenMonths({ [getMonth(new Date())]: true });
    } else {
      setOpenMonths({ 0: true });
    }
  }, [year]);

  const months = useMemo(() => buildJalaliYear(year), [year]);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button type="button" className="btn secondary sm" onClick={() => setYear((y) => y - 1)}>
          ← {year - 1}
        </button>
        <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Solar Hijri {year}</h2>
        <button type="button" className="btn secondary sm" onClick={() => setYear((y) => y + 1)}>
          {year + 1} →
        </button>
      </div>
      <p className="muted" style={{ margin: 0 }}>
        Expand a month to see weeks (Saturday–Friday) and what to prepare for — occasions, tasks, and
        scheduled blocks.
      </p>
      {months.map((m) => {
        const expanded = Boolean(openMonths[m.monthIndex]);
        return (
          <MonthCard
            key={`${m.year}-${m.monthIndex}`}
            month={m}
            events={events}
            expanded={expanded}
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
