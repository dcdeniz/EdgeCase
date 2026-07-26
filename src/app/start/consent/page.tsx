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
      title="Use simulated data for this prototype"
      intro="Your answers and demo reports are stored under your account. This remains a research prototype, not a medical device."
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
              Only enter simulated laboratory values and fictional lifestyle information in this
              hackathon environment. Do not upload private medical documents.
            </p>
          </div>
        </div>
      </Card>
      <Card className="mt-3">
        <h2 className="t-title-3 text-ink-1">Safe demo inputs</h2>
        <ul className="mt-2.5 space-y-2 t-body-sm text-ink-2">
          <li>Use the built-in simulated semen and hormone values.</li>
          <li>Use fictional lifestyle and exposure answers.</li>
          <li>Ask general evidence questions without names or identifying details.</li>
        </ul>
      </Card>
    </FlowShell>
  );
}
