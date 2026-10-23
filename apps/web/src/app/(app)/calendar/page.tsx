import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requireWorkspace } from "@pfmp/auth";
import { getPrisma, CalendarQueryService } from "@pfmp/database";
import { formatJalaliDisplay } from "@pfmp/calendar";

export default async function CalendarPage() {
  const ctx = await requireWorkspace(await headers());
  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(from.getTime() + 7 * 86_400_000);
  const items = await new CalendarQueryService(getPrisma()).query(ctx.workspace.id, from, to);
  return (
    <SignedInShell pathname="/calendar">
      <section className="panel">
        <h1>Calendar</h1>
        <p>
          Week · Gregorian {from.toISOString().slice(0, 10)} → {to.toISOString().slice(0, 10)} ·
          Jalali {formatJalaliDisplay(from)} → {formatJalaliDisplay(to)}
        </p>
        <ul>
          {items.length === 0 ? (
            <li className="muted">No items in range</li>
          ) : (
            items.map((i) => (
              <li key={`${i.kind}-${i.id}`}>
                [{i.kind}] {i.title} · {i.startsAtUtc}
              </li>
            ))
          )}
        </ul>
      </section>
    </SignedInShell>
  );
}
