"use client";

import { TrendChart } from "@/components/charts";
import { DisclaimerFooter, Screen } from "@/components/shell";
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
import {
  changeExceedsVariability,
  comparabilityIssues,
  markerCatalogue,
  semenMarkerOrder,
  sourceLabel,
} from "@/lib/clinical";
import {
  computeDelta,
  directionWord,
  formatDate,
  formatDelta,
  formatNumber,
  formatPercentDelta,
} from "@/lib/format";
import { adherenceWindow, usePrototype } from "@/lib/store";

export default function TrendsPage() {
  const { state, semenTests, baselineSemen, latestSemen, seedDemo } = usePrototype();

  if (semenTests.length === 0) {
    return (
      <Screen title="Trends" back="/results">
        <EmptyState
          glyph="results"
          title="No results to compare"
          body="Trends need at least two analyses collected under comparable conditions."
          action={
            <ButtonLink href="/tests/new" glyph="plus">
              Add a clinical result
            </ButtonLink>
          }
        />
        <DisclaimerFooter />
      </Screen>
    );
  }

  if (semenTests.length === 1) {
    return (
      <Screen title="Trends" eyebrow="One result on file" back="/results">
        <Card>
          <h2 className="t-title-3 text-ink-1">One analysis is a starting point, not a trend</h2>
          <p className="mt-1.5 t-body-sm text-ink-2">
            Measurements vary substantially between samples from the same man, so a single result cannot
            show direction. Your closing analysis is what makes this screen meaningful.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <MetaBadge glyph="calendar">{formatDate(semenTests[0].collectedAt)}</MetaBadge>
            <MetaBadge glyph={semenTests[0].source === "simulated" ? "simulated" : "lab"}>
              {sourceLabel[semenTests[0].source]}
            </MetaBadge>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <ButtonLink href="/tests/new" glyph="plus">
              Add the closing analysis
            </ButtonLink>
            <Button variant="quiet" onClick={() => seedDemo("retest")}>
              Load the demo closing analysis
            </Button>
          </div>
        </Card>
        <DisclaimerFooter />
      </Screen>
    );
  }

  const issues = baselineSemen && latestSemen ? comparabilityIssues(baselineSemen, latestSemen) : [];
  const window = adherenceWindow(state, 90);
  const comparableCodes = semenMarkerOrder.filter(
    (code) =>
      baselineSemen?.markers.some((marker) => marker.code === code) &&
      latestSemen?.markers.some((marker) => marker.code === code),
  );

  return (
    <Screen title="Trends" eyebrow="Baseline and latest" back="/results">
      {/* The causal claim is refused before any number is shown. */}
      <Card tone="information">
        <p className="t-prose text-ink-1">
          PreSeed cannot tell you what caused a change. Sample-to-sample variation within the same man is
          substantial, two samples are not an experiment, and nothing here isolates your protocol from
          everything else that happened over these months.
        </p>
      </Card>

      {issues.length > 0 ? (
        <Card tone="attention" className="mt-3">
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
      ) : (
        <p className="mt-3">
          <StatusChip tone="supported">Collection conditions comparable</StatusChip>
        </p>
      )}

      <section className="mt-6" aria-labelledby="interval">
        <SectionHeader id="interval" eyebrow="The interval" title="What was running between the two" />
        <Card>
          <dl className="divide-y divide-hairline">
            <div className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="t-caption text-ink-3">Baseline</dt>
              <dd className="t-body-sm text-ink-1">{formatDate(baselineSemen!.collectedAt)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="t-caption text-ink-3">Latest</dt>
              <dd className="t-body-sm text-ink-1">{formatDate(latestSemen!.collectedAt)}</dd>
            </div>
            {state.protocol ? (
              <>
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="t-caption text-ink-3">Protocol active</dt>
                  <dd className="t-mono text-ink-1">
                    v{state.protocol.version} · {state.protocol.days} days
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="t-caption text-ink-3">Adherence over 90 days</dt>
                  <dd className="t-mono text-ink-1">
                    {window.percent == null ? "—" : `${window.percent}%`}
                  </dd>
                </div>
              </>
            ) : null}
            <div className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="t-caption text-ink-3">Provenance</dt>
              <dd className="t-body-sm text-ink-1">
                {sourceLabel[baselineSemen!.source]} → {sourceLabel[latestSemen!.source]}
              </dd>
            </div>
          </dl>
          {latestSemen!.source === "simulated" ? (
            <p className="mt-3">
              <SimulatedBadge />
            </p>
          ) : null}
        </Card>
      </section>

      <section className="mt-6" aria-labelledby="changes">
        <SectionHeader id="changes" eyebrow="Measured change" title="Baseline to latest" />
        <div className="space-y-3">
          {comparableCodes.map((code) => {
            const definition = markerCatalogue[code];
            const from = baselineSemen!.markers.find((marker) => marker.code === code)!;
            const to = latestSemen!.markers.find((marker) => marker.code === code)!;
            const delta = computeDelta(from.value, to.value);
            const meaningful = changeExceedsVariability(from.value, to.value);

            return (
              <Card key={code}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="t-micro text-ink-3">{definition.label}</p>
                    <p className="mt-1 flex items-baseline gap-2">
                      <span className="t-mono text-ink-3">{formatNumber(from.value, definition.decimals)}</span>
                      <span aria-hidden="true" className="t-caption text-ink-3">
                        →
                      </span>
                      <span className="t-title-1 text-ink-1">{formatNumber(to.value, definition.decimals)}</span>
                      <span className="t-caption text-ink-3">{definition.unit}</span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="t-mono text-ink-1">{formatDelta(delta, definition.decimals)}</p>
                    <p className="t-caption text-ink-3">{formatPercentDelta(delta)}</p>
                  </div>
                </div>

                <p className="mt-2 t-caption text-ink-2">
                  {formatNumber(Math.abs(delta.absolute), definition.decimals)} {definition.unit}{" "}
                  {directionWord[delta.direction]}.{" "}
                  {meaningful
                    ? "Larger than the roughly 25% variation expected between samples."
                    : "Within the roughly 25% variation expected between samples, so not readable as change."}
                </p>

                <div className="mt-3">
                  <TrendChart code={code} tests={semenTests} height={132} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="mt-6">
        <Disclosure label="Why PreSeed will not claim credit" glyph="info" defaultOpen>
          <p className="t-prose text-ink-1">
            Two samples separated by three months differ for many reasons: normal biological variation,
            regression toward the mean when the first sample happened to be low, seasonal effects, the
            laboratory and technician, abstinence, and everything in your life that was not the protocol.
            Attributing the difference to PreSeed would require a controlled comparison this product
            cannot run.
          </p>
          <p className="mt-3 t-body-sm text-ink-2">
            What PreSeed can honestly say: these are the measurements, these were the conditions, this is
            what you were following, and this is how much of it you did.
          </p>
        </Disclosure>
        <Disclosure label="Why the same laboratory matters" glyph="lab">
          <p className="t-prose text-ink-1">
            Laboratories differ in method, equipment and technician, and cross-laboratory differences can
            be as large as the change you are looking for. Where the laboratory differs between samples,
            PreSeed shows a comparability caution rather than quietly presenting the difference as
            progress.
          </p>
        </Disclosure>
      </Card>

      <DisclaimerFooter />
    </Screen>
  );
}
