"use client";

/**
 * Data visualisation.
 *
 * Rules this file obeys, from docs/design/tokens.md#charts:
 *  · One axis. Never two scales in one plot — different markers get their own chart.
 *  · Thin marks, recessive grid, 2px lines, 9px points with a 2px surface ring.
 *  · A single series carries no legend box; the title names it.
 *  · Values and labels wear ink tokens, never the series colour.
 *  · Every chart ships an accessible summary and a table alternative.
 *  · Colour is never the only channel: position, shape and text always carry it too.
 */

import { useId, useState } from "react";
import { Icon } from "@/components/icons";
import { Disclosure, StatusChip, cx } from "@/components/ui";
import {
  type ClinicalTest,
  type MarkerCode,
  type MarkerValue,
  type TestSource,
  NATURAL_VARIABILITY_FRACTION,
  effectiveReference,
  markerCatalogue,
  referenceContextLabel,
  referenceContextOf,
  referenceContextTone,
  referenceSets,
} from "@/lib/clinical";
import { formatDateShort, formatNumber } from "@/lib/format";

/* ==========================================================================
   Reference strip
   --------------------------------------------------------------------------
   The signature clinical mark. A hairline scale showing where a measured value
   falls relative to its reference interval. Neutral graphite throughout — the
   position of the tick and the words beneath it carry the meaning, so there is
   no red/green verdict anywhere in it.
   ========================================================================== */

