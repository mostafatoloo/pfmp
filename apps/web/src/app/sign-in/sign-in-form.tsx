"use client";

import { useState } from "react";
import { createBrowserAuthClient } from "@pfmp/auth/client";

const authClient = createBrowserAuthClient();

export function SignInForm({
  labels,
}: {
  labels: {
    email: string;
    emailPlaceholder: string;
    sendMagicLink: string;
    passkey: string;
    signOut: string;
    magicLinkSent: string;
  };
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const { error } = await authClient.signIn.magicLink({
        email,
        name: name || undefined,
        callbackURL: "/today",
        newUserCallbackURL: "/today",
      });
      if (error) {
        setStatus(error.message ?? "Failed to send magic link");
      } else {
        setStatus(labels.magicLinkSent);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function onPasskey() {
    setBusy(true);
    setStatus(null);
    try {
      const { error } = await authClient.signIn.passkey({ autoFill: false });
      if (error) {
        setStatus(
          error.message ??
            "Passkey sign-in unavailable — use magic link (fallback when WebAuthn is unsupported).",
        );
      } else {
        window.location.href = "/today";
      }
    } catch {
      setStatus("Passkey not available in this browser — use magic link.");
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    await authClient.signOut();
    setStatus("Signed out.");
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="email">{labels.email}</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username webauthn"
          required
          placeholder={labels.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="name">Name (new accounts)</label>
        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="row">
        <button className="btn" type="submit" disabled={busy}>
          {labels.sendMagicLink}
        </button>
        <button className="btn secondary" type="button" disabled={busy} onClick={onPasskey}>
          {labels.passkey}
        </button>
        <button className="btn ghost" type="button" disabled={busy} onClick={onSignOut}>
          {labels.signOut}
        </button>
      </div>
      {status ? (
        <p className="muted" role="status" style={{ marginBlockStart: "1rem" }}>
          {status}
        </p>
      ) : null}
    </form>
  );
}
