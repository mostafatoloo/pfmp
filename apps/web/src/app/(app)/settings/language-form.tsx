"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@pfmp/i18n/react";

export type LanguageOption = {
  code: string;
  label: string;
  hint?: string;
};

export function LanguageForm({
  initialLocale,
  options,
  languageLabel,
  hint,
}: {
  initialLocale: string;
  options: LanguageOption[];
  languageLabel: string;
  hint: string;
}) {
  const t = useT();
  const router = useRouter();
  const [locale, setLocale] = useState(initialLocale);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onChange(next: string) {
    setLocale(next);
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(json?.error?.message ?? t("settings.saveFailed"));
        setLocale(initialLocale);
        return;
      }
      setMessage(t("settings.saved"));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="muted" htmlFor="settings-language">
        {languageLabel}
      </label>
      <select
        id="settings-language"
        value={locale}
        disabled={busy}
        aria-label={languageLabel}
        onChange={(e) => void onChange(e.target.value)}
        style={{ display: "block", marginBlockStart: "0.35rem", minWidth: "14rem" }}
      >
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
      <p className="muted" style={{ marginBlockStart: "0.5rem" }}>
        {hint}
      </p>
      {message ? (
        <p className="muted" style={{ marginBlockStart: "0.35rem" }} role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
