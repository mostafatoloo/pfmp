import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <main className="pfmp-main" style={{ paddingTop: "3rem" }}>
      <section className="panel">
        <h1>PFMP</h1>
        <p>Sign in with an email magic link. Passkeys are scaffolded where the browser supports WebAuthn.</p>
        <SignInForm />
      </section>
    </main>
  );
}
