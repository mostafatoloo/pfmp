import { SignedInShell } from "@/components/signed-in-shell";

export default function ReportsPage() {
  return (
    <SignedInShell pathname="/reports">
      <section className="panel">
        <h1>Reports</h1>
        <p>
          Exports via <code>POST /api/v1/exports</code> (pdf/csv/xlsx/json). Persian PDF uses{" "}
          <code>locale=fa</code> with A4 RTL HTML (Playwright when available).
        </p>
        <p className="muted">Progress: GET /api/v1/progress/summary</p>
      </section>
    </SignedInShell>
  );
}
