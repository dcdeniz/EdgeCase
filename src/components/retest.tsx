"use client";

/**
 * RetestComparison — baseline against the closing analysis.
 *
 * The product's stated differentiator is a dated protocol ending in a
 * scheduled retest and a before-and-after comparison. This is that comparison.
 *
 * Two rules it must not break.
 *
 * 1. A difference is not a change. Repeat samples from the same man vary by
 *    roughly 25%, so every delta is labelled with whether it clears that
 *    threshold. A movement inside it reads as noise, not progress.
 *
 * 2. PreSeed does not claim to have caused it. Even a difference that clears
 *    the variability threshold is one comparison between two samples, with no
 *    control and no randomisation. The protocol ran alongside it; that is all
 *    that can be said.
 */

import { Icon } from "@/components/icons";
import { Card, MetaBadge, StatusChip, cx } from "@/components/ui";
import {
  changeExceedsVariability,
  comparabilityIssues,
  markerCatalogue,
  semenMarkerOrder,
  type ClinicalTest,
  type MarkerCode,
} from "@/lib/clinical";
import { computeDelta, formatDate, formatNumber, relativeDays } from "@/lib/format";
import { bandLabel, bandOf } from "@/components/profile-board";

const bandColour = {
  below: "var(--ps-escalation)",
  within: "var(--ps-information)",
} as const;

function ComparisonRow({
  code,
  baseline,
  retest,
}: {
  code: MarkerCode;
  baseline: ClinicalTest;
  retest: ClinicalTest;
}) {
  const definition = markerCatalogue[code];
  const from = baseline.markers.find((marker) => marker.code === code);
  const to = retest.markers.find((marker) => marker.code === code);
  if (!from || !to) return null;

  const delta = computeDelta(from.value, to.value);
  const meaningful = changeExceedsVariability(from.value, to.value);
  const fromBand = bandOf(from);
  const toBand = bandOf(to);
  const crossed = fromBand === "below" && toBand === "within";

  // Shared scale so the two bars are visually comparable.
  const scaleMax = Math.max(from.value, to.value) * 1.25;

  return (
    <div className="border-t border-hairline py-3.5 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="t-title-3 text-ink-1">{definition.label}</h3>
        {crossed ? (
          <StatusChip tone="supported" glyph="check-circle">
            Now in range
          </StatusChip>
        ) : null}
      </div>

      <div className="mt-2.5 space-y-2">
        {[
          { label: "Baseline", marker: from, band: fromBand, muted: true },
          { label: "Retest", marker: to, band: toBand, muted: false },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="t-caption text-ink-3">{row.label}</span>
              <span
                className={cx("ps-num", row.muted ? "t-body-sm text-ink-2" : "t-title-2 text-ink-1")}
              >
                {formatNumber(row.marker.value, definition.decimals)}
                <span className="ml-1 t-caption font-normal text-ink-3">{definition.unit}</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${Math.min(100, (row.marker.value / scaleMax) * 100)}%`,
                  background: bandColour[row.band],
                  opacity: row.muted ? 0.45 : 1,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={cx(
            "inline-flex items-center gap-1 t-body-sm font-medium",
            delta.direction === "flat" ? "text-ink-2" : meaningful ? "text-ink-1" : "text-ink-2",
          )}
        >
          <Icon
            name={
              delta.direction === "up"
                ? "arrow-up"
                : delta.direction === "down"
                  ? "arrow-down"
                  : "arrow-flat"
            }
            size={14}
          />
          {formatNumber(Math.abs(delta.absolute), definition.decimals)} {definition.unit}
        </span>
        <span className="t-caption text-ink-3">
          {meaningful
            ? "Larger than the ~25% variation expected between samples"
            : "Inside the ~25% variation expected between samples"}
        </span>
      </p>
    </div>
  );
}

export function RetestComparison({
  baseline,
  retest,
}: {
  baseline: ClinicalTest;
  retest: ClinicalTest;
}) {
  const issues = comparabilityIssues(baseline, retest);
  const codes = semenMarkerOrder.filter(
    (code) =>
      baseline.markers.some((marker) => marker.code === code) &&
      retest.markers.some((marker) => marker.code === code),
  );

  const crossed = codes.filter((code) => {
    const from = baseline.markers.find((marker) => marker.code === code)!;
    const to = retest.markers.find((marker) => marker.code === code)!;
    return bandOf(from) === "below" && bandOf(to) === "within";
  }).length;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="t-micro text-ink-3">Baseline to retest</p>
          <p className="mt-1 t-caption text-ink-2">
            {formatDate(baseline.collectedAt)} — {formatDate(retest.collectedAt)} ·{" "}
            {relativeDays(retest.collectedAt.slice(0, 10))}
          </p>
        </div>
        <MetaBadge glyph="calendar">
          {Math.round(
            (Date.parse(retest.collectedAt) - Date.parse(baseline.collectedAt)) / 86_400_000,
          )}{" "}
          days
        </MetaBadge>
      </div>

      {crossed > 0 ? (
        <p className="mt-2.5">
          <StatusChip tone="supported" glyph="check-circle">
            {crossed} moved into range
          </StatusChip>
        </p>
      ) : null}

      {/* Feedforward: comparability is stated before the numbers, not after. */}
      {issues.length > 0 ? (
        <div className="mt-3 rounded-sm border border-attention/40 bg-attention-quiet p-3">
          <p className="flex items-center gap-2 t-caption font-medium text-attention">
            <Icon name="attention" size={14} />
            Collection conditions differ
          </p>
          <ul className="mt-1.5 space-y-1">
            {issues.map((issue) => (
              <li key={issue.label} className="t-caption text-ink-2">
                {issue.label}. {issue.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4">
        {codes.map((code) => (
          <ComparisonRow key={code} code={code} baseline={baseline} retest={retest} />
        ))}
      </div>

      <div className="mt-4 border-t border-hairline pt-3">
        <p className="flex gap-2 t-caption text-ink-2">
          <Icon name="info" size={14} className="mt-0.5 shrink-0 text-ink-3" />
          Your protocol ran alongside these results. PreSeed cannot claim to have caused the
          difference — this is one comparison between two samples, with no control group.
        </p>
      </div>
    </Card>
  );
}

/** Compact band summary, for the results hub. */
export function bandSummary(test: ClinicalTest) {
  const codes = semenMarkerOrder.filter((code) =>
    test.markers.some((marker) => marker.code === code),
  );
  const below = codes.filter((code) => {
    const marker = test.markers.find((row) => row.code === code)!;
    return bandOf(marker) === "below";
  }).length;
  return { total: codes.length, below, label: bandLabel.below };
}
