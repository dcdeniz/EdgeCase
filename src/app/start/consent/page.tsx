"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { FlowShell } from "@/components/shell";
import { Button, Card, cx } from "@/components/ui";
import { usePrototype } from "@/lib/store";

export default function ConsentPage() {
  const router = useRouter();
  const { state, update } = usePrototype();
  const consented = state.consents.healthData;

  return (
    <FlowShell
      step={3}
      total={10}
      stepLabel="Health-data consent"
      back="/start/privacy"
      title="Consent to process health data"
      intro="Semen analyses, hormone results and medical history are a special category of personal data. PreSeed needs your explicit permission to process them, and you can withdraw it at any time."
      footer={
        <Button
          full
          size="lg"
          glyphAfter="chevron-right"
          disabled={!consented}
          onClick={() => router.push("/start/disclaimer")}
        >
          Continue
        </Button>
      }
    >
      <Card>
        <h2 className="t-title-3 text-ink-1">What you are consenting to</h2>
        <ul className="mt-2.5 space-y-2">
          {[
            "Storing the clinical results and history you enter, so they can be shown back to you over time.",
            "Using your answers to calculate a readiness score and select recommendations.",
            "Keeping a record of protocol versions and adherence, so changes are auditable.",
          ].map((line) => (
            <li key={line} className="flex gap-2.5 t-body-sm text-ink-2">
              <Icon name="check" size={16} className="mt-0.5 shrink-0 text-accent" />
              {line}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-3">
        <h2 className="t-title-3 text-ink-1">What you are not consenting to</h2>
        <ul className="mt-2.5 space-y-2">
          {[
            "Research use. Nothing in this prototype contributes to a study or a training dataset.",
            "Sharing with any third party, including clinics, insurers and employers.",
            "Marketing of any kind.",
          ].map((line) => (
            <li key={line} className="flex gap-2.5 t-body-sm text-ink-2">
              <Icon name="unavailable" size={16} className="mt-0.5 shrink-0 text-ink-3" />
              {line}
            </li>
          ))}
        </ul>
      </Card>

      <label
        className={cx(
          "mt-4 flex min-h-(--ps-touch-min) cursor-pointer items-start gap-3 rounded-md border p-4",
          consented ? "border-accent bg-accent-quiet" : "border-line-control bg-surface-1",
        )}
      >
        <input
          type="checkbox"
          checked={consented}
          onChange={(event) =>
            update({ consents: { ...state.consents, healthData: event.target.checked } })
          }
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className={cx(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-xs border",
            consented ? "border-accent bg-accent text-accent-ink" : "border-line-control",
          )}
        >
          {consented ? <Icon name="check" size={13} /> : null}
        </span>
        <span className="t-body-sm text-ink-1">
          I consent to PreSeed processing my health data for the purposes described above.
        </span>
      </label>

      <p className="mt-3 t-caption text-ink-3">
        You can withdraw consent from Account at any time. Withdrawing stops processing and offers you an
        export and deletion.
      </p>
    </FlowShell>
  );
}
