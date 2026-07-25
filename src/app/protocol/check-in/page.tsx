"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { FlowShell } from "@/components/shell";
import { ProtocolAction } from "@/components/protocol";
import {
  Button,
  Card,
  Field,
  InlineStatus,
  RatingControl,
  SectionHeader,
  TextArea,
  announce,
} from "@/components/ui";
import { TODAY } from "@/lib/format";
import { adherenceWindow, itemsForWeek, protocolWeek, usePrototype } from "@/lib/store";

/**
 * Check-in rewards consistency and honesty, not outcomes. There is no streak to
 * protect and no score to lose, so "skipped" is a genuinely safe answer to give.
 */
export default function CheckInPage() {
  const router = useRouter();
  const { state, addCheckIn, seedDemo } = usePrototype();
  const [step, setStep] = useState<1 | 2>(1);
  const [adherenceRating, setAdherenceRating] = useState<number>();
  const [wellbeingRating, setWellbeingRating] = useState<number>();
  const [notes, setNotes] = useState("");

  const protocol = state.protocol;
  const week = protocol ? protocolWeek(protocol) : 1;
  const items = protocol ? itemsForWeek(protocol, week) : [];
  const window = adherenceWindow(state, 14);

  const submit = () => {
    addCheckIn({ adherenceRating, wellbeingRating, notes: notes || undefined });
    announce("Check-in saved");
    // A low self-rating is what prompts a proposed adaptation — never a silent edit.
    if ((adherenceRating ?? 5) <= 3) seedDemo("adaptation");
    router.push("/protocol");
  };

  return (
    <FlowShell
      step={step}
      total={2}
      stepLabel={step === 1 ? "Today's actions" : "How it is going"}
      back={step === 1 ? "/today" : undefined}
      title={step === 1 ? "What happened today?" : "Two questions"}
      intro={
        step === 1
          ? "Log honestly. Skipped is useful information — it is what tells PreSeed a target is wrong rather than that you are."
          : "Your answers decide what PreSeed proposes changing. It will propose; you decide."
      }
      footer={
        <div className="flex gap-2">
          {step === 2 ? (
            <Button variant="secondary" full onClick={() => setStep(1)}>
              Back
            </Button>
          ) : null}
          {step === 1 ? (
            <Button full size="lg" glyphAfter="chevron-right" onClick={() => setStep(2)}>
              Continue
            </Button>
          ) : (
            <Button full size="lg" glyph="check" onClick={submit}>
              Save check-in
            </Button>
          )}
        </div>
      }
    >
      {step === 1 ? (
        <>
          {window.percent != null ? (
            <InlineStatus tone="accent">
              {window.percent}% of logged actions over the last 14 days
            </InlineStatus>
          ) : null}

          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <ProtocolAction key={item.id} item={item} date={TODAY} showLink={false} />
            ))}
          </div>

          {items.length === 0 ? (
            <Card>
              <p className="t-body-sm text-ink-2">No actions are scheduled for this week.</p>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <RatingControl
            legend="How manageable was this week?"
            hint="About the plan, not about you. A low answer means the plan needs adjusting."
            name="adherenceRating"
            value={adherenceRating}
            onChange={setAdherenceRating}
            lowLabel="Unmanageable"
            highLabel="Easy"
          />

          <RatingControl
            legend="How have you been feeling?"
            hint="Recorded as context. It is not part of your readiness score."
            name="wellbeingRating"
            value={wellbeingRating}
            onChange={setWellbeingRating}
            lowLabel="Poorly"
            highLabel="Well"
          />

          <Field
            label="Anything to add"
            htmlFor="checkin-notes"
            optional
            hint="What got in the way, what worked, anything you want on record before an appointment."
          >
            <TextArea
              id="checkin-notes"
              hint
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="The fish target is expensive and I have been skipping it."
            />
          </Field>

          <Card>
            <SectionHeader eyebrow="What happens next" title="Nothing, unless you agree to it" level={3} />
            <ul className="space-y-2">
              {[
                "If a target keeps coming back as partly done, PreSeed proposes a smaller version of it.",
                "Proposals are shown as a list of specific changes with the reason attached.",
                "Accepting creates a new protocol version. Your previous version stays on record.",
                "Nothing about your plan changes without you pressing accept.",
              ].map((line) => (
                <li key={line} className="flex gap-2.5 t-body-sm text-ink-2">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-accent" />
                  {line}
                </li>
              ))}
            </ul>
          </Card>

          <p className="mt-4 t-caption text-ink-3">
            Your check-in is not a medical assessment and does not change any clinical output.
          </p>
        </>
      )}
    </FlowShell>
  );
}
