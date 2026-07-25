"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { FlowShell, PROTOTYPE_DISCLAIMER } from "@/components/shell";
import { Button, Card, cx } from "@/components/ui";
import { usePrototype } from "@/lib/store";

const limits = [
  "This is a research prototype, not a medical device.",
  "Nothing here is a diagnosis.",
  "It does not replace laboratory or clinical testing.",
  "It makes no claim about conception or pregnancy.",
  "It cannot confirm azoospermia. A zero or extremely low result needs laboratory confirmation.",
  "It does not diagnose endocrine conditions or recommend hormone treatment.",
  "It never tells you to start or stop a prescribed medicine.",
  "Demonstration data is simulated and labelled wherever it appears.",
];

export default function DisclaimerPage() {
  const router = useRouter();
  const { state, update } = usePrototype();
  const acknowledged = state.consents.disclaimer;

  return (
    <FlowShell
      step={4}
      total={10}
      stepLabel="Research prototype"
      back="/start/consent"
      title="Before you rely on anything here"
      intro="This is the one screen in PreSeed that asks you to read a list. Everything after it is designed to keep these limits visible without repeating them at you."
      footer={
        <Button
          full
          size="lg"
          glyphAfter="chevron-right"
          disabled={!acknowledged}
          onClick={() => router.push("/start/track")}
        >
          I understand
        </Button>
      }
    >
      <Card tone="attention">
        <p className="t-prose text-ink-1">{PROTOTYPE_DISCLAIMER}</p>
      </Card>

      <ul className="mt-4 space-y-2">
        {limits.map((limit) => (
          <li key={limit} className="flex gap-2.5 t-body-sm text-ink-2">
            <Icon name="unavailable" size={16} className="mt-0.5 shrink-0 text-ink-3" />
            {limit}
          </li>
        ))}
      </ul>

      <label
        className={cx(
          "mt-5 flex min-h-(--ps-touch-min) cursor-pointer items-start gap-3 rounded-md border p-4",
          acknowledged ? "border-accent bg-accent-quiet" : "border-line-control bg-surface-1",
        )}
      >
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) =>
            update({ consents: { ...state.consents, disclaimer: event.target.checked, privacy: true } })
          }
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className={cx(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-xs border",
            acknowledged ? "border-accent bg-accent text-accent-ink" : "border-line-control",
          )}
        >
          {acknowledged ? <Icon name="check" size={13} /> : null}
        </span>
        <span className="t-body-sm text-ink-1">
          I understand PreSeed is a research prototype and not a medical device.
        </span>
      </label>
    </FlowShell>
  );
}
