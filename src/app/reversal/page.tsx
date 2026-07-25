"use client";

import { TrendChart } from "@/components/charts";
import { DisclaimerFooter, SafetyAlert, Screen } from "@/components/shell";
import {
  Button,
  ButtonLink,
  Card,
  Disclosure,
  EmptyState,
  MetaBadge,
  SectionHeader,
  SimulatedBadge,
  StatusChip,
} from "@/components/ui";
import { comparabilityIssues, sourceLabel } from "@/lib/clinical";
import { TODAY, addDays, daysBetween, formatDate, relativeDays } from "@/lib/format";
import { usePrototype } from "@/lib/store";

const AZOOSPERMIA_NOTICE =
  "PreSeed cannot confirm azoospermia. A zero or extremely low result requires appropriate laboratory confirmation.";

export default function ReversalPage() {
  const { semenTests, latestSemen, seedDemo } = usePrototype();

  if (semenTests.length === 0) {
    return (
      <Screen title="Tracking" eyebrow="Vasectomy reversal">
        <Card tone="escalation">
          <p className="t-prose text-ink-1">{AZOOSPERMIA_NOTICE}</p>
        </Card>
        <div className="mt-4">
          <EmptyState
            glyph="lab"
            title="No laboratory results yet"
            body="Monitoring after a reversal usually starts with a semen analysis around four weeks post-procedure, then repeats as your surgeon directs. PreSeed is the layer around those laboratory results — it is not a test."
            action={
              <div className="flex flex-col gap-2">
                <ButtonLink href="/tests/new" glyph="plus">
                  Enter a laboratory result
                </ButtonLink>
                <Button variant="quiet" onClick={() => seedDemo("reversal")}>
                  Load a demo recovery series
                </Button>
              </div>
            }
          />
        </div>
        <DisclaimerFooter />
      </Screen>
    );
  }

  const first = semenTests[0];
  const nextDue = addDays(latestSemen!.collectedAt.slice(0, 10), 28);
  const issues = semenTests.length > 1 ? comparabilityIssues(semenTests.at(-2)!, latestSemen!) : [];
  const anyZero = semenTests.some((test) => test.reportedAsZero);

  return (
    <Screen title="Tracking" eyebrow="Vasectomy reversal">
      {/* Mandatory on this track, and never dismissible. */}
      <SafetyAlert
        severity="escalation"
        title="A zero result cannot be confirmed here"
        body={
          <>
            <p>{AZOOSPERMIA_NOTICE}</p>
            <p className="mt-2">
              Confirmation depends on examining the sediment of a centrifuged sample. No smartphone or
              home method can do this, and less rigorous testing has been found to miss rare sperm.
            </p>
          </>
        }
      />

      <Card className="mt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="t-micro text-ink-3">Analyses recorded</p>
            <p className="mt-1 t-display-2 text-ink-1">{semenTests.length}</p>
          </div>
          <div className="text-right">
            <p className="t-caption text-ink-3">Since first test</p>
            <p className="t-mono text-ink-1">
              {daysBetween(first.collectedAt.slice(0, 10), TODAY)} days
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-sm bg-surface-3 px-3 py-2.5">
          <p className="t-caption text-ink-3">Next analysis</p>
          <p className="mt-0.5 t-body-sm text-ink-1">
            {formatDate(nextDue)} <span className="text-ink-3">{relativeDays(nextDue)}</span>
          </p>
          <p className="mt-1 t-caption text-ink-2">
            Four-week intervals are the usual monitoring pattern, but your surgeon&rsquo;s direction takes
            priority over any schedule in this app.
          </p>
        </div>
      </Card>

      {anyZero ? (
        <Card tone="escalation" className="mt-3">
          <p className="t-micro text-escalation">Recorded as zero</p>
          <p className="mt-1.5 t-body-sm text-ink-2">
            One of your analyses recorded no sperm. PreSeed stores that as{" "}
            <span className="font-medium text-ink-1">reported as zero, confirmation required</span> and
            will not describe it as azoospermia at any point.
          </p>
        </Card>
      ) : null}

      <section className="mt-6" aria-labelledby="trend">
        <SectionHeader id="trend" eyebrow="Longitudinal" title="Concentration across analyses" />
        <Card>
          <TrendChart code="concentration_million_ml" tests={semenTests} />
          <p className="mt-3 border-t border-hairline pt-3 t-body-sm text-ink-2">
            Sperm returning to the semen after a reversal is a recovery pattern that unfolds over months.
            A rise across consecutive analyses is consistent with expected recovery. PreSeed describes
            the pattern; it does not predict an outcome, and it makes no claim about conception.
          </p>
        </Card>
      </section>

      {issues.length > 0 ? (
        <Card tone="attention" className="mt-4">
          <p className="t-micro text-attention">Collection comparability</p>
          <ul className="mt-2 space-y-2">
            {issues.map((issue) => (
              <li key={issue.label}>
                <span className="t-body-sm font-medium text-ink-1">{issue.label}.</span>{" "}
                <span className="t-body-sm text-ink-2">{issue.detail}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <section className="mt-6" aria-labelledby="history">
        <SectionHeader id="history" eyebrow="Every analysis" title="Chronological record" />
        <div className="space-y-3">
          {[...semenTests].reverse().map((test) => {
            const marker = test.markers.find((candidate) => candidate.code === "concentration_million_ml");
            return (
              <Card key={test.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="t-body-sm font-medium text-ink-1">{formatDate(test.collectedAt)}</p>
                    <p className="mt-0.5 t-caption text-ink-3">
                      {daysBetween(first.collectedAt.slice(0, 10), test.collectedAt.slice(0, 10))} days
                      after the first analysis
                    </p>
                  </div>
                  {test.source === "simulated" ? <SimulatedBadge compact /> : null}
                </div>

                {marker ? (
                  <p className="mt-2 flex items-baseline gap-1.5">
                    <span className="t-title-1 text-ink-1">{marker.value}</span>
                    <span className="t-caption text-ink-3">×10⁶/mL</span>
                  </p>
                ) : null}

                {test.reportedAsZero ? (
                  <p className="mt-2">
                    <StatusChip tone="escalation" glyph="escalation">
                      Reported as zero — confirmation required
                    </StatusChip>
                  </p>
                ) : null}

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <MetaBadge glyph="lab">{test.labName ?? "Laboratory not recorded"}</MetaBadge>
                  {test.abstinenceHours != null ? (
                    <MetaBadge glyph="pending">{test.abstinenceHours}h</MetaBadge>
                  ) : null}
                  <MetaBadge glyph="hand">{sourceLabel[test.source]}</MetaBadge>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-6" aria-labelledby="escalate">
        <SectionHeader id="escalate" eyebrow="When to escalate" title="Talk to your surgeon if" level={3} />
        <Card>
          <ul className="space-y-2.5">
            {[
              "Analyses show no sperm several months after the procedure.",
              "Counts rise and then fall again across consecutive analyses.",
              "You have pain, swelling or any sign of infection.",
              "You are unsure what interval your monitoring should follow.",
            ].map((line) => (
              <li key={line} className="flex gap-2.5 t-body-sm text-ink-2">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-3" />
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-hairline pt-3 t-caption text-ink-3">
            PreSeed does not interpret recovery clinically. It keeps the record so the conversation with
            your surgeon starts from complete information.
          </p>
        </Card>
      </section>

      <Card className="mt-4">
        <Disclosure label="Why there is no 100-day protocol here" glyph="info">
          <p className="t-prose text-ink-1">
            After a reversal, what matters is whether sperm are returning and at what rate — a question
            answered by laboratory analyses at the intervals your surgeon sets, not by a lifestyle plan
            on a fixed clock. Forcing this track into the general protocol structure would put a
            countdown on something surgical recovery controls.
          </p>
        </Disclosure>
        <Disclosure label="What home test kits can and cannot tell you" glyph="attention">
          <p className="t-prose text-ink-1">
            Home kits are used for this kind of monitoring, and the literature flags them as not always
            reliable. They cannot perform the centrifugation that a zero result requires. Use them, if you
            use them, as a prompt to book a laboratory analysis — not as the analysis.
          </p>
        </Disclosure>
      </Card>

      <div className="mt-4">
        <ButtonLink href="/tests/new" full glyph="plus">
          Enter a laboratory result
        </ButtonLink>
      </div>

      <DisclaimerFooter />
    </Screen>
  );
}