export function ReferenceStrip({
  marker,
  priorValue,
}: {
  marker: MarkerValue;
  priorValue?: number;
}) {
  const definition = markerCatalogue[marker.code];
  const { low, high, shape } = effectiveReference(marker);
  const context = referenceContextOf(marker);

  // Scale: enough headroom that a value near a limit is not pinned to an edge.
  const anchor = shape === "upper_limit" ? (high ?? marker.value) : (low ?? marker.value);
  const candidates = [marker.value, anchor, priorValue ?? marker.value];
  const max = Math.max(...candidates) * 1.45 || 1;
  const pct = (value: number) => Math.max(2, Math.min(98, (value / max) * 100));

  const limitPct = pct(anchor);
  const valuePct = pct(marker.value);
  const priorPct = priorValue == null ? null : pct(priorValue);

  return (
    <div>
      <div className="relative h-9" aria-hidden="true">
        {/* The reference region, as a quiet fill rather than a warning colour. */}
        <span
          className="absolute inset-y-3.5 rounded-full bg-[var(--ps-chart-band)]"
          style={
            shape === "upper_limit"
              ? { left: 0, width: `${limitPct}%` }
              : { left: `${limitPct}%`, right: 0 }
          }
        />
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--ps-chart-grid)]" />

        {/* The reference limit. */}
        <span
          className="absolute inset-y-2 w-px bg-[var(--ps-chart-band-line)]"
          style={{ left: `${limitPct}%` }}
        />

        {/* The previous value, hollow, so history reads as history. */}
        {priorPct != null ? (
          <span
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--ps-chart-mark-prior)] bg-[var(--ps-surface-1)]"
            style={{ left: `${priorPct}%` }}
          />
        ) : null}

        {/* The measured value: solid ink, the highest-contrast mark present. */}
        <span
          className="absolute top-1/2 h-5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ps-chart-mark)] ring-2 ring-[var(--ps-surface-1)]"
          style={{ left: `${valuePct}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StatusChip tone={referenceContextTone(context)}>{referenceContextLabel[context]}</StatusChip>
        {low != null && shape !== "upper_limit" ? (
          <span className="t-mono text-ink-3">
            Limit {formatNumber(low, definition.decimals)} {definition.unit}
          </span>
        ) : null}
        {high != null && shape === "upper_limit" ? (
          <span className="t-mono text-ink-3">
            Limit {formatNumber(high, definition.decimals)} {definition.unit}
          </span>
        ) : null}
        {low != null && high != null && shape === "interval" ? (
          <span className="t-mono text-ink-3">
            Interval {formatNumber(low, definition.decimals)}–{formatNumber(high, definition.decimals)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ReferenceAttribution({ marker }: { marker: MarkerValue }) {
  const set = referenceSets[effectiveReference(marker).setId];
  if (!set) return null;
  return (
    <p className="t-caption text-ink-3">
      <span className="text-ink-2">{set.label}.</span> {set.note}
    </p>
  );
}

/* ==========================================================================
   Trend chart
   ========================================================================== */

type Point = { date: string; value: number; source: TestSource };

export function TrendChart({
  code,
  tests,
  height = 168,
}: {
  code: MarkerCode;
  tests: ClinicalTest[];
  height?: number;
}) {
  const titleId = useId();
  const descId = useId();
  const [active, setActive] = useState<number | null>(null);
  const definition = markerCatalogue[code];

  const points: Point[] = tests.flatMap((test) => {
    const marker = test.markers.find((candidate) => candidate.code === code);
    if (!marker) return [];
    return [{ date: test.collectedAt.slice(0, 10), value: marker.value, source: test.source }];
  });

  if (points.length === 0) return null;

  const firstMarker = tests.flatMap((t) => t.markers).find((m) => m.code === code)!;
  const { low, high, shape } = effectiveReference(firstMarker);
  const limit = shape === "upper_limit" ? high : low;

  const baseline = points[0].value;
  const variabilityLow = baseline * (1 - NATURAL_VARIABILITY_FRACTION);
  const variabilityHigh = baseline * (1 + NATURAL_VARIABILITY_FRACTION);

  const values = [...points.map((p) => p.value), limit ?? baseline, variabilityHigh, variabilityLow];
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values, 0);
  const span = rawMax - rawMin || 1;
  const yMax = rawMax + span * 0.14;
  const yMin = Math.max(0, rawMin - span * 0.08);

  const width = 320;
  const padding = { top: 18, right: 16, bottom: 26, left: 16 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const x = (index: number) =>
    padding.left + (points.length === 1 ? plotW / 2 : (index / (points.length - 1)) * plotW);
  const y = (value: number) => padding.top + plotH - ((value - yMin) / (yMax - yMin)) * plotH;

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.value)}`).join(" ");

  const last = points.at(-1)!;
  const summary =
    points.length === 1
      ? `${definition.label}: ${formatNumber(last.value, definition.decimals)} ${definition.unitSpoken} on ${formatDateShort(last.date)}. One measurement only, so no trend can be read.`
      : `${definition.label} across ${points.length} measurements, from ${formatNumber(points[0].value, definition.decimals)} on ${formatDateShort(points[0].date)} to ${formatNumber(last.value, definition.decimals)} ${definition.unitSpoken} on ${formatDateShort(last.date)}.${limit != null ? ` The reference limit is ${formatNumber(limit, definition.decimals)}.` : ""} Sample-to-sample variation of about 25 percent is normal, so differences inside that range should not be read as change.`;

  return (
    <figure className="m-0">
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
          onMouseLeave={() => setActive(null)}
        >
          <title id={titleId}>{`${definition.label} over time`}</title>
          <desc id={descId}>{summary}</desc>

          {/* Typical sample-to-sample variation around the baseline. Dotted, so
              it reads as tolerance rather than as a target. */}
          {points.length > 1 ? (
            <>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y(variabilityHigh)}
                y2={y(variabilityHigh)}
                stroke="var(--ps-chart-axis)"
                strokeWidth={1}
                strokeDasharray="1 3"
              />
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y(variabilityLow)}
                y2={y(variabilityLow)}
                stroke="var(--ps-chart-axis)"
                strokeWidth={1}
                strokeDasharray="1 3"
              />
            </>
          ) : null}

          {/* Reference region and its limit. */}
          {limit != null ? (
            <>
              <rect
                x={padding.left}
                width={plotW}
                y={shape === "upper_limit" ? padding.top : y(limit)}
                height={
                  shape === "upper_limit"
                    ? Math.max(0, y(limit) - padding.top)
                    : Math.max(0, padding.top + plotH - y(limit))
                }
                fill="var(--ps-chart-band)"
              />
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y(limit)}
                y2={y(limit)}
                stroke="var(--ps-chart-band-line)"
                strokeWidth={1}
                strokeDasharray="4 3"
              />
            </>
          ) : null}

          {/* Baseline axis. */}
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + plotH}
            y2={padding.top + plotH}
            stroke="var(--ps-chart-axis)"
            strokeWidth={1}
          />

          {points.length > 1 ? (
            <path d={path} fill="none" stroke="var(--ps-series-1)" strokeWidth={2} strokeLinecap="round" />
          ) : null}

          {points.map((point, index) => (
            <g key={point.date}>
              <circle
                cx={x(index)}
                cy={y(point.value)}
                r={4.5}
                fill="var(--ps-series-1)"
                stroke="var(--ps-surface-1)"
                strokeWidth={2}
              />
              {/* Generous invisible hit area: bigger than the mark, per spec. */}
              <circle
                cx={x(index)}
                cy={y(point.value)}
                r={14}
                fill="transparent"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                role="button"
                aria-label={`${formatDateShort(point.date)}: ${formatNumber(point.value, definition.decimals)} ${definition.unitSpoken}`}
                className="cursor-pointer outline-offset-4"
              />
            </g>
          ))}

          {/* Direct labels on the endpoints only — never a number on every point. */}
          <text
            x={x(0)}
            y={y(points[0].value) - 10}
            textAnchor={points.length > 1 ? "start" : "middle"}
            className="t-mono"
            fill="var(--ps-ink-2)"
            fontSize="10"
          >
            {formatNumber(points[0].value, definition.decimals)}
          </text>
          {points.length > 1 ? (
            <text
              x={x(points.length - 1)}
              y={y(last.value) - 10}
              textAnchor="end"
              className="t-mono"
              fill="var(--ps-ink-1)"
              fontSize="10"
              fontWeight="500"
            >
              {formatNumber(last.value, definition.decimals)}
            </text>
          ) : null}

          {points.map((point, index) => (
            <text
              key={`tick-${point.date}`}
              x={x(index)}
              y={height - 8}
              textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
              fill="var(--ps-ink-3)"
              fontSize="9.5"
            >
              {formatDateShort(point.date)}
            </text>
          ))}
        </svg>

        {active != null ? (
          <div
            role="status"
            className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 rounded-xs border border-hairline bg-surface-2 px-2 py-1 shadow-e2"
          >
            <span className="t-mono text-ink-1">
              {formatDateShort(points[active].date)} · {formatNumber(points[active].value, definition.decimals)}{" "}
              {definition.unit}
            </span>
          </div>
        ) : null}
      </div>

      <figcaption className="mt-1 t-caption text-ink-3">
        {limit != null
          ? `Shaded region is ${shape === "upper_limit" ? "at or below" : "at or above"} the reference limit. Dotted lines mark about 25% sample-to-sample variation around your baseline.`
          : "Dotted lines mark about 25% sample-to-sample variation around your baseline."}
      </figcaption>

      <div className="mt-2">
        <Disclosure label="View as table" glyph="results">
          <table className="w-full border-collapse">
            <caption className="visually-hidden">{summary}</caption>
            <thead>
              <tr className="border-b border-hairline">
                <th scope="col" className="py-1.5 text-left t-micro text-ink-3">
                  Collected
                </th>
                <th scope="col" className="py-1.5 text-right t-micro text-ink-3">
                  {definition.unit}
                </th>
                <th scope="col" className="py-1.5 text-right t-micro text-ink-3">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.date} className="border-b border-hairline last:border-0">
                  <td className="py-2 t-caption text-ink-2">{formatDateShort(point.date)}</td>
                  <td className="py-2 text-right t-mono text-ink-1">
                    {formatNumber(point.value, definition.decimals)}
                  </td>
                  <td className="py-2 text-right t-caption text-ink-3">{point.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Disclosure>
      </div>
    </figure>
  );
}

