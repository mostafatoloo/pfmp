import { createTranslator } from "@pfmp/i18n";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  const { t } = createTranslator("en");
  return (
    <main className="pfmp-main" style={{ paddingBlockStart: "3rem" }}>
      <section className="panel" style={{ maxWidth: "28rem", marginInline: "auto" }}>
        <h1>{t("auth.signInTitle")}</h1>
        <p className="panel-lead">{t("auth.signInSubtitle")}</p>
        <SignInForm
          labels={{
            email: t("auth.emailLabel"),
            emailPlaceholder: t("auth.emailPlaceholder"),
            sendMagicLink: t("auth.sendMagicLink"),
            passkey: t("auth.passkey"),
            signOut: t("common.signOut"),
            magicLinkSent: t("auth.magicLinkSent"),
          }}
        />
      </section>
    </main>
  );
}
