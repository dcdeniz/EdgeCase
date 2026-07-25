"use client";

import { DisclaimerFooter, Screen } from "@/components/shell";
import { RiskCard } from "@/components/domain";
import { Card, Disclosure, SectionHeader } from "@/components/ui";
import { riskOutputs } from "@/lib/fixtures";

/**
 * Four endpoints, four different reasons a number is or is not shown. This
 * screen exists as much to specify absence as to present a result — every state
 * is visible before interaction, never after a tap.
 */
export default function RisksPage() {
  const byState = (state: string) => riskOutputs.filter((risk) => risk.state === state);

  return (
    <Screen title="Screening risks" eyebrow="Named endpoints" back="/results">
      <Card tone="information">
        <p className="t-prose text-ink-1">
          A screening risk names one specific endpoint and estimates the chance a measurement falls
          below a declared reference distribution. It is never a diagnosis, and it says nothing about
          conception.
        </p>
      </Card>

      <section className="mt-6" aria-labelledby="hard-limit">
        <SectionHeader id="hard-limit" eyebrow="Hard limit" title="What PreSeed will never output" />
        <div className="space-y-3">
          {byState("unavailable_by_design").map((risk) => (
            <RiskCard key={risk.id} risk={risk} />
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="available">
        <SectionHeader id="available" eyebrow="Imported" title="Generated outside the app" />
        <p className="mb-3 t-body-sm text-ink-2">
          Machine-learning work runs separately, not in this app. Anything imported from it says so, with
          the model version and the date it was produced.
        </p>
        <div className="space-y-3">
          {byState("externally_generated").map((risk) => (
            <RiskCard key={risk.id} risk={risk} />
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="not-available">
        <SectionHeader id="not-available" eyebrow="Not available" title="Nothing to show, and why" />
        <div className="space-y-3">
          {byState("insufficient_data").map((risk) => (
            <RiskCard key={risk.id} risk={risk} />
          ))}
          {byState("pending_model").map((risk) => (
            <RiskCard key={risk.id} risk={risk} />
          ))}
        </div>
      </section>

      <Card className="mt-6">
        <Disclosure label="Why bands rather than percentages" glyph="info">
          <p className="t-prose text-ink-1">
            A percentage implies a calibrated individual probability. The available research does not
            support that: the strongest published work is a retrospective single-centre study that
            demonstrates predictive signal and explicitly requires external and prospective validation.
            Bands communicate ordering without implying precision PreSeed has not earned.
          </p>
        </Disclosure>
        <Disclosure label="What would have to be true before this changed" glyph="target">
          <ul className="space-y-2 t-body-sm text-ink-2">
            <li>An assessment contract defining inputs, outputs, eligibility and uncertainty.</li>
            <li>A model registry, so every prediction stores the version that produced it.</li>
            <li>Participant-level validation with clinic and geographic holdouts.</li>
            <li>Silent prospective validation before any user sees an output.</li>
          </ul>
        </Disclosure>
      </Card>

      <DisclaimerFooter />
    </Screen>
  );
}
