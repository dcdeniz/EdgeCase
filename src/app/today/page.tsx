"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Icon } from "@/components/icons";
import { DisclaimerFooter, SafetyAlert, Screen } from "@/components/shell";
import {
  AdaptationProposal,
  ConsistencyCard,
  ProtocolAction,
  ProtocolProgress,
  RetestPrompt,
} from "@/components/protocol";
import { ReadinessSummary } from "@/components/domain";
import { MetricTile, ScoreRing } from "@/components/score";
import { Button, ButtonLink, Card, EmptyState, SectionHeader, SimulatedBadge } from "@/components/ui";
import { TODAY, daysBetween, formatDate } from "@/lib/format";
import { itemsForWeek, protocolDay, protocolWeek, usePrototype } from "@/lib/store";
import { behaviourBandLabel, behaviourWindow } from "@/lib/behaviour-score";
import { dietDayFor } from "@/lib/nutrition";
import { formatDuration, latestHealthDay, latestSleepNight, sleepNeedPercent } from "@/lib/wearable";

/**
 * Today answers one question: what do I do now. Everything competing with that
 * answer is either removed or pushed below it.
 */
export default function TodayPage() {
  const { state, readiness, latestSemen, seedDemo } = usePrototype();
  const protocol = state.protocol;

  const night = useMemo(() => latestSleepNight(), []);
  const health = useMemo(() => latestHealthDay(), []);
  const diet = useMemo(() => dietDayFor(TODAY), []);
  const week = useMemo(() => behaviourWindow(state, 7), [state]);

  return (
    <Screen title="Today" eyebrow={formatDate(TODAY)}>
      {/* Serious flags sit above everything, including a good score. */}
      {readiness.gates.length > 0 ? (
        <div className="mb-4 space-y-3">
          {readiness.gates.map((gate) => (
            <SafetyAlert
              key={gate.id}
              severity={gate.severity}
              title={gate.title}
              body={
                <>
                  <p>{gate.body}</p>
                  <p className="mt-2 font-medium text-ink-1">{gate.action}</p>
                </>
              }
              nonModifiable={gate.nonModifiable}
            />
          ))}
        </div>
      ) : null}

      {state.adaptation ? (
        <div className="mb-4">
          <AdaptationProposal />
        </div>
      ) : null}

      {/*
        Connected data, above the plan but below any safety flag. These are
        inputs the user supplied today, so they belong near the top; each tile
        is a door to its own screen rather than an interpretation in itself.
      */}
      <section aria-labelledby="today-metrics">
        <h2 id="today-metrics" className="visually-hidden">
          Today&rsquo;s data
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <MetricTile
            glyph="moon"
            label="Sleep"
            value={night ? formatDuration(night.asleepMinutes) : "—"}
            detail={night ? `${sleepNeedPercent(night)}% of need` : "No night recorded"}
            href="/sleep"
            tone="accent"
          />
          <MetricTile
            glyph="food"
            label="Diet pattern"
            value={diet.score == null ? "—" : String(diet.score)}
            unit={diet.score == null ? undefined : "/100"}
            detail={
              diet.entries.length === 0
                ? "Nothing logged"
                : `${diet.entries.length} meal${diet.entries.length === 1 ? "" : "s"}`
            }
            href="/food"
          />
          <MetricTile
            glyph="steps"
            label="Steps"
            value={health ? health.steps.toLocaleString("en-GB") : "—"}
            detail={health ? `${health.activeMinutes} active minutes` : "No data"}
          />
          <MetricTile
            glyph="heart"
            label="Resting heart rate"
            value={health ? String(health.restingHeartRate) : "—"}
            unit="bpm"
            detail={health ? `HRV ${health.heartRateVariability} ms` : "No data"}
          />
        </div>
        <p className="mt-2 t-caption text-ink-3">
          Wearable figures are simulated. Heart-rate variability is a recovery proxy, never a
          hormone measurement.
        </p>
      </section>

      <Card className="mt-4">
        <div className="flex items-center gap-4">
          <ScoreRing
            value={week.score}
            size={104}
            label="Behaviour score, trailing seven days"
            caveat={false}
          />
          <div className="min-w-0 flex-1">
            <p className="t-micro text-ink-3">This week</p>
            <p className="mt-1 t-title-2 text-ink-1">{behaviourBandLabel(week.score)}</p>
            <p className="mt-1 t-caption text-ink-2">
              Across sleep, diet, activity and adherence. Reflects modifiable behaviours, not
              measured sperm quality.
            </p>
            <Link
              href="/score"
              className="mt-2 inline-flex items-center gap-1 t-body-sm font-medium text-accent"
            >
              Week and year
              <Icon name="chevron-right" size={15} />
            </Link>
          </div>
        </div>
      </Card>

      <div className="mt-6" />

      {!protocol ? (
        <EmptyState
          glyph="protocol"
          title="No protocol yet"
          body="A dated protocol is built from a measured result, so the plan responds to something real rather than to a questionnaire alone."
          action={
            <div className="flex flex-col gap-2">
              <ButtonLink href="/tests/new" glyph="plus">
                Add a clinical result
              </ButtonLink>
              <Button variant="quiet" onClick={() => seedDemo("baseline")}>
                Load the demo baseline instead
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <ProtocolProgress protocol={protocol} />

          {daysBetween(protocol.retestDueOn, TODAY) > -14 ? (
            <div className="mt-4">
              <RetestPrompt protocol={protocol} />
            </div>
          ) : null}

          <section className="mt-6" aria-labelledby="today-actions">
            <SectionHeader
              id="today-actions"
              eyebrow={`Day ${protocolDay(protocol)} · week ${protocolWeek(protocol)}`}
              title="Today's actions"
              action={
                <Link href="/protocol" className="t-caption font-medium text-accent">
                  Full plan
                </Link>
              }
            />
            <div className="space-y-3">
              {itemsForWeek(protocol, protocolWeek(protocol))
                .filter((item) => item.cadence === "daily")
                .map((item) => (
                  <ProtocolAction key={item.id} item={item} />
                ))}
            </div>
          </section>

          <section className="mt-6" aria-labelledby="today-week">
            <SectionHeader id="today-week" eyebrow="This week" title="Weekly actions" level={3} />
            <div className="space-y-3">
              {itemsForWeek(protocol, protocolWeek(protocol))
                .filter((item) => item.cadence !== "daily")
                .map((item) => (
                  <ProtocolAction key={item.id} item={item} showLink={false} />
                ))}
            </div>
          </section>

          <div className="mt-6">
            <ConsistencyCard />
          </div>

          <div className="mt-4">
            <Card>
              <SectionHeader eyebrow="Check-in" title="How is this going?" level={3} />
              <p className="t-body-sm text-ink-2">
                Two minutes. Your answers decide what PreSeed proposes changing — and it will always
                propose rather than change it for you.
              </p>
              <ButtonLink href="/protocol/check-in" variant="secondary" full className="mt-3" glyph="pencil">
                Start check-in
              </ButtonLink>
            </Card>
          </div>
        </>
      )}

      <section className="mt-6" aria-labelledby="today-readiness">
        <SectionHeader id="today-readiness" eyebrow="Behaviour" title="Readiness" level={3} />
        <ReadinessSummary readiness={readiness} />
      </section>

      {latestSemen ? (
        <div className="mt-4">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="t-micro text-ink-3">Latest clinical result</p>
                <p className="mt-1 t-body-sm text-ink-1">{formatDate(latestSemen.collectedAt)}</p>
              </div>
              {latestSemen.source === "simulated" ? <SimulatedBadge compact /> : null}
            </div>
            <Link
              href="/results"
              className="mt-3 flex min-h-(--ps-touch-min) items-center justify-between rounded-sm bg-surface-3 px-3 t-body-sm font-medium text-ink-1"
            >
              Open results
              <Icon name="chevron-right" size={18} className="text-ink-3" />
            </Link>
          </Card>
        </div>
      ) : null}

      <DisclaimerFooter />
    </Screen>
  );
}
