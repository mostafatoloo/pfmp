import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requireWorkspace } from "@pfmp/auth";
import { getPrisma, AcademicService } from "@pfmp/database";

export default async function StudyPage() {
  const ctx = await requireWorkspace(await headers());
  const terms = await new AcademicService(getPrisma()).listTerms(ctx.workspace.id);
  return (
    <SignedInShell pathname="/study">
      <section className="panel">
        <h1>Study</h1>
        <p>Terms, courses, topics, and explicit progress measures (separate from time).</p>
        <ul>
          {terms.length === 0 ? (
            <li className="muted">No terms yet — create via API POST /api/v1/terms</li>
          ) : (
            terms.map((t) => (
              <li key={t.id}>
                {t.name} ({t.startsOn.toISOString().slice(0, 10)} →{" "}
                {t.endsOn.toISOString().slice(0, 10)})
              </li>
            ))
          )}
        </ul>
      </section>
    </SignedInShell>
  );
}
