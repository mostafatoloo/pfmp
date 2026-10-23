import { SignedInShell } from "@/components/signed-in-shell";

export default function StudyPage() {
  return (
    <SignedInShell pathname="/study">
      <section className="panel">
        <h1>Study</h1>
        <p className="muted">Stage 4 module — foundation shell only.</p>
      </section>
    </SignedInShell>
  );
}
