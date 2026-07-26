"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlowShell } from "@/components/shell";
import { Button, Card, Field, TextInput } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { usePrototype } from "@/lib/store";

export default function AccountPage() {
  const router = useRouter();
  const { reset, update } = usePrototype();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase authentication is not configured for this deployment.");
      return;
    }
    setPending(true);
    setError(null);
    const result = mode === "sign_in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() || email.split("@")[0] } },
        });
    setPending(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (!result.data.session) {
      setError("Check your email to confirm the account, then sign in.");
      return;
    }
    reset();
    update({ signedIn: true, email });
    router.push("/start/privacy");
    router.refresh();
  }

  return (
    <FlowShell
      step={1}
      total={10}
      stepLabel="Account"
      back="/"
      title={mode === "sign_in" ? "Sign in to PreSeed" : "Create your PreSeed account"}
      intro="Your onboarding answers and simulated laboratory reports stay attached to this account."
      footer={
        <Button full size="lg" glyphAfter="chevron-right" disabled={pending || !email || password.length < 6} onClick={submit}>
          {pending ? "Signing in…" : mode === "sign_in" ? "Sign in and start onboarding" : "Create account"}
        </Button>
      }
    >
      <Card>
        {mode === "sign_up" ? (
          <Field label="Name" htmlFor="account-name" optional>
            <TextInput id="account-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
        ) : null}
        <Field label="Email" htmlFor="account-email">
          <TextInput id="account-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="Password" htmlFor="account-password">
          <TextInput id="account-password" type="password" autoComplete={mode === "sign_in" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        {error ? <p role="alert" className="mt-2 t-body-sm text-danger">{error}</p> : null}
      </Card>
      <button
        type="button"
        className="mt-4 w-full text-center t-body-sm font-medium text-accent"
        onClick={() => { setMode((value) => value === "sign_in" ? "sign_up" : "sign_in"); setError(null); }}
      >
        {mode === "sign_in" ? "Need an account? Create one" : "Already have an account? Sign in"}
      </button>
    </FlowShell>
  );
}
