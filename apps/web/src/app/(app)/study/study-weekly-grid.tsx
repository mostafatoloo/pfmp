"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  WEEK_DAYS,
  fmtMinutes,
  schoolDaysForPattern,
  snapMinutes,
  type StudySettingsDto,
  type TimetableSlotDto,
} from "./study-types";

type Props = {
  slots: TimetableSlotDto[];
  settings: StudySettingsDto;
  onEmptyClick: (dayOfWeek: number, startMinutes: number, endMinutes: number) => void;
  onBlockClick: (slot: TimetableSlotDto) => void;
  /** Live preview while dragging a day-local divider */
  onResizePreview: (
    leftId: string,
    rightId: string | null,
    boundaryMinutes: number,
  ) => void;
  /** Persist after pointer-up */
  onResizeCommit: (
    leftId: string,
    rightId: string | null,
    boundaryMinutes: number,
  ) => void;
  onOpenAdvanced: (dayOfWeek: number) => void;
};

type Segment =
  | { type: "block"; slot: TimetableSlotDto }
  | { type: "gap"; startMinutes: number; endMinutes: number };

function buildSegments(
  daySlots: TimetableSlotDto[],
  dayStart: number,
  dayEnd: number,
): Segment[] {
  const sorted = [...daySlots].sort((a, b) => a.startMinutes - b.startMinutes);
  const segs: Segment[] = [];
  let cursor = dayStart;
  for (const slot of sorted) {
    const start = Math.max(slot.startMinutes, dayStart);
    const end = Math.min(slot.endMinutes, dayEnd);
    if (end <= dayStart || start >= dayEnd) continue;
    if (start > cursor) segs.push({ type: "gap", startMinutes: cursor, endMinutes: start });
    segs.push({ type: "block", slot: { ...slot, startMinutes: start, endMinutes: end } });
    cursor = Math.max(cursor, end);
  }
  if (cursor < dayEnd) segs.push({ type: "gap", startMinutes: cursor, endMinutes: dayEnd });
  return segs;
}

function hourMarks(dayStart: number, dayEnd: number) {
  const marks: number[] = [];
  const firstHour = Math.ceil(dayStart / 60) * 60;
  for (let m = firstHour; m < dayEnd; m += 60) marks.push(m);
  return marks;
}