/* ==========================================================================
   Score meter
   --------------------------------------------------------------------------
   A segmented track with a value tick. Not a dial and not a ring: those read as
   a game score. The number, the band word and the tick position all say the
   same thing.
   ========================================================================== */

export function ScoreMeter({
  value,
  label,
  bands = 5,
  tone = "accent",
}: {
  value: number | null;
  label: string;
  bands?: number;
  tone?: "accent" | "information";
}) {
  const series = tone === "accent" ? "var(--ps-accent)" : "var(--ps-information)";
  return (
    <div
      role="meter"
      aria-valuenow={value ?? undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      aria-valuetext={value == null ? "Insufficient data" : `${value} out of 100`}
    >
      <div className="relative h-2.5 overflow-hidden rounded-full bg-surface-3">
        {value != null ? (
          <span
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${value}%`, background: series }}
          />
        ) : null}
        {/* 2px surface gaps between band divisions, per the mark spec. */}
        {Array.from({ length: bands - 1 }).map((_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="absolute inset-y-0 w-0.5 bg-[var(--ps-surface-1)]"
            style={{ left: `${((index + 1) / bands) * 100}%` }}
          />
        ))}
      </div>
      {value == null ? (
        <p className="mt-1.5 t-caption text-ink-3">No score — not enough information yet.</p>
      ) : null}
    </div>
  );
}

/* ==========================================================================
   Domain breakdown
   ========================================================================== */

export function DomainBars({
  rows,
}: {
  rows: Array<{
    id: string;
    label: string;
    score: number | null;
    weight: number;
    href?: string;
    confidence: string;
  }>;
}) {
  return (
    <ul className="space-y-3.5">
      {rows.map((row) => (
        <li key={row.id}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="t-body-sm text-ink-1">{row.label}</span>
            <span className="t-mono text-ink-1">
              {row.score == null ? "—" : row.score}
              <span className="text-ink-3">/100</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
            {row.score != null ? (
              <span
                className="block h-full rounded-full bg-accent"
                style={{ width: `${row.score}%` }}
              />
            ) : (
              <span
                aria-hidden="true"
                className="block h-full rounded-full bg-[repeating-linear-gradient(45deg,var(--ps-line-strong)_0_3px,transparent_3px_6px)]"
              />
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 t-caption text-ink-3">
            <span className="t-mono">weight {row.weight}</span>
            <span>{row.confidence}</span>
            {row.score == null ? <span className="text-ink-2">Insufficient data</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ==========================================================================
   Adherence band
   --------------------------------------------------------------------------
   A rolling window, deliberately not a streak. Cells carry state by fill and
   glyph, so a gap is legible without being punitive — and there is no unbroken
   count to lose.
   ========================================================================== */

export function AdherenceBand({
  days,
}: {
  days: Array<{ date: string; status: "completed" | "partial" | "skipped" | "none" }>;
}) {
  return (
    <div>
      <ul className="flex gap-1" role="list">
        {days.map((day) => (
          <li key={day.date} className="flex-1">
            <span
              title={`${formatDateShort(day.date)}: ${day.status === "none" ? "nothing logged" : day.status}`}
              className={cx(
                "flex h-8 items-center justify-center rounded-xs border",
                day.status === "completed" && "border-accent-line bg-accent-quiet text-accent",
                day.status === "partial" && "border-hairline bg-surface-3 text-ink-2",
                day.status === "skipped" && "border-hairline bg-transparent text-ink-3",
                day.status === "none" &&
                  "border-dashed border-hairline bg-transparent text-ink-3",
              )}
            >
              <span className="visually-hidden">
                {formatDateShort(day.date)}: {day.status === "none" ? "nothing logged" : day.status}
              </span>
              {day.status === "completed" ? <Icon name="check" size={13} /> : null}
              {day.status === "partial" ? <Icon name="partial-circle" size={12} /> : null}
              {day.status === "skipped" ? <Icon name="skip-circle" size={12} /> : null}
              {day.status === "none" ? <span aria-hidden="true" className="t-mono">·</span> : null}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 t-caption text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="check" size={12} className="text-accent" /> Completed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="partial-circle" size={12} /> Partly
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="skip-circle" size={12} /> Skipped
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true">·</span> Not logged
        </span>
      </div>
    </div>
  );
}
