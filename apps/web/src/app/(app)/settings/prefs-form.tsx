"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@pfmp/i18n/react";

export function PrefsForm({
  initialCalendarSystem,
  initialWeekStartsOn,
}: {
  initialCalendarSystem: "gregory" | "persian";
  initialWeekStartsOn: 1 | 6;
}) {
  const t = useT();
  const router = useRouter();
  const [calendarSystem, setCalendarSystem] = useState(initialCalendarSystem);
  const [weekStartsOn, setWeekStartsOn] = useState<1 | 6>(initialWeekStartsOn);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(patch: {
    calendarSystem?: "gregory" | "persian";
    weekStartsOn?: 1 | 6;
  }) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(json?.error?.message ?? t("settings.saveFailed"));
        return;
      }
      if (patch.calendarSystem) setCalendarSystem(patch.calendarSystem);
      if (patch.weekStartsOn) setWeekStartsOn(patch.weekStartsOn);
      setMessage(t("settings.prefsSaved"));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ gap: "0.75rem" }}>
      <label className="study-inline-field">
        <span>{t("settings.calendarSystem")}</span>
        <select
          value={calendarSystem}
          disabled={busy}
          onChange={(e) =>
            void save({ calendarSystem: e.target.value as "gregory" | "persian" })
          }
        >
          <option value="persian">{t("settings.calendarPersian")}</option>
          <option value="gregory">{t("settings.calendarGregory")}</option>
        </select>
      </label>
      <label className="study-inline-field">
        <span>{t("settings.weekStartsOn")}</span>
        <select
          value={weekStartsOn}
          disabled={busy}
          onChange={(e) => void save({ weekStartsOn: Number(e.target.value) === 1 ? 1 : 6 })}
        >
          <option value={6}>{t("settings.weekStartsSaturday")}</option>
          <option value={1}>{t("settings.weekStartsMonday")}</option>
        </select>
      </label>
      {message ? (
        <p className="muted" style={{ margin: 0 }} role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
