"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { FlowShell } from "@/components/shell";
import { Button, Card, StatusChip, cx } from "@/components/ui";
import { trackLabel, trackSummary, usePrototype, type Track } from "@/lib/store";

/**
 * Track selection is the highest-leverage question in onboarding. It changes
 * urgency, the third navigation destination, and whether a 100-day protocol is
 * even the right shape — so the consequences are stated before the choice.
 */
const tracks: Array<{
  id: Track;
  changes: string[];
  urgent?: boolean;
}> = [
  {
    id: "general",
    changes: [
      "A dated protocol, around 100 days, ending in a scheduled retest",
      "Protocol becomes your third navigation tab",
      "Reasoning chains from every result that sits below its reference interval",
    ],
  },
  {
    id: "vasectomy_reversal",
    changes: [
      "Recurring test reminders at the intervals your surgeon directs",
      "Tracking replaces Protocol in your navigation",
      "Recovery context on every result, and no 100-day protocol gate",
    ],
  },
  {
    id: "pre_treatment_preservation",
    urgent: true,
    changes: [
      "An immediate action checklist, shown before anything else",
      "Priority replaces Protocol in your navigation",
      "Lifestyle work is deliberately de-emphasised — it cannot replace banking",
    ],
  },
];

export default function TrackPage() {
  const router = useRouter();
  const { update } = usePrototype();
  const [selected, setSelected] = useState<Track | null>(null);

  const next = () => {
    if (!selected) return;
    update({ track: selected });
    if (selected === "pre_treatment_preservation") router.push("/preservation");
    else if (selected === "vasectomy_reversal") router.push("/onboarding/health");
    else router.push("/onboarding/goal");
  };

  return (
    <FlowShell
      step={5}
      total={10}
      stepLabel="Track"
      back="/start/disclaimer"
      title="Which situation fits you?"
      intro="This changes what PreSeed prioritises, not what it claims. You can change track later from Account."
      footer={
        <Button full size="lg" glyphAfter="chevron-right" disabled={!selected} onClick={next}>
          {selected === "pre_treatment_preservation" ? "Continue to priority actions" : "Continue"}
        </Button>
      }
    >
      <fieldset className="m-0 border-0 p-0">
        <legend className="visually-hidden">Select your track</legend>
        <div className="space-y-3">
          {tracks.map((track) => {
            const isOn = selected === track.id;
            return (
              <label
                key={track.id}
                className={cx(
                  "block cursor-pointer rounded-md border p-4 transition-colors duration-(--ps-duration-fast)",
                  isOn ? "border-accent bg-accent-quiet" : "border-line-control bg-surface-1 hover:bg-surface-2",
                )}
              >
                <input
                  type="radio"
                  name="track"
                  value={track.id}
                  checked={isOn}
                  onChange={() => setSelected(track.id)}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={cx(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                      isOn ? "border-accent bg-accent text-accent-ink" : "border-line-control",
                    )}
                  >
                    {isOn ? <Icon name="check" size={13} /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="t-title-3 text-ink-1">{trackLabel[track.id]}</h2>
                      {track.urgent ? (
                        <StatusChip tone="escalation" glyph="attention">
                          Time-critical
                        </StatusChip>
                      ) : null}
                    </div>
                    <p className="mt-1 t-body-sm text-ink-2">{trackSummary[track.id]}</p>

                    <p className="mt-3 t-micro text-ink-3">What changes</p>
                    <ul className="mt-1.5 space-y-1">
                      {track.changes.map((change) => (
                        <li key={change} className="flex gap-2 t-caption text-ink-2">
                          <Icon name="chevron-right" size={13} className="mt-0.5 shrink-0 text-ink-3" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      {selected === "pre_treatment_preservation" ? (
        <Card tone="escalation" className="mt-4">
          <div className="flex gap-3">
            <Icon name="attention" size={20} className="mt-0.5 shrink-0 text-escalation" />
            <div>
              <h2 className="t-title-3 text-ink-1">We are skipping the questionnaire</h2>
              <p className="mt-1 t-body-sm text-ink-2">
                If treatment has not started, the window matters more than anything a questionnaire could
                tell us. PreSeed takes you straight to the actions that preserve your options, and asks
                about lifestyle later, if at all.
              </p>
            </div>
          </div>
        </Card>
      ) : null}
    </FlowShell>
  );
}
