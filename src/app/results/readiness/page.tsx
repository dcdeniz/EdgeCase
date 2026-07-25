"use client";

import { ScoreMeter } from "@/components/charts";
import { DisclaimerFooter, SafetyAlert, Screen } from "@/components/shell";
import { DomainDetail } from "@/components/domain";
import { Card, Disclosure, MetaList, SectionHeader, StatusChip } from "@/components/ui";
import { domainOrder, domains } from "@/lib/readiness";
import { usePrototype } from "@/lib/store";

export default function ReadinessPage() {
  const { readiness } = usePrototype();
  const covered = readiness.domains.filter((domain) => domain.score != null);

  return (
    <Screen title="Readiness score" eyebrow="Modifiable behaviours" back="/results">
      <Card>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="t-micro text-ink-3">{readiness.band.label}</p>
            <p className="mt-1 t-body-sm text-ink-2">{readiness.band.description}</p>
          </div>
          <span className="flex shrink-0 items-baseline gap-1">
            <span className="t-display-1 text-ink-1">{readiness.score ?? "—"}</span>
            <span className="t-caption text-ink-3">/100</span>
          </span>
        </div>

        <div className="mt-4">
          <ScoreMeter value={readiness.score} label="Readiness score out of 100" />
        </div>

        {/* The label the brief requires, given the prominence it deserves. */}
        <p className="mt-4 rounded-sm border-l-2 border-l-accent bg-accent-quiet px-3 py-3 t-body-sm text-ink-1">
          This reflects modifiable behaviours, not measured sperm quality.
        </p>

        <div className="mt-4">
          <MetaList
            items={[
              { label: "Rule version", value: readiness.ruleVersion },
              { label: "Domains scored", value: `${covered.length} of ${domainOrder.length}` },
              { label: "Weight covered", value: `${readiness.weightCovered} of 100` },
              { label: "Calculation", value: "Weighted mean of available domains" },
            ]}
          />
        </div>
      </Card>

      {readiness.gates.length > 0 ? (
        <section className="mt-6" aria-labelledby="gates">
          <SectionHeader
            id="gates"
            eyebrow="Clinical gates"
            title="Outside what a behaviour score can express"
          />
          <p className="mb-3 t-body-sm text-ink-2">
            These do not appear as point deductions. A good composite score cannot cancel them out, and a
            condition you did not choose never counts against your behaviour.
          </p>
          <div className="space-y-3">
            {readiness.gates.map((gate) => (
              <SafetyAlert
                key={gate.id}
                severity={gate.severity}
                title={gate.title}
                body={
                  <>
                    <p>{gate.body}</p>
                    <p className="mt-2 font-medium text-ink-1">{gate.action}</p>
                  </>
                }
                nonModifiable={gate.nonModifiable}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8" aria-labelledby="domains">
        <SectionHeader id="domains" eyebrow="Breakdown" title="What moved it, and by how much" />
        <DomainDetail readiness={readiness} />
      </section>

      {readiness.missingInputs.length > 0 ? (
        <Card tone="information" className="mt-4">
          <p className="t-micro text-information">Missing inputs</p>
          <p className="mt-1.5 t-body-sm text-ink-2">
            {readiness.missingInputs.join(", ")}.
          </p>
          <p className="mt-2.5">
            <StatusChip tone="information" glyph="info">
              Lowers data confidence, never readiness
            </StatusChip>
          </p>
        </Card>
      ) : null}

      <Card className="mt-6">
        <Disclosure label="How this score is calculated" glyph="info">
          <p className="t-prose text-ink-1">
            Each domain is scored 0 to 100 from your answers, then combined as a weighted mean across
            only the domains that have an answer. Weights come from the relative strength of the human
            evidence behind each domain, not from how easy it is to change.
          </p>
          <ul className="mt-3 space-y-1.5">
            {domainOrder.map((id) => (
              <li key={id} className="flex items-baseline justify-between gap-3 t-body-sm">
                <span className="text-ink-2">{domains[id].label}</span>
                <span className="t-mono text-ink-1">{domains[id].weight}</span>
              </li>
            ))}
          </ul>
        </Disclosure>
        <Disclosure label="Why a bad day does not move it much" glyph="today">
          <p className="t-prose text-ink-1">
            The displayed score is smoothed, so it responds to sustained change rather than to one
            unusual day. Sperm production runs over roughly 64 to 74 days, so a score that lurched
            daily would be telling you something biology cannot support.
          </p>
        </Disclosure>
        <Disclosure label="What this score is not" glyph="unavailable">
          <ul className="space-y-2 t-body-sm text-ink-2">
            <li>Not a measurement of your sperm.</li>
            <li>Not a prediction of conception.</li>
            <li>Not a clinical assessment.</li>
            <li>Not affected by conditions you did not choose.</li>
          </ul>
        </Disclosure>
      </Card>

      <DisclaimerFooter />
    </Screen>
  );
}
