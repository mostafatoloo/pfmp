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
            tabSignIn: t("auth.tabSignIn"),
            tabSignUp: t("auth.tabSignUp"),
            tabForgot: t("auth.tabForgot"),
            usernameLabel: t("auth.usernameLabel"),
            usernamePlaceholder: t("auth.usernamePlaceholder"),
            mobileLabel: t("auth.mobileLabel"),
            mobilePlaceholder: t("auth.mobilePlaceholder"),
            mobileHint: t("auth.mobileHint"),
            codeLabel: t("auth.codeLabel"),
            codePlaceholder: t("auth.codePlaceholder"),
            sendResetCode: t("auth.sendResetCode"),
            resetPassword: t("auth.resetPassword"),
            codeSent: t("auth.codeSent"),
            passwordLabel: t("auth.passwordLabel"),
            passwordPlaceholder: t("auth.passwordPlaceholder"),
            newPasswordLabel: t("auth.newPasswordLabel"),
            signIn: t("auth.signIn"),
            signUp: t("auth.signUp"),
            switchToSignIn: t("auth.switchToSignIn"),
            switchToSignUp: t("auth.switchToSignUp"),
            switchToForgot: t("auth.switchToForgot"),
            backToSignIn: t("auth.backToSignIn"),
            nameLabel: t("auth.nameLabel"),
            namePlaceholder: t("auth.namePlaceholder"),
            signOut: t("common.signOut"),
          }}
        />
      </section>
    </main>
  );
}
