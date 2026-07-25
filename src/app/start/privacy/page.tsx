"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { FlowShell } from "@/components/shell";
import { Button, Card, Disclosure } from "@/components/ui";

const promises = [
  {
    glyph: "attention" as const,
    title: "This is a shared public demo",
    body: "There is no login or private account. Every visitor uses the same demo record and can see or replace data entered through the prototype.",
  },
  {
    glyph: "unavailable" as const,
    title: "Do not enter real health information",
    body: "Use simulated hackathon data only. Names, contact details, real laboratory reports and identifiable medical information do not belong in this environment.",
  },
  {
    glyph: "evidence" as const,
    title: "Evidence questions use an external API",
    body: "Questions, shared demo context and retrieved evidence passages may be sent to the configured AI provider to generate a cited explanation.",
  },
  {
    glyph: "info" as const,
    title: "No privacy expectation",
    body: "This mode optimises for a short hackathon demonstration, not confidentiality, multi-user isolation or production use.",
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
      title="Public demo data warning"
      intro="PreSeed is running without accounts or private routes for this hackathon demo."
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
        <Disclosure label="What the shared demo stores" glyph="info">
          <ul className="space-y-2 t-body-sm text-ink-2">
            <li>Clinical results you enter or upload, with their unit, source and verification state.</li>
            <li>Onboarding answers entered by any demo visitor.</li>
            <li>Your protocol versions, adherence records and check-ins.</li>
            <li>Which evidence cards you have opened, so the library can show what you have read.</li>
          </ul>
        </Disclosure>
        <Disclosure label="What you must not enter" glyph="unavailable">
          <ul className="space-y-2 t-body-sm text-ink-2">
            <li>Real names, email addresses, phone numbers or other identifiers.</li>
            <li>Real laboratory reports, medical records or treatment information.</li>
            <li>Anything you would not deliberately show to every hackathon visitor.</li>
          </ul>
        </Disclosure>
      </div>
    </FlowShell>
  );
}
