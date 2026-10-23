import { SignedInShell } from "@/components/signed-in-shell";

export default function TodayPage() {
  return (
    <SignedInShell pathname="/today">
      <section className="panel">
        <h1>Today</h1>
        <p>
          Your planning home. Task lists, study blocks, and timers arrive in Stage 4 — this shell
          proves auth, workspace, and navigation.
        </p>
      </section>
    </SignedInShell>
  );
}
