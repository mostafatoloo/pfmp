import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requirePageWorkspace } from "@/lib/require-page-auth";
import { createTranslator, enabledLocales } from "@pfmp/i18n";
import { LanguageForm } from "./language-form";
import { SignOutButton } from "./sign-out-button";
import { TelegramLinkPanel } from "./telegram-link-panel";

export default async function SettingsPage() {
  const ctx = await requirePageWorkspace(await headers());
  const { t } = createTranslator(ctx.locale);
  const languages = enabledLocales();

  return (
    <SignedInShell pathname="/settings" locale={ctx.locale}>
      <section className="panel stack">
        <div>
          <h1>{t("settings.title")}</h1>
          <p className="panel-lead">Profile, locale, and Telegram preferences.</p>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>{t("settings.profile")}</h2>
          <dl className="stack" style={{ gap: "0.5rem" }}>
            <div>
              <dt className="muted">{t("settings.email")}</dt>
              <dd className="bidi-isolate" style={{ margin: 0 }}>
                {ctx.email}
              </dd>
            </div>
            <div>
              <dt className="muted">{t("common.timezone")}</dt>
              <dd style={{ margin: 0 }}>{ctx.timezone}</dd>
            </div>
            <div>
              <LanguageForm
                initialLocale={ctx.locale}
                languageLabel={t("common.language")}
                hint={t("settings.languageHint")}
                options={languages.map((l) => ({
                  code: l.code,
                  label:
                    l.code === "finglish"
                      ? "Finglish (English UI · RTL content)"
                      : l.code === "fa"
                        ? `${l.nativeName} / Persian`
                        : l.nativeName,
                }))}
              />
            </div>
            <div>
              <dt className="muted">{t("settings.workspace")}</dt>
              <dd style={{ margin: 0 }}>
                {ctx.workspace.name}{" "}
                <span className="badge">{ctx.workspace.kind}</span>
              </dd>
            </div>
          </dl>
        </div>

        <TelegramLinkPanel
          labels={{
            title: t("settings.telegram"),
            hint: t("settings.telegramHint"),
            link: t("settings.telegramLink"),
            unlink: t("settings.telegramUnlink"),
            linked: t("settings.telegramLinked"),
            notLinked: t("settings.telegramNotLinked"),
          }}
        />

        <div className="card">
          <p className="muted">{t("settings.signOutHint")}</p>
          <SignOutButton label={t("common.signOut")} />
        </div>
      </section>
    </SignedInShell>
  );
}
