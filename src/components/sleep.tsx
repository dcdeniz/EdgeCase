"use client";

/**
 * Sleep charts.
 *
 * Stage colour follows the three-slot categorical palette, assigned in fixed
 * order to the three actual sleep stages: deep, REM, light. "Awake" takes the
 * `unavailable` grey rather than a fourth series slot, which respects the
 * three-colour cap in docs/design/tokens.md and is also the more honest
 * mapping — time awake is the absence of a sleep stage, not another one.
 */

import { Icon } from "@/components/icons";
import { cx } from "@/components/ui";
import {
  formatDuration,
  sleepStageLabel,
  sleepStageOrder,
  type SleepNight,
  type SleepStage,
} from "@/lib/wearable";

const stageColour: Record<SleepStage, string> = {
  deep: "var(--ps-series-1)",
  rem: "var(--ps-series-2)",
  light: "var(--ps-series-3)",
  awake: "var(--ps-unavailable)",
};

/** Row order top-to-bottom, matching clinical hypnogram convention. */
const rowOrder: SleepStage[] = ["awake", "rem", "light", "deep"];

export function Hypnogram({ night }: { night: SleepNight }) {
  const total = night.segments.reduce((sum, segment) => sum + segment.durationMinute, 0);
  if (total === 0) return null;

  const rowHeight = 15;
  const rowGap = 5;

  return (
    <figure>
      <div
        className="relative w-full"
        style={{ height: rowOrder.length * rowHeight + (rowOrder.length - 1) * rowGap }}
        role="img"
        aria-label={`Sleep stages from ${night.bedtime} to ${night.wakeTime}. ${sleepStageOrder
          .map((stage) => `${sleepStageLabel[stage]} ${formatDuration(night.stages[stage])}`)
          .join(", ")}.`}
      >
        {rowOrder.map((stage, rowIndex) => (
          <div
            key={stage}
            className="absolute inset-x-0 rounded-xs bg-surface-3/60"
            style={{ top: rowIndex * (rowHeight + rowGap), height: rowHeight }}
          />
        ))}

        {night.segments.map((segment, index) => {
          const rowIndex = rowOrder.indexOf(segment.stage);
          return (
            <div
              key={index}
              className="absolute rounded-xs"
              style={{
                left: `${(segment.startMinute / total) * 100}%`,
                width: `${Math.max(0.6, (segment.durationMinute / total) * 100)}%`,
                top: rowIndex * (rowHeight + rowGap),
                height: rowHeight,
                background: stageColour[segment.stage],
              }}
            />
          );
        })}
      </div>

      <div className="mt-2 flex justify-between t-mono text-ink-3">
        <span>{night.bedtime}</span>
        <span>{night.wakeTime}</span>
      </div>

      <figcaption className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {sleepStageOrder.map((stage) => (
          <span key={stage} className="inline-flex items-center gap-1.5 t-caption text-ink-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{ background: stageColour[stage] }}
            />
            {sleepStageLabel[stage]}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export function StageBars({ night }: { night: SleepNight }) {
  const total = sleepStageOrder.reduce((sum, stage) => sum + night.stages[stage], 0);

  return (
    <ul className="space-y-3.5">
      {sleepStageOrder.map((stage) => {
        const minutes = night.stages[stage];
        const percent = total === 0 ? 0 : Math.round((minutes / total) * 100);
        return (
          <li key={stage}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="inline-flex items-center gap-2 t-body-sm text-ink-1">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{ background: stageColour[stage] }}
                />
                {sleepStageLabel[stage]}
              </span>
              <span className="shrink-0 t-body-sm text-ink-1 ps-num">
                {formatDuration(minutes)}
                <span className="ml-2 t-mono text-ink-3">{percent}%</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <span
                className="block h-full rounded-full"
                style={{ width: `${percent}%`, background: stageColour[stage] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Seven-night duration bars, for the trend under the nightly detail. */
export function SleepWeekBars({
  nights,
  needMinutes = 480,
}: {
  nights: SleepNight[];
  needMinutes?: number;
}) {
  const max = Math.max(needMinutes, ...nights.map((night) => night.asleepMinutes));

  return (
    <ul className="flex items-end gap-1.5" style={{ height: 96 }}>
      {nights.map((night) => {
        const height = Math.round((night.asleepMinutes / max) * 100);
        const metNeed = night.asleepMinutes >= needMinutes;
        return (
          <li key={night.date} className="flex h-full flex-1 flex-col justify-end gap-1.5">
            <span
              title={`${night.date}: ${formatDuration(night.asleepMinutes)}`}
              className={cx(
                "block w-full rounded-xs",
                metNeed ? "bg-accent" : "bg-accent/40",
              )}
              style={{ height: `${height}%` }}
            >
              <span className="visually-hidden">
                {night.date}: {formatDuration(night.asleepMinutes)}
              </span>
            </span>
            <span aria-hidden="true" className="text-center t-micro tracking-normal text-ink-3">
              {new Date(`${night.date}T00:00:00Z`)
                .toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })
                .slice(0, 1)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The claim ceiling for wearable data, rendered wherever sleep drives anything.
 * The master build prompt is explicit: sleep is a modifiable contextual factor,
 * and it does not license a statement about a semen measurement.
 */
export function SleepEvidenceNote() {
  return (
    <p className="flex gap-2 t-caption text-ink-3">
      <Icon name="info" size={14} className="mt-0.5 shrink-0" />
      Sleep informs recovery and hormonal context. No trial has shown that improving sleep
      changes a specific semen measurement by a specific amount.
    </p>
  );
}
