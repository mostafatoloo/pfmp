import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requireWorkspace } from "@pfmp/auth";
import { getPrisma, TimeService } from "@pfmp/database";

export default async function TimePage() {
  const ctx = await requireWorkspace(await headers());
  const time = new TimeService(getPrisma());
  const active = await time.getActiveTimer(ctx.workspace.id);
  const entries = await time.listEntries(ctx.workspace.id);
  return (
    <SignedInShell pathname="/time">
      <section className="panel">
        <h1>Time</h1>
        <p>
          Active timer:{" "}
          {active ? `running since ${active.startedAtUtc.toISOString()}` : "none (recoverable via GET /api/v1/timer)"}
        </p>
        <ul>
          {entries.slice(0, 10).map((e) => (
            <li key={e.id}>
              {e.source} · {e.durationSeconds ?? "?"}s · {e.startedAtUtc.toISOString()}
            </li>
          ))}
        </ul>
      </section>
    </SignedInShell>
  );
}