export function StudyWeeklyGrid({
  slots,
  settings,
  onEmptyClick,
  onBlockClick,
  onResizePreview,
  onResizeCommit,
  onOpenAdvanced,
}: Props) {
  const trackRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const schoolDays = useMemo(
    () => schoolDaysForPattern(settings.schoolWeekPattern),
    [settings.schoolWeekPattern],
  );
  const span = Math.max(1, settings.dayEndMinutes - settings.dayStartMinutes);
  const marks = useMemo(
    () => hourMarks(settings.dayStartMinutes, settings.dayEndMinutes),
    [settings.dayStartMinutes, settings.dayEndMinutes],
  );

  const byDay = useMemo(() => {
    const map = new Map<number, TimetableSlotDto[]>();
    for (const d of WEEK_DAYS) map.set(d.js, []);
    for (const s of slots) {
      const list = map.get(s.dayOfWeek) ?? [];
      list.push(s);
      map.set(s.dayOfWeek, list);
    }
    return map;
  }, [slots]);

  const pct = useCallback(
    (mins: number) => ((mins - settings.dayStartMinutes) / span) * 100,
    [settings.dayStartMinutes, span],
  );

  const minsFromClientX = useCallback(
    (dayOfWeek: number, clientX: number) => {
      const el = trackRefs.current.get(dayOfWeek);
      if (!el) return settings.dayStartMinutes;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return snapMinutes(settings.dayStartMinutes + ratio * span);
    },
    [settings.dayStartMinutes, span],
  );

  const startResize = (
    dayOfWeek: number,
    left: TimetableSlotDto,
    right: TimetableSlotDto | null,
    e: React.PointerEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const minBound = left.startMinutes + 10;
    const maxBound = right ? right.endMinutes - 10 : settings.dayEndMinutes;

    let lastBoundary = left.endMinutes;
    const onMove = (ev: PointerEvent) => {
      let boundary = minsFromClientX(dayOfWeek, ev.clientX);
      boundary = Math.max(minBound, Math.min(maxBound, boundary));
      lastBoundary = boundary;
      onResizePreview(left.id, right?.id ?? null, boundary);
    };
    const onUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      onResizeCommit(left.id, right?.id ?? null, lastBoundary);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const defaultBlockDuration = Math.max(
    15,
    Math.round((settings.dayEndMinutes - settings.dayStartMinutes) / settings.defaultColumnCount),
  );

  return (
    <div className="study-grid content-dir">
      <div className="study-grid__axis" aria-hidden>
        <div className="study-grid__day-label" />
        <div className="study-grid__track study-grid__track--axis">
          {marks.map((m) => (
            <span
              key={m}
              className="study-grid__hour"
              style={{ insetInlineStart: `${pct(m)}%` }}
            >
              {fmtMinutes(m)}
            </span>
          ))}
          {/* Soft hour ticks on the axis only — not full-height day lines */}
          {marks.map((m) => (
            <span
              key={`tick-${m}`}
              className="study-grid__hour-tick"
              style={{ insetInlineStart: `${pct(m)}%` }}
            />
          ))}
        </div>
      </div>

      {WEEK_DAYS.map((day) => {
        const daySlots = byDay.get(day.js) ?? [];
        const segments = buildSegments(
          daySlots,
          settings.dayStartMinutes,
          settings.dayEndMinutes,
        );
        const isSchool = schoolDays.has(day.js);

        return (
          <div
            key={day.js}
            className={`study-grid__row${isSchool ? " is-school" : ""}`}
          >
            <div className="study-grid__day-label">
              <strong>{day.label}</strong>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => onOpenAdvanced(day.js)}
              >
                Advanced
              </button>
              {isSchool ? <span className="badge brand">School</span> : null}
            </div>
            <div
              className="study-grid__track"
              ref={(el) => {
                if (el) trackRefs.current.set(day.js, el);
                else trackRefs.current.delete(day.js);
              }}
            >
              {/* School window highlight (per-day, not a column grid) */}
              {isSchool ? (
                <div
                  className="study-grid__school-window"
                  style={{
                    insetInlineStart: `${pct(settings.schoolStartMinutes)}%`,
                    width: `${pct(settings.schoolEndMinutes) - pct(settings.schoolStartMinutes)}%`,
                  }}
                  aria-hidden
                />
              ) : null}

              {segments.map((seg, idx) => {
                if (seg.type === "gap") {
                  const width = pct(seg.endMinutes) - pct(seg.startMinutes);
                  if (width <= 0) return null;
                  return (
                    <button
                      key={`gap-${day.js}-${seg.startMinutes}-${idx}`}
                      type="button"
                      className="study-grid__gap"
                      style={{
                        insetInlineStart: `${pct(seg.startMinutes)}%`,
                        width: `${width}%`,
                      }}
                      title={`Add activity · ${fmtMinutes(seg.startMinutes)}`}
                      onClick={() => {
                        const start = seg.startMinutes;
                        const end = Math.min(
                          seg.endMinutes,
                          start + defaultBlockDuration,
                        );
                        onEmptyClick(day.js, start, Math.max(start + 15, end));
                      }}
                    />
                  );
                }

                const { slot } = seg;
                const width = pct(slot.endMinutes) - pct(slot.startMinutes);
                const next = segments[idx + 1];
                const adjacentRight =
                  next?.type === "block" ? next.slot : null;
                // Resize handle when next is adjacent block OR end of this block into a gap
                const showHandle = true;

                return (
                  <div
                    key={slot.id}
                    className={`study-grid__block kind-${slot.kind}`}
                    style={{
                      insetInlineStart: `${pct(slot.startMinutes)}%`,
                      width: `${Math.max(width, 1.2)}%`,
                    }}
                  >
                    <button
                      type="button"
                      className="study-grid__block-body"
                      onClick={() => onBlockClick(slot)}
                    >
                      <span className="study-grid__block-title user-text">{slot.title}</span>
                      {slot.description ? (
                        <span className="study-grid__block-desc user-text">{slot.description}</span>
                      ) : null}
                      <span className="study-grid__block-time">
                        {fmtMinutes(slot.startMinutes)}–{fmtMinutes(slot.endMinutes)}
                      </span>
                    </button>
                    {showHandle ? (
                      <div
                        className="study-grid__resize"
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize time block"
                        onPointerDown={(e) =>
                          startResize(
                            day.js,
                            slot,
                            adjacentRight &&
                              Math.abs(adjacentRight.startMinutes - slot.endMinutes) <= 1
                              ? adjacentRight
                              : null,
                            e,
                          )
                        }
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
