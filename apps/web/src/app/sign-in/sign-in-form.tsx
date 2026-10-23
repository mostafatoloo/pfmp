"use client";

import { useState } from "react";
import { createBrowserAuthClient } from "@pfmp/auth/client";

const authClient = createBrowserAuthClient();

type Labels = {
  tabSms: string;
  tabPassword: string;
  mobileLabel: string;
  mobilePlaceholder: string;
  codeLabel: string;
  codePlaceholder: string;
  sendCode: string;
  verifyCode: string;
  codeSent: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  signInPassword: string;
  signUpPassword: string;
  nameLabel: string;
  setPasswordHint: string;
  setPassword: string;
  passwordSaved: string;
  passkey: string;
  signOut: string;
};

function looksLikeMobile(value: string): boolean {
  const d = value.replace(/[^\d]/g, "");
  return /^09\d{9}$/.test(d) || /^(?:\+?98|0098)?9\d{9}$/.test(d);
}

export function SignInForm({ labels }: { labels: Labels }) {
  const [mode, setMode] = useState<"sms" | "password">("sms");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber: mobile.trim() });
      if (error) {
        setStatus(error.message ?? "Failed to send code");
      } else {
        setOtpSent(true);
        setStatus(labels.codeSent);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const { error } = await authClient.phoneNumber.verify({
        phoneNumber: mobile.trim(),
        code: code.trim(),
      });
      if (error) {
        setStatus(error.message ?? "Invalid code");
        return;
      }
      setShowSetPassword(true);
      setStatus(labels.setPasswordHint);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.trim().length < 6) {
      setStatus("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPassword.trim() }),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setStatus(body?.message ?? body?.error?.message ?? "Could not save password");
        return;
      }
      setStatus(labels.passwordSaved);
      window.location.href = "/today";
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const id = email.trim();
      if (looksLikeMobile(id)) {
        const { error } = await authClient.signIn.phoneNumber({
          phoneNumber: id,
          password,
        });
        if (error) {
          setStatus(error.message ?? "Sign-in failed");
          return;
        }
      } else {
        const { error } = await authClient.signIn.email({
          email: id,
          password,
        });
        if (error) {
          setStatus(error.message ?? "Sign-in failed");
          return;
        }
      }
      window.location.href = "/today";
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function signUpWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const { error } = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: name.trim() || email.trim().split("@")[0] || "User",
      });
      if (error) {
        setStatus(error.message ?? "Sign-up failed");
        return;
      }
      window.location.href = "/today";
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
        setStatus(error.message ?? "Passkey unavailable — use SMS or password.");
      } else {
        window.location.href = "/today";
      }
    } catch {
      setStatus("Passkey not available — use SMS or password.");
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    await authClient.signOut();
    setStatus("Signed out.");
    setShowSetPassword(false);
    setOtpSent(false);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          type="button"
          className={`btn ${mode === "sms" ? "" : "secondary"}`}
          onClick={() => {
            setMode("sms");
            setStatus(null);
          }}
        >
          {labels.tabSms}
        </button>
        <button
          type="button"
          className={`btn ${mode === "password" ? "" : "secondary"}`}
          onClick={() => {
            setMode("password");
            setStatus(null);
          }}
        >
          {labels.tabPassword}
        </button>
      </div>

      {mode === "sms" && !showSetPassword ? (
        <form onSubmit={otpSent ? verifyOtp : sendOtp}>
          <div className="field">
            <label htmlFor="mobile">{labels.mobileLabel}</label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              placeholder={labels.mobilePlaceholder}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              disabled={otpSent && busy}
            />
          </div>
          {otpSent ? (
            <div className="field">
              <label htmlFor="code">{labels.codeLabel}</label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                placeholder={labels.codePlaceholder}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          ) : null}
          <div className="row">
            <button className="btn" type="submit" disabled={busy}>
              {otpSent ? labels.verifyCode : labels.sendCode}
            </button>
            {otpSent ? (
              <button
                className="btn secondary"
                type="button"
                disabled={busy}
                onClick={() => {
                  setOtpSent(false);
                  setCode("");
                  setStatus(null);
                }}
              >
                Change number
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {mode === "sms" && showSetPassword ? (
        <form onSubmit={savePassword}>
          <p className="muted">{labels.setPasswordHint}</p>
          <div className="field">
            <label htmlFor="newPassword">{labels.passwordLabel}</label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              placeholder={labels.passwordPlaceholder}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="row">
            <button className="btn" type="submit" disabled={busy || newPassword.trim().length < 6}>
              {labels.setPassword}
            </button>
            <button
              className="btn secondary"
              type="button"
              disabled={busy}
              onClick={() => {
                window.location.href = "/today";
              }}
            >
              Skip
            </button>
          </div>
        </form>
      ) : null}

      {mode === "password" ? (
        <form onSubmit={signInWithPassword}>
          <div className="field">
            <label htmlFor="email">{labels.emailLabel} / {labels.mobileLabel}</label>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              required
              placeholder={`${labels.emailPlaceholder} / ${labels.mobilePlaceholder}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">{labels.passwordLabel}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              placeholder={labels.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="name">{labels.nameLabel} (new email accounts)</label>
            <input id="name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="row">
            <button className="btn" type="submit" disabled={busy}>
              {labels.signInPassword}
            </button>
            <button className="btn secondary" type="button" disabled={busy} onClick={signUpWithPassword}>
              {labels.signUpPassword}
            </button>
          </div>
        </form>
      ) : null}

      <div className="row" style={{ marginTop: "1rem" }}>
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
    </div>
  );
}
