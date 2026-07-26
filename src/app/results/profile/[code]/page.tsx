"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/components/icons";
import { ReferenceAttribution, ReferenceStrip, TrendChart } from "@/components/charts";
import { DisclaimerFooter, Screen } from "@/components/shell";
import { CoachEntry } from "@/components/domain";
import { RetestComparison } from "@/components/retest";
import {
  Card,
  EmptyState,
  MetaList,
  SectionHeader,
  SimulatedBadge,
  StatusChip,
} from "@/components/ui";
import {
  changeExceedsVariability,
  markerCatalogue,
  plainMeaning,
  referenceContextLabel,
  referenceContextOf,
  sourceLabel,
  type MarkerCode,
  verificationLabel,
} from "@/lib/clinical";
import { reasoningByMarker } from "@/lib/fixtures";
import {
  computeDelta,
  directionWord,
  formatDate,
  formatDelta,
  formatMarker,
  formatPercentDelta,
} from "@/lib/format";
import { usePrototype } from "@/lib/store";

export default function MarkerDetailPage() {
  const params = useParams<{ code: string }>();
  const code = params.code as MarkerCode;
  const { semenTests, hormonePanel } = usePrototype();
  const definition = markerCatalogue[code];

  if (!definition) {
    return (
      <Screen title="Marker" back="/results/profile">
        <EmptyState glyph="unavailable" title="Unknown marker" body="That marker is not in the catalogue." />
      </Screen>
    );
  }

  const relevantTests =
    definition.panel === "semen_analysis"
      ? semenTests.filter((test) => test.markers.some((marker) => marker.code === code))
      : hormonePanel && hormonePanel.markers.some((marker) => marker.code === code)
        ? [hormonePanel]
        : [];

  const latestTest = relevantTests.at(-1);
  const marker = latestTest?.markers.find((candidate) => candidate.code === code);
  const priorTest = relevantTests.length > 1 ? relevantTests.at(-2) : undefined;
  const priorMarker = priorTest?.markers.find((candidate) => candidate.code === code);
  const chain = reasoningByMarker.get(code);

  if (!marker || !latestTest) {
    return (
      <Screen title={definition.label} back="/results/profile">
        <Card className="border-dashed">
          <p className="t-title-2 text-ink-3">Not measured</p>
          <p className="mt-2 t-body-sm text-ink-2">{plainMeaning[code]}</p>
          <p className="mt-3">
            <StatusChip tone="unavailable">Lowers data confidence, not readiness</StatusChip>
          </p>
        </Card>
        <DisclaimerFooter />
      </Screen>
    );
  }

  const context = referenceContextOf(marker);
  const delta = priorMarker ? computeDelta(priorMarker.value, marker.value) : null;
  const meaningful = priorMarker ? changeExceedsVariability(priorMarker.value, marker.value) : false;

  return (
    <Screen title={definition.shortLabel} eyebrow="Measured marker" back="/results/profile">
      <Card>
        <p className="t-micro text-ink-3">{definition.label}</p>
        <p className="mt-1.5 flex items-baseline gap-2">
          <span className="t-display-1 text-ink-1">{formatMarker(marker)}</span>
          <span className="t-body text-ink-2">{definition.unit}</span>
        </p>
        <span className="visually-hidden">
          {formatMarker(marker)} {definition.unitSpoken}. {referenceContextLabel[context]}.
        </span>

        <div className="mt-4">
          <ReferenceStrip marker={marker} priorValue={priorMarker?.value} />
        </div>

        <div className="mt-3">
          <ReferenceAttribution marker={marker} />
        </div>
      </Card>

      <Card className="mt-3">
        <p className="t-micro text-ink-3">What this measures</p>
        <p className="mt-1.5 t-prose text-ink-1">{definition.meaning}</p>
      </Card>

      <section className="mt-6" aria-labelledby="provenance">
        <SectionHeader id="provenance" eyebrow="Provenance" title="Where this number came from" level={3} />
        <Card>
          <MetaList
            items={[
              { label: "Source", value: sourceLabel[latestTest.source] },
              { label: "Verification", value: verificationLabel[marker.verification] },
              { label: "Collected", value: formatDate(latestTest.collectedAt) },
              { label: "Laboratory", value: latestTest.labName ?? "Not recorded" },
              {
                label: "Abstinence",
                value: latestTest.abstinenceHours != null ? `${latestTest.abstinenceHours} h` : "Not recorded",
              },
              {
                label: "Sample complete",
                value:
                  latestTest.collectionComplete === true
                    ? "Yes"
                    : latestTest.collectionComplete === false
                      ? "No"
                      : "Not recorded",
              },
              { label: "Recent fever", value: latestTest.recentFever ? "Yes" : "No" },
            ]}
          />
          {latestTest.source === "simulated" ? (
            <p className="mt-3">
              <SimulatedBadge />
            </p>
          ) : null}
        </Card>
      </section>

      {relevantTests.length > 1 && definition.panel === "semen_analysis" ? (
        <section className="mt-6" aria-labelledby="compare">
          <SectionHeader id="compare" eyebrow="Baseline to retest" title="What changed" level={3} />
          <RetestComparison baseline={relevantTests[0]} retest={latestTest} only={code} />
        </section>
      ) : null}

      {relevantTests.length > 1 ? (
        <section className="mt-6" aria-labelledby="trend">
          <SectionHeader id="trend" eyebrow="Trend" title="Across your results" level={3} />
          <Card>
            <TrendChart code={code} tests={relevantTests} />

            {delta ? (
              <div className="mt-4 border-t border-hairline pt-4">
                <div className="flex items-center gap-2">
                  <Icon
                    name={delta.direction === "up" ? "arrow-up" : delta.direction === "down" ? "arrow-down" : "arrow-flat"}
                    size={18}
                    className="text-ink-2"
                  />
                  <span className="t-body-sm text-ink-1">
                    {formatDelta(delta, definition.decimals)} {definition.unit} ({formatPercentDelta(delta)}){" "}
                    {directionWord[delta.direction]} than {formatDate(priorTest!.collectedAt)}
                  </span>
                </div>
                <p className="mt-2.5 t-body-sm text-ink-2">
                  {meaningful
                    ? "This difference is larger than the roughly 25% variation expected between samples from the same man. It is still one comparison between two samples, and PreSeed cannot attribute it to anything you did."
                    : "This difference sits inside the roughly 25% variation expected between samples from the same man, so it should not be read as change."}
                </p>
                <p className="mt-2">
                  <StatusChip tone="information" glyph="info">
                    PreSeed does not claim to have caused this
                  </StatusChip>
                </p>
              </div>
            ) : null}
          </Card>
        </section>
      ) : null}

      {chain ? (
        <section className="mt-6" aria-labelledby="reasoning">
          <SectionHeader
            id="reasoning"
            eyebrow="Reasoning"
            title="What your plan does about this"
            level={3}
          />
          <Link
            href={`/results/reasoning/${chain.id}`}
            className="block rounded-md border border-accent-line bg-accent-quiet p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="t-body-sm text-ink-1">{chain.headline}</p>
                <p className="mt-2 t-caption text-ink-2">{chain.action.title}</p>
              </div>
              <Icon name="chevron-right" size={18} className="mt-0.5 shrink-0 text-accent" />
            </div>
            <p className="mt-3 t-micro text-accent">Result → mechanism → action → evidence</p>
          </Link>
        </section>
      ) : null}

      <div className="mt-5">
        <CoachEntry contextId={code} contextLabel={`${definition.label} result`} />
      </div>

      <DisclaimerFooter />
    </Screen>
  );
}
