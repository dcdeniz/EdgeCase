"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlowShell } from "@/components/shell";
import { Button, Card, Field, Segmented, TextInput } from "@/components/ui";
import { usePrototype } from "@/lib/store";

export default function AccountPage() {
  const router = useRouter();
  const { update } = usePrototype();
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [email, setEmail] = useState("");

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
          onClick={() => {
            update({ signedIn: true, email: email || "demo@preseed.example" });
            router.push("/start/privacy");
          }}
        >
          {mode === "create" ? "Create account" : "Sign in"}
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
          />
        </Field>
      </form>

      <Card className="mt-2">
        <p className="t-micro text-ink-3">Prototype</p>
        <p className="mt-1.5 t-body-sm text-ink-2">
          This screen does not create a real account. No credentials are sent anywhere, and no data
          leaves this device.
        </p>
      </Card>
    </FlowShell>
  );
}
