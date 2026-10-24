"use client";

import { useEffect, useId, useState } from "react";
import { fmtMinutes, kindLabel, type TimetableKind, type TimetableSlotDto } from "./study-types";

export type ActivityDraft = {
  title: string;
  description: string;
  notes: string;
  kind: TimetableKind;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  /** Time range comes from the grid — shown read-only in create/edit from grid. */
  startMinutes: number;
  endMinutes: number;
  dayLabel: string;
  initial?: Partial<ActivityDraft> & { title?: string };
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (draft: ActivityDraft) => void;
  onDelete?: () => void;
};

export function ActivityDialog({
  open,
  mode,
  startMinutes,
  endMinutes,
  dayLabel,
  initial,
  busy,
  error,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const titleId = useId();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [kind, setKind] = useState<TimetableKind>(initial?.kind ?? "study_session");

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setNotes(initial?.notes ?? "");
    setKind(initial?.kind ?? "study_session");
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="study-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="study-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="study-modal__header">
          <div>
            <h2 id={titleId}>{mode === "create" ? "Add activity" : "Edit activity"}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {dayLabel} · {fmtMinutes(startMinutes)}–{fmtMinutes(endMinutes)}
            </p>
          </div>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close">
            Close
          </button>
        </header>

        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            onSave({
              title: title.trim(),
              description: description.trim(),
              notes: notes.trim(),
              kind,
            });
          }}
        >
          <div className="field">
            <label htmlFor="activity-title">Title</label>
            <input
              id="activity-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Exam review"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="activity-description">Description</label>
            <input
              id="activity-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Shown under the title in the grid"
              maxLength={500}
            />
          </div>
          <div className="field">
            <label htmlFor="activity-notes">Notes</label>
            <textarea
              id="activity-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Extra notes about this block"
              rows={3}
            />
          </div>
          <div className="field">
            <label htmlFor="activity-kind">Type</label>
            <select
              id="activity-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as TimetableKind)}
            >
              <option value="study_session">{kindLabel("study_session")}</option>
              <option value="school_class">{kindLabel("school_class")}</option>
              <option value="other_class">{kindLabel("other_class")}</option>
            </select>
          </div>

          {error ? (
            <p className="muted" role="alert">
              {error}
            </p>
          ) : null}

          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              {onDelete ? (
                <button
                  type="button"
                  className="btn danger sm"
                  disabled={busy}
                  onClick={onDelete}
                >
                  Delete
                </button>
              ) : null}
            </div>
            <div className="row">
              <button type="button" className="btn secondary" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn" disabled={busy || !title.trim()}>
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function slotToDraft(slot: TimetableSlotDto): ActivityDraft {
  return {
    title: slot.title,
    description: slot.description ?? "",
    notes: slot.notes ?? "",
    kind: (slot.kind as TimetableKind) || "study_session",
  };
}
