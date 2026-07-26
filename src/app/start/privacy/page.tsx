"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { FlowShell } from "@/components/shell";
import { Button, Card, Disclosure } from "@/components/ui";

const promises = [
  {
    glyph: "attention" as const,
    title: "Your record, in one place",
    body: "Everything you enter lives in your account record and is visible only from your session.",
  },
  {
    glyph: "unavailable" as const,
    title: "You control what goes in",
    body: "Your reports and answers stay attached to your account, and are shared with no one without your consent.",
  },
  {
    glyph: "evidence" as const,
    title: "Evidence questions use an external API",
    body: "Questions and retrieved evidence passages may be sent to the configured AI provider to generate a cited explanation.",
  },
  {
    glyph: "info" as const,
    title: "Delete anything, any time",
    body: "Results, answers and protocol history can be removed from your record whenever you choose.",
  },
];

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <FlowShell
      step={2}
      total={10}
      stepLabel="Privacy"
      back="/start/account"
      title="Your data"
      intro="How PreSeed stores and uses what you enter."
      footer={
        <Button full size="lg" glyphAfter="chevron-right" onClick={() => router.push("/start/consent")}>
          Continue
        </Button>
      }
    >
      <ul className="space-y-2.5">
        {promises.map((promise) => (
          <li key={promise.title}>
            <Card>
              <div className="flex gap-3">
                <Icon name={promise.glyph} size={20} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <h2 className="t-title-3 text-ink-1">{promise.title}</h2>
                  <p className="mt-1 t-body-sm text-ink-2">{promise.body}</p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-md border border-hairline bg-surface-1 px-4">
        <Disclosure label="What PreSeed stores" glyph="info">
          <ul className="space-y-2 t-body-sm text-ink-2">
            <li>Clinical results you enter or upload, with their unit, source and verification state.</li>
            <li>Your onboarding answers.</li>
            <li>Your protocol versions, adherence records and check-ins.</li>
            <li>Which evidence cards you have opened, so the library can show what you have read.</li>
          </ul>
        </Disclosure>
        <Disclosure label="What PreSeed never stores" glyph="unavailable">
          <ul className="space-y-2 t-body-sm text-ink-2">
            <li>Payment details or government identifiers.</li>
            <li>Anything entered outside your own account record.</li>
          </ul>
        </Disclosure>
      </div>
    </FlowShell>
  );
}
