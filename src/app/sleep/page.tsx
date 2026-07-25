"use client";

import { useMemo } from "react";
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
  latestSleepNight,
  mean,
  sleepHistory,
  sleepNeedPercent,
} from "@/lib/wearable";

/**
 * Sleep detail for the most recent night.
 *
 * Everything here is generated. The screen therefore carries the simulated
 * label in the same places a clinical result would, and the evidence note fixes
 * the claim ceiling: sleep is recovery and hormonal *context*, and the product
 * does not get to convert it into a statement about a semen measurement.
 */
export default function SleepPage() {
  const night = useMemo(() => latestSleepNight(), []);
  const week = useMemo(() => sleepHistory(7), []);

  if (!night) {
    return (
      <Screen title="Sleep" back="/today">
        <EmptyState
          glyph="unavailable"
          title="No nights recorded"
          body="No wearable is connected, and the simulated record has no night in the last fortnight."
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
          <SimulatedBadge compact />
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
          <MetaList
            items={[
              { label: "Asleep", value: `${night.bedtime} — ${night.wakeTime}` },
              { label: "Awake in bed", value: formatDuration(night.stages.awake) },
              {
                label: "Bedtime spread",
                value: `± ${night.bedtimeVarianceMinutes} min`,
              },
            ]}
          />
        </div>
      </Card>

      <section className="mt-6" aria-labelledby="hypnogram">
        <SectionHeader id="hypnogram" eyebrow="Through the night" title="Sleep stages" level={2} />
        <Card>
          <Hypnogram night={night} />
          <p className="mt-3 t-caption text-ink-3">
            Deep sleep concentrates early in the night and REM late, which is the ordinary shape.
            Brief wakings are normal and appear here rather than being smoothed away.
          </p>
        </Card>
      </section>

      <section className="mt-6" aria-labelledby="stages">
        <SectionHeader id="stages" eyebrow="Breakdown" title="Stages" level={2} />
        <Card>
          <StageBars night={night} />
        </Card>
      </section>

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
        </Card>
      </section>

      <Card className="mt-6">
        <SectionHeader eyebrow="How this is used" title="Where sleep goes" level={3} />
        <p className="t-body-sm text-ink-2">
          Sleep is the heaviest of the four behaviour domains, at weight 30. It is scored on
          duration against need and on how steady your bedtime is, because the evidence card covers
          circadian disruption as well as short sleep.
        </p>
        <div className="mt-3 border-t border-hairline pt-3">
          <SleepEvidenceNote />
        </div>
      </Card>

      <DisclaimerFooter />
    </Screen>
  );
}
