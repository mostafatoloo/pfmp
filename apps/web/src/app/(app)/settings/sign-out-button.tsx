"use client";

import { createBrowserAuthClient } from "@pfmp/auth/client";

export function SignOutButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="btn secondary"
      onClick={async () => {
        await createBrowserAuthClient().signOut();
        window.location.href = "/sign-in";
      }}
    >
      {label}
    </button>
  );
}
