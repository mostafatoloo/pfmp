import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requirePageWorkspace } from "@/lib/require-page-auth";
import { createTranslator } from "@pfmp/i18n";
import { FamilyClient } from "./family-client";

export default async function FamilyPage() {
  const ctx = await requirePageWorkspace(await headers());
  const { t } = createTranslator(ctx.locale);

  return (
    <SignedInShell pathname="/family" locale={ctx.locale} calendarSystem={ctx.calendarSystem} weekStartsOn={ctx.weekStartsOn}>
      <section className="panel">
        <h1>{t("family.title")}</h1>
        <p className="panel-lead">{t("family.subtitle")}</p>
        <FamilyClient
          labels={{
            createWorkspace: t("family.createWorkspace"),
            workspaceName: t("family.workspaceName"),
            invite: t("family.invite"),
            inviteEmail: t("family.inviteEmail"),
            pendingInvites: t("family.pendingInvites"),
            accept: t("family.accept"),
            decline: t("family.decline"),
            leave: t("family.leave"),
            noFamily: t("family.noFamily"),
            overview: t("family.overview"),
            sharedTasks: t("family.sharedTasks"),
          }}
        />
      </section>
    </SignedInShell>
  );
}
