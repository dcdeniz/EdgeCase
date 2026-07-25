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
      stepLabel="Demo acknowledgement"
      back="/start/privacy"
      title="Use simulated data only"
      intro="This public hackathon mode has no private accounts. The acknowledgement below is a warning, not health-data consent."
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
            <h2 className="t-title-3 text-ink-1">Everything is shared</h2>
            <p className="mt-1.5 t-body-sm text-ink-2">
              Other visitors can see and change demo records. Never enter real health information,
              personal identifiers, credentials or private documents.
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
