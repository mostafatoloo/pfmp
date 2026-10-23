import { SignedInShell } from "@/components/signed-in-shell";

export default function TasksPage() {
  return (
    <SignedInShell pathname="/tasks">
      <section className="panel">
        <h1>Tasks</h1>
        <p className="muted">Stage 4 module — foundation shell only.</p>
      </section>
    </SignedInShell>
  );
}
