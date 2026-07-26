"use client";

import { DisclaimerFooter, Screen } from "@/components/shell";
import { MarkerCard, MissingMarkerCard } from "@/components/domain";
import {
  ButtonLink,
  Card,
  Disclosure,
  EmptyState,
  MetaBadge,
  SectionHeader,
  SimulatedBadge,
  StatusChip,
} from "@/components/ui";
import { comparabilityIssues, hormoneMarkerOrder, semenMarkerOrder } from "@/lib/clinical";
import { formatDate } from "@/lib/format";
import { usePrototype } from "@/lib/store";
import { DataEngineProfile } from "@/components/data-engine-profile";

export default function ProfilePage() {
  const { latestSemen, semenTests, hormonePanel } = usePrototype();
  const priorTest = semenTests.length > 1 ? semenTests.at(-2) : undefined;
  const issues = priorTest && latestSemen ? comparabilityIssues(priorTest, latestSemen) : [];

  if (!latestSemen && !hormonePanel) {
    return (
      <Screen title="Clinical profile" back="/results">
        <EmptyState
          glyph="lab"
          title="Nothing measured yet"
          body="This screen only ever shows values a laboratory produced, or clearly labelled demonstration data. It never shows an estimate."
          action={
            <ButtonLink href="/tests/new" glyph="plus">
              Add a clinical result
            </ButtonLink>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen title="Clinical profile" eyebrow="Measured values only" back="/results">
      {latestSemen ? (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="t-micro text-ink-3">Semen analysis</p>
                <p className="mt-1 t-title-3 text-ink-1">{formatDate(latestSemen.collectedAt)}</p>
              </div>
              {latestSemen.source === "simulated" ? <SimulatedBadge /> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {latestSemen.labName ? <MetaBadge glyph="lab">{latestSemen.labName}</MetaBadge> : null}
              {latestSemen.abstinenceHours != null ? (
                <MetaBadge glyph="pending">{latestSemen.abstinenceHours}h abstinence</MetaBadge>
              ) : null}
              <MetaBadge glyph={latestSemen.collectionComplete ? "check-circle" : "attention"}>
                {latestSemen.collectionComplete === true
                  ? "Complete sample"
                  : latestSemen.collectionComplete === false
                    ? "Incomplete sample"
                    : "Completeness unknown"}
              </MetaBadge>
              <MetaBadge glyph={latestSemen.recentFever ? "attention" : "check-circle"}>
                {latestSemen.recentFever ? "Recent fever" : "No recent fever"}
              </MetaBadge>
            </div>

            {latestSemen.reportedAsZero ? (
              <p className="mt-3">
                <StatusChip tone="escalation" glyph="escalation">
                  Reported as zero — laboratory confirmation required
                </StatusChip>
              </p>
            ) : null}
          </Card>

          {issues.length > 0 ? (
            <Card tone="attention" className="mt-3">
              <p className="t-micro text-attention">Collection comparability</p>
              <p className="mt-1.5 t-body-sm text-ink-2">
                Conditions differ from your previous sample. Differences below may reflect collection
                rather than change.
              </p>
              <ul className="mt-2.5 space-y-2">
                {issues.map((issue) => (
                  <li key={issue.label}>
                    <span className="t-body-sm font-medium text-ink-1">{issue.label}.</span>{" "}
                    <span className="t-body-sm text-ink-2">{issue.detail}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <section className="mt-6" aria-labelledby="semen-markers">
            <SectionHeader id="semen-markers" eyebrow="Semen analysis" title="Markers" />
            <div className="space-y-3">
              {semenMarkerOrder.map((code) => {
                const marker = latestSemen.markers.find((candidate) => candidate.code === code);
                if (!marker) return <MissingMarkerCard key={code} code={code} />;
                return (
                  <MarkerCard
                    key={code}
                    marker={marker}
                    test={latestSemen}
                    priorMarker={priorTest?.markers.find((candidate) => candidate.code === code)}
                    priorTest={priorTest}
                    href={`/results/profile/${code}`}
                  />
                );
              })}
            </div>
          </section>
        </>
      ) : null}

      {hormonePanel ? (
        <section className="mt-8" aria-labelledby="hormone-markers">
          <SectionHeader id="hormone-markers" eyebrow="Hormone panel" title="Markers" />
          <Card tone="information" className="mb-3">
            <p className="t-body-sm text-ink-2">
              These give context for reading your semen result. PreSeed does not diagnose endocrine
              conditions and never recommends hormone treatment — anything unexpected routes to a
              clinician.
            </p>
          </Card>
          <div className="space-y-3">
            {hormoneMarkerOrder
              .filter((code) => hormonePanel.markers.some((marker) => marker.code === code))
              .map((code) => {
                const marker = hormonePanel.markers.find((candidate) => candidate.code === code)!;
                return (
                  <MarkerCard
                    key={code}
                    marker={marker}
                    test={hormonePanel}
                    href={`/results/profile/${code}`}
                  />
                );
              })}
          </div>
        </section>
      ) : (
        <section className="mt-8">
          <MissingMarkerCard code="fsh_iu_l" />
        </section>
      )}

      {latestSemen ? <DataEngineProfile view="profile" /> : null}

      <Card className="mt-6">
        <Disclosure label="How to read a reference interval" glyph="info">
          <p className="t-prose text-ink-1">
            Semen reference limits mark the 5th centile of a reference population of men whose partners
            conceived within a year. A value below a limit means you sit in the lower part of that
            distribution — it is not a diagnosis, and it does not mean conception cannot happen. A value
            above it is not a guarantee either.
          </p>
          <p className="mt-3 t-body-sm text-ink-2">
            Single samples also vary a great deal within the same man. That is why PreSeed shows a
            variability band on trends and asks about collection conditions every time.
          </p>
        </Disclosure>
      </Card>

      <div className="mt-4">
        <ButtonLink href="/tests/new" variant="secondary" full glyph="plus">
          Add another result
        </ButtonLink>
      </div>

      <DisclaimerFooter />
    </Screen>
  );
}
