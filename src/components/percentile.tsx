"use client";

/**
 * Overall rank and the distribution curve behind it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * The overall figure is PreSeed's own summary — the mean of the parameter
 * centiles that have a WHO distribution. It is NOT a published composite.
 *
 * The manual is explicit about this, section 8.1.2.1: a multiparametric
 * interpretation has been suggested, but "combined reference limits for such
 * interpretation have yet to be developed". So the number is presented as an
 * average of the individual ranks, with the individual ranks one tap away, and
 * it is never called a WHO figure.
 *
 * It also inherits the manual's warning about the fifth percentile: a rank is
 * a position among men who conceived naturally within a year, not a
 * probability of conceiving and not a line between fertile and infertile.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  CENTILE_CAVEAT,
  CENTILE_POINTS,
  centileFor,
  centileTable,
  markerCatalogue,
  semenMarkerOrder,
  type ClinicalTest,
  type MarkerCode,
} from "@/lib/clinical";
import { formatNumber } from "@/lib/format";
import { Card, StatusChip, cx } from "@/components/ui";
import { Icon } from "@/components/icons";

export type ParameterRank = { code: MarkerCode; value: number; centile: number };

export function parameterRanks(test: ClinicalTest): ParameterRank[] {
  return semenMarkerOrder
    .filter((code) => centileTable[code] != null)
    .map((code) => {
      const marker = test.markers.find((row) => row.code === code);
      if (!marker) return null;
      const centile = centileFor(code, marker.value);
      return centile == null ? null : { code, value: marker.value, centile };
    })
    .filter((row): row is ParameterRank => row != null);
}

/** Mean of the available parameter centiles. PreSeed's own summary. */
export function overallRank(test: ClinicalTest): number | null {
  const ranks = parameterRanks(test);
  if (ranks.length === 0) return null;
  return Math.round(ranks.reduce((sum, row) => sum + row.centile, 0) / ranks.length);
}

function ordinal(value: number): string {
  const lastTwo = value % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return "th";
  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/* ==========================================================================
   Distribution curve
   ========================================================================== */

/**
 * The reference distribution for one parameter, drawn from the published
 * centile points, with the user's value marked.
 *
 * The x axis is centile and the y axis is the parameter value, so the curve
 * shows the real shape of the distribution — steep at the top, because these
 * parameters are heavily right-skewed. That skew is the reason a value can sit
 * well above the lower limit and still rank low, which is the single most
 * useful thing this chart communicates.
 */
export function DistributionCurve({
  code,
  value,
  height = 132,
}: {
  code: MarkerCode;
  value: number;
  height?: number;
}) {
  const row = centileTable[code];
  if (!row) return null;
  const definition = markerCatalogue[code];

  const width = 320;
  const maxValue = row.values[row.values.length - 1];
  const x = (centile: number) => (centile / 100) * width;
  const y = (v: number) => height - (v / maxValue) * height;

  const points = row.values.map((v, index) => `${x(CENTILE_POINTS[index])},${y(v)}`).join(" ");
  const centile = centileFor(code, value);
  const clamped = Math.max(0, Math.min(maxValue, value));

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={`Distribution of ${definition.label} in the WHO reference population, with your value of ${value} marked${
          centile == null ? "" : ` at the ${Math.round(centile)}${ordinal(Math.round(centile))} centile`
        }.`}
      >
        {/* Quartile guides. */}
        {[25, 50, 75].map((mark) => (
          <line
            key={mark}
            x1={x(mark)}
            y1={0}
            x2={x(mark)}
            y2={height}
            stroke="var(--ps-chart-grid)"
            strokeWidth={1}
          />
        ))}

        <polyline
          points={points}
          fill="none"
          stroke="var(--ps-chart-band-line)"
          strokeWidth={2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {centile != null ? (
          <>
            <line
              x1={x(centile)}
              y1={y(clamped)}
              x2={x(centile)}
              y2={height}
              stroke="var(--ps-chart-mark)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={x(centile)} cy={y(clamped)} r={5} fill="var(--ps-chart-mark)" />
          </>
        ) : null}
      </svg>

      <div className="mt-1 flex justify-between t-mono text-ink-3">
        <span>2.5th</span>
        <span>50th</span>
        <span>97.5th</span>
      </div>

      <figcaption className="mt-2 t-caption text-ink-3">
        Reference population, n&nbsp;=&nbsp;{row.n.toLocaleString("en-GB")}. The curve rises steeply
        at the top because these measurements are heavily skewed — which is why a value can clear
        the lower limit and still rank low.
      </figcaption>
    </figure>
  );
}

/* ==========================================================================
   Overall rank
   ========================================================================== */

export function OverallRankCard({ test, href }: { test: ClinicalTest; href?: string }) {
  const rank = overallRank(test);
  const ranks = parameterRanks(test);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="t-micro text-ink-3">Overall rank</p>
        {href ? <Icon name="chevron-right" size={18} className="shrink-0 text-ink-3" /> : null}
      </div>

      {rank == null ? (
        <p className="mt-2 t-title-2 text-ink-3">Not enough measured</p>
      ) : (
        <>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="t-display-1 text-ink-1 ps-num">{rank}</span>
            <span className="t-title-2 text-ink-2">{ordinal(rank)}</span>
            <span className="t-body-sm text-ink-3">centile</span>
          </p>
          <p className="mt-1 t-body-sm text-ink-2">
            Averaged across {ranks.length} measurements with a WHO distribution.
          </p>
        </>
      )}
    </>
  );

  return href ? (
    <a
      href={href}
      className="block rounded-md border border-hairline bg-surface-1 p-4 shadow-e1 hover:bg-surface-3"
    >
      {body}
    </a>
  ) : (
    <Card>{body}</Card>
  );
}

/** Per-parameter ranks with their curves. The detail behind the overall figure. */
export function RankBreakdown({ test }: { test: ClinicalTest }) {
  const ranks = parameterRanks(test);

  return (
    <div className="space-y-3">
      {ranks.map((row) => {
        const definition = markerCatalogue[row.code];
        return (
          <Card key={row.code}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="t-title-3 text-ink-1">{definition.label}</h3>
              <span className="shrink-0 t-title-2 text-ink-1 ps-num">
                {Math.round(row.centile)}
                <span className="t-caption font-normal text-ink-3">
                  {ordinal(Math.round(row.centile))}
                </span>
              </span>
            </div>
            <p className="mt-0.5 t-caption text-ink-3">
              {formatNumber(row.value, definition.decimals)} {definition.unit}
            </p>
            <div className="mt-3">
              <DistributionCurve code={row.code} value={row.value} />
            </div>
          </Card>
        );
      })}

      <Card tone="information">
        <p className="t-body-sm text-ink-2">{CENTILE_CAVEAT}</p>
        <p className="mt-2 t-caption text-ink-3">
          The overall figure is an average of the ranks above. The WHO manual notes that a combined
          multiparametric interpretation has been suggested but that reference limits for one have
          yet to be developed, so this is PreSeed&rsquo;s summary rather than a published figure.
        </p>
      </Card>
    </div>
  );
}

/** Compact rank chip, for use beside a value. */
export function RankChip({ centile }: { centile: number | null }) {
  if (centile == null) return null;
  const rounded = Math.round(centile);
  return (
    <span className={cx("t-caption text-ink-3")}>
      {rounded}
      {ordinal(rounded)} centile
    </span>
  );
}

export { StatusChip };
