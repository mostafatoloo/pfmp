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
            tabSms: t("auth.tabSms"),
            tabPassword: t("auth.tabPassword"),
            mobileLabel: t("auth.mobileLabel"),
            mobilePlaceholder: t("auth.mobilePlaceholder"),
            codeLabel: t("auth.codeLabel"),
            codePlaceholder: t("auth.codePlaceholder"),
            sendCode: t("auth.sendCode"),
            verifyCode: t("auth.verifyCode"),
            codeSent: t("auth.codeSent"),
            emailLabel: t("auth.emailLabel"),
            emailPlaceholder: t("auth.emailPlaceholder"),
            passwordLabel: t("auth.passwordLabel"),
            passwordPlaceholder: t("auth.passwordPlaceholder"),
            signInPassword: t("auth.signInPassword"),
            signUpPassword: t("auth.signUpPassword"),
            nameLabel: t("auth.nameLabel"),
            setPasswordHint: t("auth.setPasswordHint"),
            setPassword: t("auth.setPassword"),
            passwordSaved: t("auth.passwordSaved"),
            passkey: t("auth.passkey"),
            signOut: t("common.signOut"),
          }}
        />
      </section>
    </main>
  );
}
