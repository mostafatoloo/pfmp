"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActivityDialog, slotToDraft } from "./study-activity-dialog";
import { StudyAdvancedDay } from "./study-advanced-day";
import { StudySchoolSetup } from "./study-school-setup";
import { StudyWeeklyGrid } from "./study-weekly-grid";
import {
  WEEK_DAYS,
  type StudySettingsDto,
  type TimetableKind,
  type TimetableSlotDto,
} from "./study-types";

type CreateTarget = {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
};

type EditTarget = {
  slot: TimetableSlotDto;
};

export function StudySchedule({
  initialSlots,
  initialSettings,
}: {
  initialSlots: TimetableSlotDto[];
  initialSettings: StudySettingsDto;
}) {
  const router = useRouter();
  const [slots, setSlots] = useState(initialSlots);
  const [settings, setSettings] = useState(initialSettings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createTarget, setCreateTarget] = useState<CreateTarget | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [advancedDay, setAdvancedDay] = useState<number | null>(null);

  const dayLabel = useCallback((js: number) => {
    return WEEK_DAYS.find((d) => d.js === js)?.label ?? "Day";
  }, []);

  const refresh = () => router.refresh();

  async function createSlot(input: {
    kind: TimetableKind;
    title: string;
    description?: string | null;
    notes?: string | null;
    dayOfWeek: number;
    startMinutes: number;
    endMinutes: number;
  }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to create");
      setSlots((prev) => [...prev, json.data]);
      refresh();
      return json.data as TimetableSlotDto;
    } finally {
      setBusy(false);
    }
  }

  async function updateSlot(
    id: string,
    patch: Partial<{
      kind: TimetableKind;
      title: string;
      description: string | null;
      notes: string | null;
      dayOfWeek: number;
      startMinutes: number;
      endMinutes: number;
    }>,
  ) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/timetable/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to update");
      setSlots((prev) => prev.map((s) => (s.id === id ? json.data : s)));
      refresh();
      return json.data as TimetableSlotDto;
    } finally {
      setBusy(false);
    }
  }

  async function deleteSlot(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/timetable/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? "Failed to delete");
      }
      setSlots((prev) => prev.filter((s) => s.id !== id));
      refresh();
    } finally {
      setBusy(false);
    }
  }

  const applyBoundaryLocal = useCallback(
    (leftId: string, rightId: string | null, boundaryMinutes: number) => {
      setSlots((prev) =>
        prev.map((s) => {
          if (s.id === leftId) return { ...s, endMinutes: boundaryMinutes };
          if (rightId && s.id === rightId) return { ...s, startMinutes: boundaryMinutes };
          return s;
        }),
      );
    },
    [],
  );

  const commitBoundary = useCallback(
    async (leftId: string, rightId: string | null, boundaryMinutes: number) => {
      applyBoundaryLocal(leftId, rightId, boundaryMinutes);
      try {
        await fetch(`/api/v1/timetable/${leftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endMinutes: boundaryMinutes }),
        });
        if (rightId) {
          await fetch(`/api/v1/timetable/${rightId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ startMinutes: boundaryMinutes }),
          });
        }
        refresh();
      } catch {
        /* keep optimistic state */
      }
    },
    [applyBoundaryLocal],
  );

  const advancedSlots = useMemo(
    () => (advancedDay === null ? [] : slots.filter((s) => s.dayOfWeek === advancedDay)),
    [advancedDay, slots],
  );

  return (
    <div className="stack study-schedule">
      <StudySchoolSetup
        settings={settings}
        busy={busy}
        onSaveSettings={async (patch) => {
          setBusy(true);
          try {
            const res = await fetch("/api/v1/timetable/settings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(patch),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error?.message ?? "Failed to save settings");
            setSettings(json.data);
            refresh();
          } finally {
            setBusy(false);
          }
        }}
        onApplySchoolDay={async (dayOfWeek, subjects) => {
          setBusy(true);
          try {
            const res = await fetch("/api/v1/timetable/school-day", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dayOfWeek, subjects }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error?.message ?? "Failed to apply school day");
            setSlots((prev) => [
              ...prev.filter((s) => !(s.dayOfWeek === dayOfWeek && s.kind === "school_class")),
              ...json.data,
            ]);
            refresh();
          } finally {
            setBusy(false);
          }
        }}
      />

      <section className="card stack">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Weekly schedule</h2>
            <p className="muted" style={{ margin: "0.35rem 0 0", maxWidth: "40rem" }}>
              Each day has its own time blocks — dividers do not run through the whole week.
              Click empty space to add an activity, click a block to edit, drag a block edge to
              resize. Default blocks: {settings.defaultColumnCount}.
            </p>
          </div>
        </div>

        <StudyWeeklyGrid
          slots={slots}
          settings={settings}
          onEmptyClick={(dayOfWeek, startMinutes, endMinutes) => {
            setEditTarget(null);
            setCreateTarget({ dayOfWeek, startMinutes, endMinutes });
          }}
          onBlockClick={(slot) => {
            setCreateTarget(null);
            setEditTarget({ slot });
          }}
          onResizePreview={applyBoundaryLocal}
          onResizeCommit={(leftId, rightId, boundary) => {
            void commitBoundary(leftId, rightId, boundary);
          }}
          onOpenAdvanced={(dayOfWeek) => setAdvancedDay(dayOfWeek)}
        />
      </section>

      <ActivityDialog
        open={Boolean(createTarget)}
        mode="create"
        startMinutes={createTarget?.startMinutes ?? 0}
        endMinutes={createTarget?.endMinutes ?? 0}
        dayLabel={createTarget ? dayLabel(createTarget.dayOfWeek) : ""}
        busy={busy}
        error={error}
        onClose={() => setCreateTarget(null)}
        onSave={(draft) => {
          if (!createTarget) return;
          void createSlot({
            ...draft,
            description: draft.description || null,
            notes: draft.notes || null,
            dayOfWeek: createTarget.dayOfWeek,
            startMinutes: createTarget.startMinutes,
            endMinutes: createTarget.endMinutes,
          })
            .then(() => setCreateTarget(null))
            .catch((err: Error) => setError(err.message));
        }}
      />

      <ActivityDialog
        open={Boolean(editTarget)}
        mode="edit"
        startMinutes={editTarget?.slot.startMinutes ?? 0}
        endMinutes={editTarget?.slot.endMinutes ?? 0}
        dayLabel={editTarget ? dayLabel(editTarget.slot.dayOfWeek) : ""}
        initial={editTarget ? slotToDraft(editTarget.slot) : undefined}
        busy={busy}
        error={error}
        onClose={() => setEditTarget(null)}
        onSave={(draft) => {
          if (!editTarget) return;
          void updateSlot(editTarget.slot.id, {
            title: draft.title,
            description: draft.description || null,
            notes: draft.notes || null,
            kind: draft.kind,
          })
            .then(() => setEditTarget(null))
            .catch((err: Error) => setError(err.message));
        }}
        onDelete={() => {
          if (!editTarget) return;
          void deleteSlot(editTarget.slot.id).then(() => setEditTarget(null));
        }}
      />

      <StudyAdvancedDay
        open={advancedDay !== null}
        dayOfWeek={advancedDay ?? 0}
        slots={advancedSlots}
        busy={busy}
        onClose={() => setAdvancedDay(null)}
        onSaveSlot={async (id, patch) => {
          await updateSlot(id, patch);
        }}
        onDeleteSlot={async (id) => {
          await deleteSlot(id);
        }}
        onCreateSlot={async (input) => {
          await createSlot(input);
        }}
      />
    </div>
  );
}
