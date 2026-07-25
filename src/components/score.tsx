"use client";

/**
 * Behaviour-score presentation components.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A ring is used here, which the original design rationale ruled out for
 * scores. The exception is deliberate and narrow: these components may render
 * MODIFIABLE BEHAVIOUR ONLY. The objection to a ring was that it makes a
 * composite of clinical measurement, prediction and data quality feel
 * authoritative. Nothing clinical reaches this file, and `ScoreRing` will not
 * render without a caveat line, so the objection does not apply.
 *
 * Do not reuse `ScoreRing` for a marker value, a screening risk or a confidence
 * figure. Those keep their existing, deliberately unglamorous treatments —
 * `ReferenceStrip`, `RiskCard` and `ConfidenceCard`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { cx } from "@/components/ui";
import { formatDateShort } from "@/lib/format";
import { BEHAVIOUR_SCORE_CAVEAT, type GridCell } from "@/lib/behaviour-score";

/* ==========================================================================
   Score ring
   ========================================================================== */

export function ScoreRing({
  value,
  max = 100,
  size = 168,
  headline,
  unit,
  sublabel,
  label,
  tone = "accent",
  caveat = true,
}: {
  value: number | null;
  max?: number;
  size?: number;
  /** Overrides the centre figure. Use for durations, where the score is not the point. */
  headline?: string;
  unit?: string;
  sublabel?: string;
  label: string;
  tone?: "accent" | "information" | "attention";
  /** Only set false where the caveat is already stated in adjacent copy. */
  caveat?: boolean;
}) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = value == null ? 0 : Math.max(0, Math.min(1, value / max));
  const colour =
    tone === "accent"
      ? "var(--ps-accent)"
      : tone === "attention"
        ? "var(--ps-attention)"
        : "var(--ps-information)";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="meter"
          aria-valuenow={value ?? undefined}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
          aria-valuetext={value == null ? "Not enough logged" : `${value} out of ${max}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--ps-surface-3)"
            strokeWidth={stroke}
            strokeDasharray={value == null ? "3 7" : undefined}
          />
          {value != null ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colour}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${circumference * ratio} ${circumference}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{
                transition: "stroke-dasharray var(--ps-duration-slow) var(--ps-ease-out)",
              }}
            />
          ) : null}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {value == null && !headline ? (
            <>
              <span className="t-title-3 text-ink-2">—</span>
              <span className="mt-1 max-w-[7rem] t-caption text-ink-3">Not enough logged</span>
            </>
          ) : (
            <>
              <span className="t-display-1 text-ink-1 ps-num">{headline ?? value}</span>
              {unit ? <span className="t-caption text-ink-3">{unit}</span> : null}
              {sublabel ? (
                <span className="mt-0.5 max-w-[8rem] t-caption text-ink-3">{sublabel}</span>
              ) : null}
            </>
          )}
        </div>
      </div>

      {caveat ? (
        <p className="mt-3 max-w-[17rem] text-center t-caption text-ink-3">
          {BEHAVIOUR_SCORE_CAVEAT}
        </p>
      ) : null}
    </div>
  );
}

/* ==========================================================================
   Metric tile
   ========================================================================== */

export function MetricTile({
  glyph,
  label,
  value,
  unit,
  detail,
  href,
  tone = "neutral",
}: {
  glyph: IconName;
  label: string;
  value: string;
  unit?: string;
  detail?: string;
  href?: string;
  tone?: "neutral" | "accent";
}) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        <Icon
          name={glyph}
          size={15}
          className={tone === "accent" ? "text-accent" : "text-ink-3"}
        />
        <span className="t-micro text-ink-3">{label}</span>
      </div>
      <p className="mt-2 t-title-1 text-ink-1 ps-num">
        {value}
        {unit ? <span className="ml-1 t-caption font-normal text-ink-3">{unit}</span> : null}
      </p>
      {detail ? <p className="mt-0.5 t-caption text-ink-3">{detail}</p> : null}
    </>
  );

  const className = cx(
    "block rounded-md border border-hairline bg-surface-1 p-3.5 text-left",
    href && "transition-colors duration-(--ps-duration-fast) hover:bg-surface-3",
  );

  return href ? (
    <Link href={href} className={className}>
      {body}
      <span className="mt-2 inline-flex items-center gap-1 t-caption text-accent">
        Open
        <Icon name="chevron-right" size={13} />
      </span>
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/* ==========================================================================
   Contribution grid
   --------------------------------------------------------------------------
   A year of logged days. There is no streak count anywhere in this component,
   and there must not be one: the rolling window is the headline number, and a
   gap is a gap in the record rather than a failure to be recovered.
   ========================================================================== */

const levelClass: Record<GridCell["level"], string> = {
  0: "bg-surface-3",
  1: "bg-accent/25",
  2: "bg-accent/45",
  3: "bg-accent/70",
  4: "bg-accent",
};

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

export function ContributionGrid({
  cells,
  onSelect,
  selected,
}: {
  cells: GridCell[];
  onSelect?: (date: string) => void;
  selected?: string;
}) {
  const weeks = Math.max(...cells.map((cell) => cell.weekIndex)) + 1;

  // Indexed by column/row so the render below is a lookup rather than a scan.
  const byPosition = new Map<string, GridCell>();
  for (const cell of cells) byPosition.set(`${cell.weekIndex}:${cell.weekday}`, cell);

  /*
   * One label per month, on the first column that month appears in. Tracking
   * the last month emitted matters: a month can open partway through a column
   * and still have days in the next, which would otherwise label both.
   */
  const monthLabels = new Map<number, string>();
  let lastMonth = "";
  for (const cell of cells) {
    const month = cell.date.slice(0, 7);
    if (month === lastMonth) continue;
    lastMonth = month;
    if (monthLabels.has(cell.weekIndex)) continue;
    monthLabels.set(
      cell.weekIndex,
      new Date(`${cell.date}T00:00:00Z`).toLocaleDateString("en-GB", {
        month: "short",
        timeZone: "UTC",
      }),
    );
  }

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-1">
          <div className="flex shrink-0 flex-col gap-[3px] pt-[15px] pr-1">
            {weekdayLabels.map((day, index) => (
              <span
                key={index}
                aria-hidden="true"
                className="flex h-[11px] items-center t-micro tracking-normal text-ink-3"
              >
                {index % 2 === 1 ? day : ""}
              </span>
            ))}
          </div>

          <div>
            <div className="flex gap-[3px]">
              {Array.from({ length: weeks }).map((_, weekIndex) => (
                <span
                  key={weekIndex}
                  aria-hidden="true"
                  className="w-[11px] t-micro tracking-normal text-ink-3"
                >
                  {monthLabels.get(weekIndex) ? (
                    <span className="relative -left-px block whitespace-nowrap">
                      {monthLabels.get(weekIndex)}
                    </span>
                  ) : null}
                </span>
              ))}
            </div>

            <div className="mt-1 flex gap-[3px]">
              {Array.from({ length: weeks }).map((_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }).map((_, weekday) => {
                    const cell = byPosition.get(`${weekIndex}:${weekday}`);
                    if (!cell) {
                      return <span key={weekday} className="h-[11px] w-[11px]" />;
                    }
                    const title = `${formatDateShort(cell.date)}: ${
                      cell.score == null ? "nothing logged" : `${cell.score} of 100`
                    }`;
                    const isSelected = selected === cell.date;
                    return onSelect ? (
                      <button
                        key={weekday}
                        type="button"
                        title={title}
                        onClick={() => onSelect(cell.date)}
                        aria-pressed={isSelected}
                        className={cx(
                          "h-[11px] w-[11px] rounded-[2px]",
                          levelClass[cell.level],
                          isSelected && "ring-2 ring-ink-1 ring-offset-1 ring-offset-[var(--ps-surface-1)]",
                        )}
                      >
                        <span className="visually-hidden">{title}</span>
                      </button>
                    ) : (
                      <span
                        key={weekday}
                        title={title}
                        className={cx("h-[11px] w-[11px] rounded-[2px]", levelClass[cell.level])}
                      >
                        <span className="visually-hidden">{title}</span>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="t-caption text-ink-3">Nothing logged reads as a gap, not a failure.</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="t-caption text-ink-3">Less</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span
              key={level}
              aria-hidden="true"
              className={cx("h-[11px] w-[11px] rounded-[2px]", levelClass[level])}
            />
          ))}
          <span className="t-caption text-ink-3">More</span>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Weekly trend
   ========================================================================== */

export function WeeklySparkline({
  series,
  height = 56,
}: {
  series: Array<{ weekEnding: string; score: number | null }>;
  height?: number;
}) {
  const width = 320;
  const scored = series.filter((point) => point.score != null);
  if (scored.length < 2) {
    return <p className="t-caption text-ink-3">Not enough weeks logged to draw a trend.</p>;
  }

  const step = width / Math.max(1, series.length - 1);
  const points = series
    .map((point, index) =>
      point.score == null ? null : `${index * step},${height - (point.score / 100) * height}`,
    )
    .filter((value): value is string => value != null);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={`Weekly behaviour score across ${series.length} weeks`}
      preserveAspectRatio="none"
    >
      <line
        x1={0}
        y1={height - (65 / 100) * height}
        x2={width}
        y2={height - (65 / 100) * height}
        stroke="var(--ps-chart-grid)"
        strokeWidth={1}
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--ps-series-1)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
