"use client";

import { useEffect, useId, useState } from "react";
import { useT } from "@pfmp/i18n/react";
import {
  WEEK_DAYS,
  fmtMinutes,
  kindLabelKey,
  minutesToTimeInput,
  parseTimeInput,
  type TimetableKind,
  type TimetableSlotDto,
} from "./study-types";

type Props = {
  open: boolean;
  dayOfWeek: number;
  slots: TimetableSlotDto[];
  busy?: boolean;
  onClose: () => void;
  onSaveSlot: (
    id: string,
    patch: {
      title: string;
      description: string | null;
      notes: string | null;
      kind: TimetableKind;
      startMinutes: number;
      endMinutes: number;
    },
  ) => Promise<void>;
  onDeleteSlot: (id: string) => Promise<void>;
  onCreateSlot: (input: {
    title: string;
    description: string | null;
    notes: string | null;
    kind: TimetableKind;
    startMinutes: number;
    endMinutes: number;
    dayOfWeek: number;
  }) => Promise<void>;
};

type EditRow = {
  id: string;
  title: string;
  description: string;
  notes: string;
  kind: TimetableKind;
  start: string;
  end: string;
};

export function StudyAdvancedDay({
  open,
  dayOfWeek,
  slots,
  busy,
  onClose,
  onSaveSlot,
  onDeleteSlot,
  onCreateSlot,
}: Props) {
  const t = useT();
  const titleId = useId();
  const day = WEEK_DAYS.find((d) => d.js === dayOfWeek);
  const [rows, setRows] = useState<EditRow[]>([]);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    notes: "",
    kind: "study_session" as TimetableKind,
    start: "16:00",
    end: "17:00",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRows(
      [...slots]
        .sort((a, b) => a.startMinutes - b.startMinutes)
        .map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description ?? "",
          notes: s.notes ?? "",
          kind: (s.kind as TimetableKind) || "study_session",
          start: minutesToTimeInput(s.startMinutes),
          end: minutesToTimeInput(s.endMinutes),
        })),
    );
    setError(null);
  }, [open, slots]);

  if (!open) return null;

  return (
    <div className="study-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="study-modal study-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="study-modal__header">
          <div>
            <h2 id={titleId}>
              {t("study.advanced")}
              {day ? ` · ${t(day.labelKey)}` : ""}
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              {t("study.weeklyLead")}
            </p>
          </div>
          <button type="button" className="btn ghost sm" onClick={onClose}>
            {t("common.close")}
          </button>
        </header>

        <div className="stack">
          {rows.length === 0 ? (
            <p className="muted">{t("common.empty")}</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="study-advanced-row card stack">
                <div className="row">
                  <input
                    value={row.title}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) => (r.id === row.id ? { ...r, title: e.target.value } : r)),
                      )
                    }
                    placeholder={t("study.titlePlaceholder")}
                    style={{ flex: "1 1 140px" }}
                  />
                  <select
                    value={row.kind}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) =>
                          r.id === row.id
                            ? { ...r, kind: e.target.value as TimetableKind }
                            : r,
                        ),
                      )
                    }
                  >
                    <option value="school_class">{t(kindLabelKey("school_class"))}</option>
                    <option value="study_session">{t(kindLabelKey("study_session"))}</option>
                    <option value="other_class">{t(kindLabelKey("other_class"))}</option>
                  </select>
                  <input
                    type="time"
                    value={row.start}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) => (r.id === row.id ? { ...r, start: e.target.value } : r)),
                      )
                    }
                  />
                  <input
                    type="time"
                    value={row.end}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) => (r.id === row.id ? { ...r, end: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <input
                  value={row.description}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id ? { ...r, description: e.target.value } : r,
                      ),
                    )
                  }
                  placeholder={t("study.descriptionPlaceholder")}
                />
                <textarea
                  value={row.notes}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) => (r.id === row.id ? { ...r, notes: e.target.value } : r)),
                    )
                  }
                  placeholder={t("study.notesPlaceholder")}
                  rows={2}
                />
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn danger sm"
                    disabled={busy}
                    onClick={() => void onDeleteSlot(row.id)}
                  >
                    {t("common.delete")}
                  </button>
                  <button
                    type="button"
                    className="btn sm"
                    disabled={busy || !row.title.trim()}
                    onClick={() =>
                      void onSaveSlot(row.id, {
                        title: row.title.trim(),
                        description: row.description.trim() || null,
                        notes: row.notes.trim() || null,
                        kind: row.kind,
                        startMinutes: parseTimeInput(row.start),
                        endMinutes: parseTimeInput(row.end),
                      }).catch((err: Error) => setError(err.message))
                    }
                  >
                    {t("common.save")}
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="card stack">
            <strong>{t("study.addActivity")}</strong>
            <div className="row">
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder={t("study.titlePlaceholder")}
                style={{ flex: "1 1 140px" }}
              />
              <select
                value={draft.kind}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, kind: e.target.value as TimetableKind }))
                }
              >
                <option value="study_session">{t(kindLabelKey("study_session"))}</option>
                <option value="school_class">{t(kindLabelKey("school_class"))}</option>
                <option value="other_class">{t(kindLabelKey("other_class"))}</option>
              </select>
              <input
                type="time"
                value={draft.start}
                onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
              />
              <input
                type="time"
                value={draft.end}
                onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
              />
            </div>
            <input
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder={t("study.descriptionPlaceholder")}
            />
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              placeholder={t("study.notesPlaceholder")}
              rows={2}
            />
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn"
                disabled={busy || !draft.title.trim()}
                onClick={() =>
                  void onCreateSlot({
                    title: draft.title.trim(),
                    description: draft.description.trim() || null,
                    notes: draft.notes.trim() || null,
                    kind: draft.kind,
                    startMinutes: parseTimeInput(draft.start),
                    endMinutes: parseTimeInput(draft.end),
                    dayOfWeek,
                  }).then(() =>
                    setDraft({
                      title: "",
                      description: "",
                      notes: "",
                      kind: "study_session",
                      start: draft.end,
                      end: fmtMinutes(parseTimeInput(draft.end) + 60),
                    }),
                  )
                }
              >
                {t("study.addActivity")}
              </button>
            </div>
          </div>

          {error ? (
            <p className="muted" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
