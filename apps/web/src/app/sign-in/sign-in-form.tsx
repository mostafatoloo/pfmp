"use client";

import { useState } from "react";
import { createBrowserAuthClient } from "@pfmp/auth/client";

function emailForUsername(username: string): string {
  return `${username.trim().toLowerCase()}@users.pfmp.local`;
}

const authClient = createBrowserAuthClient();

type Mode = "signin" | "signup" | "forgot";

type Labels = {
  tabSignIn: string;
  tabSignUp: string;
  tabForgot: string;
  usernameLabel: string;
  usernamePlaceholder: string;
  mobileLabel: string;
  mobilePlaceholder: string;
  mobileHint: string;
  codeLabel: string;
  codePlaceholder: string;
  sendResetCode: string;
  resetPassword: string;
  codeSent: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  newPasswordLabel: string;
  signIn: string;
  signUp: string;
  switchToSignIn: string;
  switchToSignUp: string;
  switchToForgot: string;
  backToSignIn: string;
  nameLabel: string;
  namePlaceholder: string;
  signOut: string;
};

function normalizeMobileClient(raw: string): string | null {
  let digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("0098")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("98") && digits.length === 12) digits = `0${digits.slice(2)}`;
  else if (digits.startsWith("9") && digits.length === 10) digits = `0${digits}`;
  if (!/^09\d{9}$/.test(digits)) return null;
  return digits;
}

export function SignInForm({ labels }: { labels: Labels }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function go(next: Mode) {
    setMode(next);
    setStatus(null);
    setResetSent(false);
    setCode("");
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const { error } = await authClient.signIn.username({
        username: username.trim(),
        password,
      });
      if (error) {
        setStatus(error.message ?? "Sign-in failed");
        return;
      }
      window.location.href = "/today";
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function onSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const user = username.trim();
      const phone = normalizeMobileClient(mobile);
      if (!phone) {
        setStatus("Enter a valid mobile (e.g. 09123456789)");
        return;
      }
      if (user.length < 3) {
        setStatus("Username must be at least 3 characters");
        return;
      }
      if (password.length < 6) {
        setStatus("Password must be at least 6 characters");
        return;
      }
      const { error } = await authClient.signUp.email({
        email: emailForUsername(user),
        password,
        name: name.trim() || user,
        username: user,
        phoneNumber: phone,
      });
      if (error) {
        setStatus(error.message ?? "Could not create account");
        return;
      }
      window.location.href = "/today";
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function onRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const phone = normalizeMobileClient(mobile);
      if (!phone) {
        setStatus("Enter a valid mobile (e.g. 09123456789)");
        return;
      }
      const { error } = await authClient.phoneNumber.requestPasswordReset({
        phoneNumber: phone,
      });
      if (error) {
        setStatus(error.message ?? "Could not send code");
        return;
      }
      setResetSent(true);
      setStatus(labels.codeSent);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const phone = normalizeMobileClient(mobile);
      if (!phone) {
        setStatus("Enter a valid mobile (e.g. 09123456789)");
        return;
      }
      if (password.length < 6) {
        setStatus("Password must be at least 6 characters");
        return;
      }
      const { error } = await authClient.phoneNumber.resetPassword({
        phoneNumber: phone,
        otp: code.trim(),
        newPassword: password,
      });
      if (error) {
        setStatus(error.message ?? "Could not reset password");
        return;
      }
      setStatus("Password updated. Sign in with your username.");
      go("signin");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    await authClient.signOut();
    setStatus("Signed out.");
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className={`btn ${mode === "signin" ? "" : "secondary"}`}
          onClick={() => go("signin")}
        >
          {labels.tabSignIn}
        </button>
        <button
          type="button"
          className={`btn ${mode === "signup" ? "" : "secondary"}`}
          onClick={() => go("signup")}
        >
          {labels.tabSignUp}
        </button>
        <button
          type="button"
          className={`btn ${mode === "forgot" ? "" : "secondary"}`}
          onClick={() => go("forgot")}
        >
          {labels.tabForgot}
        </button>
      </div>

      {mode === "signin" ? (
        <form onSubmit={onSignIn}>
          <div className="field">
            <label htmlFor="username">{labels.usernameLabel}</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              placeholder={labels.usernamePlaceholder}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
          <div className="row">
            <button className="btn" type="submit" disabled={busy}>
              {labels.signIn}
            </button>
            <button className="btn ghost" type="button" disabled={busy} onClick={() => go("forgot")}>
              {labels.switchToForgot}
            </button>
          </div>
          <p className="muted" style={{ marginBlockStart: "0.75rem" }}>
            <button className="btn ghost" type="button" disabled={busy} onClick={() => go("signup")}>
              {labels.switchToSignUp}
            </button>
          </p>
        </form>
      ) : null}

      {mode === "signup" ? (
        <form onSubmit={onSignUp}>
          <div className="field">
            <label htmlFor="su-username">{labels.usernameLabel}</label>
            <input
              id="su-username"
              name="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              placeholder={labels.usernamePlaceholder}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="su-mobile">{labels.mobileLabel}</label>
            <input
              id="su-mobile"
              name="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              placeholder={labels.mobilePlaceholder}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <p className="muted" style={{ marginBlockStart: "0.35rem", fontSize: "0.85rem" }}>
              {labels.mobileHint}
            </p>
          </div>
          <div className="field">
            <label htmlFor="su-password">{labels.passwordLabel}</label>
            <input
              id="su-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder={labels.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="su-name">{labels.nameLabel}</label>
            <input
              id="su-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={labels.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="row">
            <button className="btn" type="submit" disabled={busy}>
              {labels.signUp}
            </button>
            <button className="btn ghost" type="button" disabled={busy} onClick={() => go("signin")}>
              {labels.switchToSignIn}
            </button>
          </div>
        </form>
      ) : null}

      {mode === "forgot" ? (
        <form onSubmit={resetSent ? onResetPassword : onRequestReset}>
          <div className="field">
            <label htmlFor="fp-mobile">{labels.mobileLabel}</label>
            <input
              id="fp-mobile"
              name="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              placeholder={labels.mobilePlaceholder}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              disabled={resetSent && busy}
            />
          </div>
          {resetSent ? (
            <>
              <div className="field">
                <label htmlFor="fp-code">{labels.codeLabel}</label>
                <input
                  id="fp-code"
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
              <div className="field">
                <label htmlFor="fp-password">{labels.newPasswordLabel}</label>
                <input
                  id="fp-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder={labels.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          ) : null}
          <div className="row">
            <button className="btn" type="submit" disabled={busy}>
              {resetSent ? labels.resetPassword : labels.sendResetCode}
            </button>
            {resetSent ? (
              <button
                className="btn secondary"
                type="button"
                disabled={busy}
                onClick={() => {
                  setResetSent(false);
                  setCode("");
                  setStatus(null);
                }}
              >
                Change number
              </button>
            ) : (
              <button className="btn ghost" type="button" disabled={busy} onClick={() => go("signin")}>
                {labels.backToSignIn}
              </button>
            )}
          </div>
        </form>
      ) : null}

      <div className="row" style={{ marginTop: "1rem" }}>
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
