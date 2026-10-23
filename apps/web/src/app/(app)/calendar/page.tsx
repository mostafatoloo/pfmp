import { SignedInShell } from "@/components/signed-in-shell";

export default function CalendarPage() {
  return (
    <SignedInShell pathname="/calendar">
      <section className="panel">
        <h1>Calendar</h1>
        <p className="muted">Jalali display helpers land in Stage 4; storage is UTC/Gregorian.</p>
      </section>
    </SignedInShell>
  );
}
