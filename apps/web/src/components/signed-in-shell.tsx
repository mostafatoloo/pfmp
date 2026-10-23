import { AppShell } from "@pfmp/ui";
import type { ReactNode } from "react";

export function SignedInShell({
  children,
  pathname,
}: {
  children: ReactNode;
  pathname: string;
}) {
  return (
    <AppShell pathname={pathname} brand="PFMP" locale="en" dir="ltr">
      {children}
    </AppShell>
  );
}
