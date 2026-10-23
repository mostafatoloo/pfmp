import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requireWorkspace } from "@pfmp/auth";

export default async function SettingsPage() {
  const ctx = await requireWorkspace(await headers());
  return (
    <SignedInShell pathname="/settings">
      <section className="panel">
        <h1>Settings</h1>
        <p>Profile and preferences (timezone stub).</p>
        <dl>
          <dt>Email</dt>
          <dd>{ctx.email}</dd>
          <dt>Timezone</dt>
          <dd>{ctx.timezone}</dd>
          <dt>Locale</dt>
          <dd>{ctx.locale}</dd>
          <dt>Workspace</dt>
          <dd>
            {ctx.workspace.name} ({ctx.workspace.id})
          </dd>
        </dl>
        <form action="/api/auth/sign-out" method="POST">
          {/* Better Auth client sign-out preferred; link to sign-in for Stage 3 */}
        </form>
        <p className="muted">
          Use the Sign out control on the sign-in page after clearing session via Better Auth
          `/api/auth/sign-out`.
        </p>
      </section>
    </SignedInShell>
  );
}
