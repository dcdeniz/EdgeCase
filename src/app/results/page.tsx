"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { DisclaimerFooter, Screen } from "@/components/shell";
import {
  MarkerCard,
  ReadinessSummary,
  ReasoningSummaryCard,
} from "@/components/domain";
import {
  ButtonLink,
  Card,
  EmptyState,
  SectionHeader,
  SimulatedBadge,
  StatusChip,
} from "@/components/ui";
import { reasoningByMarker, riskOutputs } from "@/lib/fixtures";
import { formatDate, relativeDays } from "@/lib/format";
import { usePrototype } from "@/lib/store";

/**
 * Outputs are kept visually distinct and never merged into a headline number.
 * Order is deliberate: what was measured, then what you can change, then what a
 * model would guess.
 *
 * Data confidence is no longer a section here. The invariant it exists to
 * protect is unaffected — missing data still lands on confidence rather than on
 * readiness, and that is enforced in the scoring engines, not by this screen.
 * The full breakdown remains at /results/confidence and on the account data
 * screen.
 */
export default function ResultsPage() {
  const { readiness, latestSemen, baselineSemen, belowReferenceCodes, semenTests } =
    usePrototype();

  const priorTest = semenTests.length > 1 ? semenTests.at(-2) : undefined;
  const chains = belowReferenceCodes
    .map((code) => ({ chain: reasoningByMarker.get(code), code }))
    .filter((entry): entry is { chain: NonNullable<typeof entry.chain>; code: typeof entry.code } =>
      Boolean(entry.chain),
    );

  return (
    <Screen title="Results" eyebrow="Three separate outputs">
      {!latestSemen ? (
        <EmptyState
          glyph="results"
          title="No clinical result yet"
          body="Your readiness score works from your answers alone, but the profile, reasoning chains and trends all need a measured result."
          action={
            <ButtonLink href="/tests/new" glyph="plus">
              Add a clinical result
            </ButtonLink>
          }
        />
      ) : null}

      {/* 1 — measured values */}
      {latestSemen ? (
        <section aria-labelledby="profile-heading">
          <SectionHeader
            id="profile-heading"
            eyebrow="1 · Measured"
            title="Clinical profile"
            action={
              <Link href="/results/profile" className="t-caption font-medium text-accent">
                All markers
              </Link>
            }
          />
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="t-caption text-ink-2">
              {formatDate(latestSemen.collectedAt)} · {relativeDays(latestSemen.collectedAt.slice(0, 10))}
            </span>
            {latestSemen.source === "simulated" ? <SimulatedBadge compact /> : null}
          </div>

          <div className="space-y-3">
            {latestSemen.markers.slice(0, 3).map((marker) => (
              <MarkerCard
                key={marker.code}
                marker={marker}
                test={latestSemen}
                priorMarker={priorTest?.markers.find((candidate) => candidate.code === marker.code)}
                priorTest={priorTest}
                href={`/results/profile/${marker.code}`}
                compact
              />
            ))}
          </div>

          <Link
            href="/results/profile"
            className="mt-3 flex min-h-(--ps-touch-min) items-center justify-between rounded-sm border border-hairline bg-surface-1 px-3 t-body-sm font-medium text-ink-1"
          >
            See all {latestSemen.markers.length} measured markers
            <Icon name="chevron-right" size={18} className="text-ink-3" />
          </Link>
        </section>
      ) : null}

      {/* The signature: measured result to recommendation, with its reasoning. */}
      {chains.length > 0 && latestSemen ? (
        <section className="mt-8" aria-labelledby="reasoning-heading">
          <SectionHeader
            id="reasoning-heading"
            eyebrow="Why your plan says what it says"
            title="Parameter reasoning"
          />
          <p className="mb-3 t-body-sm text-ink-2">
            One chain for every measurement below its reference interval. No recommendation appears in
            PreSeed without the result that produced it.
          </p>
          <div className="space-y-3">
            {chains.map(({ chain, code }) => {
              const marker = latestSemen.markers.find((candidate) => candidate.code === code)!;
              return <ReasoningSummaryCard key={chain.id} chain={chain} marker={marker} />;
            })}
          </div>
        </section>
      ) : null}

      {/* 2 — modifiable behaviour */}
      <section className="mt-8" aria-labelledby="readiness-heading">
        <SectionHeader id="readiness-heading" eyebrow="2 · Behaviour" title="Readiness score" />
        <ReadinessSummary readiness={readiness} />
      </section>

      {/* 3 — model outputs, mostly absent and honest about it */}
      <section className="mt-8" aria-labelledby="risk-heading">
        <SectionHeader
          id="risk-heading"
          eyebrow="3 · Screening"
          title="Named screening risks"
          action={
            <Link href="/results/risks" className="t-caption font-medium text-accent">
              All four
            </Link>
          }
        />
        <p className="mb-3 t-body-sm text-ink-2">
          Each names a specific endpoint. None is a diagnosis, and most are not available — PreSeed
          shows the empty state rather than estimating.
        </p>
        <Card>
          <ul className="divide-y divide-hairline">
            {riskOutputs.map((risk) => (
              <li key={risk.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="min-w-0 t-body-sm text-ink-1">{risk.endpoint}</span>
                <StatusChip
                  tone={
                    risk.state === "externally_generated"
                      ? "attention"
                      : risk.state === "unavailable_by_design"
                        ? "escalation"
                        : "unavailable"
                  }
                >
                  {risk.state === "externally_generated"
                    ? "Externally generated"
                    : risk.state === "unavailable_by_design"
                      ? "Not available"
                      : risk.state === "insufficient_data"
                        ? "Insufficient data"
                        : "Pending"}
                </StatusChip>
              </li>
            ))}
          </ul>
          <Link
            href="/results/risks"
            className="mt-3 flex min-h-(--ps-touch-min) items-center justify-between rounded-sm bg-surface-3 px-3 t-body-sm font-medium text-ink-1"
          >
            Open screening risks
            <Icon name="chevron-right" size={18} className="text-ink-3" />
          </Link>
        </Card>
      </section>

      {baselineSemen && semenTests.length > 1 ? (
        <div className="mt-6">
          <ButtonLink href="/trends" variant="secondary" full glyph="results">
            Compare against baseline
          </ButtonLink>
        </div>
      ) : null}

      <DisclaimerFooter />
    </Screen>
  );
}
