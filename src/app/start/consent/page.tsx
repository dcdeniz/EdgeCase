"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { FlowShell } from "@/components/shell";
import { Button, Card } from "@/components/ui";

export default function ConsentPage() {
  const router = useRouter();
  return (
    <FlowShell
      step={3}
      total={10}
      stepLabel="Consent"
      back="/start/privacy"
      title="How PreSeed handles your data"
      intro="Your answers and reports are stored under your account. PreSeed is not a medical device."
      footer={
        <Button full size="lg" glyphAfter="chevron-right" onClick={() => router.push("/start/disclaimer")}>
          I understand — continue
        </Button>
      }
    >
      <Card tone="attention">
        <div className="flex gap-3">
          <Icon name="attention" size={20} className="mt-0.5 shrink-0 text-attention" />
          <div>
            <h2 className="t-title-3 text-ink-1">Keep the showcase synthetic</h2>
            <p className="mt-1.5 t-body-sm text-ink-2">
              Enter only information you are comfortable keeping in your record. Everything can be
              deleted at any time.
            </p>
          </div>
        </div>
      </Card>
      <Card className="mt-3">
        <h2 className="t-title-3 text-ink-1">Quick start</h2>
        <ul className="mt-2.5 space-y-2 t-body-sm text-ink-2">
          <li>Use the built-in sample semen and hormone values.</li>
          <li>Answer the lifestyle questions at your own pace.</li>
          <li>Ask general evidence questions without names or identifying details.</li>
        </ul>
      </Card>
    </FlowShell>
  );
}
