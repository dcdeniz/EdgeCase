"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { FlowShell } from "@/components/shell";
import { Button, Card, ChoiceGroup } from "@/components/ui";
import { TODAY, addDays, formatDate } from "@/lib/format";
import { usePrototype } from "@/lib/store";

const lengths = [60, 90, 100, 120] as const;

/**
 * The protocol length and retest date update as the target moves. Borrowed from
 * Cal AI's pace selector: it makes the dated protocol — PreSeed's actual
 * differentiator — concrete at minute two rather than minute twenty.
 */
export default function GoalPage() {
  const router = useRouter();
  const { state, setAnswers } = usePrototype();
  const days = state.answers.protocolDays ?? 100;
  const start = addDays(TODAY, 2);

  return (
    <FlowShell
      step={6}
      total={10}
      stepLabel="Goal and timeline"
      back="/start/track"
      title="When are you hoping to conceive?"
      intro="This changes the urgency and the shape of your plan. It does not change the underlying biology or any claim PreSeed makes."
      footer={
        <Button
          full
          size="lg"
          glyphAfter="chevron-right"
          disabled={!state.answers.goalTiming}
          onClick={() => router.push("/onboarding/lifestyle")}
        >
          Continue
        </Button>
      }
    >
      <ChoiceGroup
        legend="Timeline"
        name="goalTiming"
        value={state.answers.goalTiming}
        onChange={(value) => setAnswers({ goalTiming: value })}
        options={[
          {
            value: "trying_now",
            label: "Trying now",
            note: "Priority goes to a clinical baseline and surfacing anything that needs a clinician.",
          },
          {
            value: "within_3_months",
            label: "Within three months",
            note: "One full protocol cycle, then a comparable retest.",
          },
          {
            value: "within_year",
            label: "Within a year",
            note: "Room for three or four cycles: baseline, change, retest, refine.",
          },
          {
            value: "few_years",
            label: "A few years away",
            note: "Sustainable habits and avoiding major risks, without unnecessary testing.",
          },
        ]}
      />

      <fieldset className="mb-5">
        <legend className="t-body-sm font-medium text-ink-1">Protocol length</legend>
        <p className="mt-1 t-caption text-ink-3">
          Sperm take roughly 64 to 74 days to mature, so anything shorter than about 60 days cannot show
          a change in a measurement.
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {lengths.map((length) => (
            <label
              key={length}
              className={`flex min-h-(--ps-touch-min) cursor-pointer flex-col items-center justify-center rounded-sm border ${
                days === length
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-line-control bg-surface-1 text-ink-2 hover:bg-surface-3"
              }`}
            >
              <input
                type="radio"
                name="protocolDays"
                value={length}
                checked={days === length}
                onChange={() => setAnswers({ protocolDays: length })}
                className="sr-only"
              />
              <span className="t-body font-medium tabular-nums">{length}</span>
              <span className="t-caption">days</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* The live consequence of the choice above. */}
      <Card tone="accent">
        <p className="t-micro text-accent">Your plan would run</p>
        <dl className="mt-2 space-y-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="t-body-sm text-ink-2">Starts</dt>
            <dd className="t-body-sm font-medium text-ink-1">{formatDate(start)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="t-body-sm text-ink-2">Closing analysis</dt>
            <dd className="t-body-sm font-medium text-ink-1">{formatDate(addDays(start, days - 2))}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="t-body-sm text-ink-2">Weeks of actions</dt>
            <dd className="t-mono text-ink-1">{Math.ceil(days / 7)}</dd>
          </div>
        </dl>
        <p className="mt-3 flex items-start gap-2 t-caption text-ink-2">
          <Icon name="info" size={15} className="mt-0.5 shrink-0 text-accent" />
          Dates are set once you enter a baseline result, so the plan starts from a real measurement.
        </p>
      </Card>
    </FlowShell>
  );
}
