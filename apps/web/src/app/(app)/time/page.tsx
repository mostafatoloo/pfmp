import { SignedInShell } from "@/components/signed-in-shell";

export default function TimePage() {
  return (
    <SignedInShell pathname="/time">
      <section className="panel">
        <h1>Time</h1>
        <p className="muted">Stage 4 module — foundation shell only.</p>
      </section>
    </SignedInShell>
  );
}
