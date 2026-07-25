"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlowShell } from "@/components/shell";
import { Button, Card, Field, Segmented, TextInput } from "@/components/ui";
import { usePrototype } from "@/lib/store";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AccountPage() {
  const router = useRouter();
  const { update } = usePrototype();
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitAccount() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase browser environment variables are not configured.");
      return;
    }
    setPending(true);
    setError(null);
    const result = mode === "create"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (!result.data.session) {
      setError("Check your email to confirm the account, then sign in.");
      return;
    }
    update({ signedIn: true, email });
    router.push("/start/privacy");
  }

  return (
    <FlowShell
      step={1}
      total={10}
      stepLabel="Account"
      back="/"
      title={mode === "create" ? "Create your account" : "Sign in"}
      intro="Your clinical data is private to your account. Nothing is shared with a partner, clinic or employer unless you export it yourself."
      footer={
        <Button
          full
          size="lg"
          glyphAfter="chevron-right"
          disabled={pending || !email || password.length < (mode === "create" ? 10 : 1)}
          onClick={submitAccount}
        >
          {pending ? "Working…" : mode === "create" ? "Create account" : "Sign in"}
        </Button>
      }
    >
      <Segmented
        label="Account action"
        value={mode}
        onChange={setMode}
        options={[
          { value: "create", label: "Create account" },
          { value: "signin", label: "Sign in" },
        ]}
      />

      <form className="mt-6" onSubmit={(event) => event.preventDefault()}>
        <Field label="Email" htmlFor="email" hint="Used to sign in and to recover your account.">
          <TextInput
            id="email"
            type="email"
            required
            hint
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          hint={mode === "create" ? "At least 10 characters." : undefined}
        >
          <TextInput
            id="password"
            type="password"
            required
            hint={mode === "create"}
            minLength={mode === "create" ? 10 : undefined}
            autoComplete={mode === "create" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
      </form>

      {error ? (
        <p role="alert" className="mt-3 t-body-sm text-danger">{error}</p>
      ) : null}

      <Card className="mt-2">
        <p className="t-micro text-ink-3">Prototype</p>
        <p className="mt-1.5 t-body-sm text-ink-2">
          Accounts are handled by Supabase Auth. Clinical records remain protected by per-user
          PostgreSQL row-level security.
        </p>
      </Card>
    </FlowShell>
  );
}
