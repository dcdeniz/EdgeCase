"use client";

import { Icon } from "@/components/icons";
import { DisclaimerFooter, SafetyAlert, Screen } from "@/components/shell";
import {
  Button,
  Card,
  Disclosure,
  Field,
  PendingIntegration,
  SectionHeader,
  StatusChip,
  TextInput,
  cx,
} from "@/components/ui";
import { TODAY, daysBetween, formatDate } from "@/lib/format";
import { usePrototype } from "@/lib/store";

/**
 * A navigation and urgency screen, not a measurement one. Nothing here offers to
 * test or improve anything, because neither would help inside the window that
 * matters — and implying otherwise could cost someone their options.
 */
const checklist = [
  {
    id: "specialist",
    title: "Ask for a fertility specialist referral today",
    detail:
      "Meeting a fertility specialist is the single strongest predictor of whether banking actually happens. Ask your oncology team directly, in writing if you can.",
    weight: "Highest impact",
  },
  {
    id: "banking",
    title: "Ask specifically about sperm banking before treatment starts",
    detail:
      "Banking is usually possible in a short window and often needs only one or two visits. It has to be raised before treatment begins.",
    weight: "Time-critical",
  },
  {
    id: "questions",
    title: "Take a written question list to your next appointment",
    detail: "Appointments move fast and this is rarely the main topic. Written questions get answered.",
    weight: "Practical",
  },
  {
    id: "appointment",
    title: "Confirm the banking appointment is booked",
    detail: "A referral is not an appointment. Confirm the date, the location and what to bring.",
    weight: "Confirmation",
  },
];

const questions = [
  "Is my planned treatment likely to affect my fertility?",
  "Can I bank sperm before treatment starts, and how quickly can that happen?",
  "How many samples would you recommend, and how far apart?",
  "What happens if my treatment cannot be delayed?",
  "What are the storage arrangements, costs and time limits?",
  "Who do I contact about this after treatment finishes?",
];

export default function PreservationPage() {
  const { state, update } = usePrototype();
  const { treatmentStart, checklist: done } = state.preservation;
  const daysUntil = treatmentStart ? daysBetween(TODAY, treatmentStart) : null;
  const completed = checklist.filter((item) => done[item.id]).length;

  return (
    <Screen title="Priority" eyebrow="Fertility preservation">
      <SafetyAlert
        severity="escalation"
        title="Preservation comes before anything else in this app"
        body={
          <>
            <p>
              If treatment has not started, banking sperm protects options that lifestyle change cannot
              recover afterwards. Nothing in PreSeed can substitute for it, and nothing in PreSeed should
              delay it.
            </p>
            <p className="mt-2">
              PreSeed makes no testing claim on this track and does not offer a protocol here.
            </p>
          </>
        }
      />

      <Card className="mt-4">
        <Field
          label="When does treatment start?"
          htmlFor="treatmentStart"
          optional
          hint="Used only to show how much time is left. Leave blank if you do not know yet."
        >
          <TextInput
            id="treatmentStart"
            hint
            type="date"
            value={treatmentStart ?? ""}
            onChange={(event) =>
              update({ preservation: { ...state.preservation, treatmentStart: event.target.value || null } })
            }
          />
        </Field>

        {daysUntil != null ? (
          <div
            className={cx(
              "rounded-sm px-3 py-3",
              daysUntil <= 14 ? "bg-escalation-quiet" : "bg-attention-quiet",
            )}
          >
            <p className="t-micro text-ink-3">Time before treatment</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="t-display-2 text-ink-1">{Math.max(0, -daysUntil)}</span>
              <span className="t-body-sm text-ink-2">days</span>
            </p>
            <p className="mt-1 t-caption text-ink-2">
              Treatment recorded as starting {formatDate(treatmentStart!)}. Banking usually needs at
              least a few days from referral to appointment.
            </p>
          </div>
        ) : null}
      </Card>

      <section className="mt-6" aria-labelledby="actions">
        <SectionHeader
          id="actions"
          eyebrow="Do these now"
          title="Immediate actions"
          action={
            <StatusChip tone={completed === checklist.length ? "supported" : "attention"}>
              {completed} of {checklist.length}
            </StatusChip>
          }
        />
        <ul className="space-y-2.5">
          {checklist.map((item) => {
            const checked = Boolean(done[item.id]);
            return (
              <li key={item.id}>
                <label
                  className={cx(
                    "flex cursor-pointer items-start gap-3 rounded-md border p-4",
                    checked ? "border-accent bg-accent-quiet" : "border-line-control bg-surface-1",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      update({
                        preservation: {
                          ...state.preservation,
                          checklist: { ...done, [item.id]: event.target.checked },
                        },
                      })
                    }
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cx(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-xs border",
                      checked ? "border-accent bg-accent text-accent-ink" : "border-line-control",
                    )}
                  >
                    {checked ? <Icon name="check" size={13} /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="t-title-3 text-ink-1">{item.title}</span>
                      <StatusChip tone={item.weight === "Highest impact" ? "escalation" : "neutral"}>
                        {item.weight}
                      </StatusChip>
                    </span>
                    <span className="mt-1 block t-body-sm text-ink-2">{item.detail}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6" aria-labelledby="questions-heading">
        <SectionHeader
          id="questions-heading"
          eyebrow="Take these with you"
          title="Questions for your oncology team"
        />
        <Card>
          <ol className="space-y-2.5">
            {questions.map((question, index) => (
              <li key={question} className="flex gap-3">
                <span className="t-mono text-ink-3">{index + 1}</span>
                <span className="t-body-sm text-ink-1">{question}</span>
              </li>
            ))}
          </ol>
          <Button variant="secondary" full className="mt-4" glyph="external">
            Share this list
          </Button>
        </Card>
      </section>

      <section className="mt-6" aria-labelledby="services">
        <SectionHeader id="services" eyebrow="Find a service" title="Banking services near you" level={3} />
        <PendingIntegration
          title="Directory of licensed storage services"
          body="A searchable list of licensed sperm-banking services with locations, referral routes and typical waiting times would sit here. It needs a verified service directory, which is not connected."
          dependency="a licensed-service directory, not yet sourced"
        />
      </section>

      <Card className="mt-4">
        <Disclosure label="Why this track looks so different" glyph="info" defaultOpen>
          <p className="t-prose text-ink-1">
            Everywhere else, PreSeed measures and explains. Here it navigates. The gap for men facing
            treatment is not that testing is hard — it is that nobody hands them a clear, fast pathway in
            a narrow window. Counselling and specialist contact are what change whether banking happens,
            so those are what this screen is built around.
          </p>
        </Disclosure>
        <Disclosure label="What PreSeed will not claim here" glyph="unavailable">
          <ul className="space-y-2 t-body-sm text-ink-2">
            <li>That any lifestyle change protects fertility through cancer treatment.</li>
            <li>That app-based improvement can substitute for banking.</li>
            <li>Anything about your likely outcome after treatment.</li>
          </ul>
        </Disclosure>
      </Card>

      <DisclaimerFooter />
    </Screen>
  );
}
