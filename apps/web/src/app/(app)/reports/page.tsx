import { SignedInShell } from "@/components/signed-in-shell";

export default function ReportsPage() {
  return (
    <SignedInShell pathname="/reports">
      <section className="panel">
        <h1>Reports</h1>
        <p className="muted">Exports (PDF/CSV/XLSX/JSON) land in Stage 4.</p>
      </section>
    </SignedInShell>
  );
}
