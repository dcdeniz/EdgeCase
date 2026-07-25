"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { FlowShell } from "@/components/shell";
import { Button, Card, Disclosure } from "@/components/ui";

const promises = [
  {
    glyph: "lock" as const,
    title: "Your results are yours",
    body: "Clinical data is scoped to your account at the database level. No other account can read it, and PreSeed staff do not browse it.",
  },
  {
    glyph: "unavailable" as const,
    title: "Nothing is sold or shared for advertising",
    body: "No clinical or behavioural data is sold, brokered or used to target advertising. There is no advertising in PreSeed.",
  },
  {
    glyph: "account" as const,
    title: "No partner, clinic or employer access",
    body: "Nobody is given a view of your account. If you want to share a result, you export it yourself.",
  },
  {
    glyph: "close" as const,
    title: "Deletion means deletion",
    body: "Deleting your account removes your clinical records, protocol history and logs. You can also export everything first.",
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
      title="What PreSeed does with your data"
      intro="The short version, before the consent question on the next screen."
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
        <Disclosure label="What is actually stored" glyph="info">
          <ul className="space-y-2 t-body-sm text-ink-2">
            <li>Clinical results you enter or upload, with their unit, source and verification state.</li>
            <li>Your onboarding answers, including any you chose not to answer.</li>
            <li>Your protocol versions, adherence records and check-ins.</li>
            <li>Which evidence cards you have opened, so the library can show what you have read.</li>
          </ul>
        </Disclosure>
        <Disclosure label="What is never stored" glyph="unavailable">
          <ul className="space-y-2 t-body-sm text-ink-2">
            <li>Images of your body. PreSeed has no camera feature for clinical measurement.</li>
            <li>Location history. Air-quality context uses a coarse area, not a movement trail.</li>
            <li>Anything about a partner. PreSeed is a single-account product.</li>
          </ul>
        </Disclosure>
      </div>
    </FlowShell>
  );
}
