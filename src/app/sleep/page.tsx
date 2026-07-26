"use client";

import { Icon } from "@/components/icons";
import { ScoreRing } from "@/components/score";
import { Hypnogram, SleepEvidenceNote, SleepWeekBars, StageBars } from "@/components/sleep";
import { DisclaimerFooter, Screen } from "@/components/shell";
import {
  Card,
  EmptyState,
  MetaList,
  SectionHeader,
  SimulatedBadge,
  StatusChip,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  formatDuration,
  mean,
  sleepNeedPercent,
} from "@/lib/wearable";
import { latestSleepFrom, useAccountWearableData } from "@/lib/account-wearable";

/**
 * Sleep detail for the most recent night.
 *
 * Everything here is generated. The screen therefore carries the simulated
 * label in the same places a clinical result would, and the evidence note fixes
 * the claim ceiling: sleep is recovery and hormonal *context*, and the product
 * does not get to convert it into a statement about a semen measurement.
 */
export default function SleepPage() {
  const { data: wearable } = useAccountWearableData();
  const night = latestSleepFrom(wearable);
  const week = wearable.sleepNights.slice(-7);

  if (!night) {
    return (
      <Screen title="Sleep" back="/today">
        <EmptyState
          glyph="unavailable"
          title="No nights recorded"
          body={`No sleep duration is available from ${wearable.sourceLabel}.`}
        />
      </Screen>
    );
  }

  const percent = sleepNeedPercent(night);
  const weekMean = mean(week.map((entry) => entry.asleepMinutes));
  const nightsMeetingNeed = week.filter((entry) => entry.asleepMinutes >= entry.needMinutes).length;

  return (
    <Screen title="Sleep" eyebrow={formatDate(night.date)} back="/today">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon name="moon" size={16} className="text-accent" />
            <span className="t-micro text-ink-3">Time asleep</span>
          </div>
          {wearable.source === "simulated" ? (
            <SimulatedBadge compact />
          ) : (
            <StatusChip tone="supported">Google Health</StatusChip>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <p className="t-display-1 text-ink-1 ps-num">{formatDuration(night.asleepMinutes)}</p>
            <p className="mt-1 t-body-sm text-ink-2">
              of {formatDuration(night.needMinutes)} need
            </p>
          </div>
          <ScoreRing
            value={percent}
            size={116}
            unit="of need"
            label="Share of sleep need met"
            caveat={false}
          />
        </div>

        <div className="mt-4 border-t border-hairline pt-3">
          <MetaList items={[
            { label: "Source", value: wearable.sourceLabel },
            {
              label: "Sleep interval",
              value: night.bedtime && night.wakeTime
                ? `${night.bedtime} — ${night.wakeTime}`
                : "Unavailable",
            },
            {
              label: "Awake in bed",
              value: night.stages.awake == null
                ? "Unavailable"
                : formatDuration(night.stages.awake),
            },
            {
              label: "Bedtime spread",
              value: night.bedtimeVarianceMinutes == null
                ? "Unavailable"
                : `± ${night.bedtimeVarianceMinutes} min`,
            },
          ]} />
        </div>
      </Card>

      {night.segments ? <section className="mt-6" aria-labelledby="hypnogram">
        <SectionHeader id="hypnogram" eyebrow="Through the night" title="Sleep stages" level={2} />
        <Card>
          <Hypnogram night={night} />
        </Card>
      </section> : null}

      {Object.values(night.stages).some((value) => value != null) ? <section className="mt-6" aria-labelledby="stages">
        <SectionHeader id="stages" eyebrow="Breakdown" title="Stages" level={2} />
        <Card>
          <StageBars night={night} />
        </Card>
      </section> : null}

      <section className="mt-6" aria-labelledby="week">
        <SectionHeader id="week" eyebrow="Last seven nights" title="Duration" level={2} />
        <Card>
          <SleepWeekBars nights={week} />
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-hairline pt-3">
            <div>
              <p className="t-micro text-ink-3">Nightly mean</p>
              <p className="mt-1 t-title-2 text-ink-1 ps-num">
                {weekMean == null ? "—" : formatDuration(Math.round(weekMean))}
              </p>
            </div>
            <div>
              <p className="t-micro text-ink-3">Nights meeting need</p>
              <p className="mt-1 t-title-2 text-ink-1 ps-num">
                {nightsMeetingNeed}
                <span className="t-caption font-normal text-ink-3">/{week.length}</span>
              </p>
            </div>
          </div>
          {week.length < 7 ? (
            <p className="mt-3">
              <StatusChip tone="unavailable" glyph="unavailable">
                {7 - week.length} night{7 - week.length === 1 ? "" : "s"} not recorded
              </StatusChip>
            </p>
          ) : null}
          <p className="mt-3 t-caption text-ink-3">Source: {wearable.sourceLabel}</p>
        </Card>
      </section>

      <div className="mt-6">
        <SleepEvidenceNote />
      </div>

      <DisclaimerFooter />
    </Screen>
  );
}
