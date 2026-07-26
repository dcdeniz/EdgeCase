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
import { MetricTile, ReadinessHero } from "@/components/score";
import { SemenProfileBoard, SpermAgeCard } from "@/components/profile-board";
import { contributorsFor } from "@/lib/contributors";
import { Button, ButtonLink, Card, EmptyState, SectionHeader, SimulatedBadge } from "@/components/ui";
import { TODAY, daysBetween, formatDate } from "@/lib/format";
import { itemsForWeek, protocolDay, protocolWeek, usePrototype } from "@/lib/store";
import { readinessProgress } from "@/lib/behaviour-score";
import { dietDayFor } from "@/lib/nutrition";
import { formatDuration, latestHealthDay, latestSleepNight, sleepNeedPercent } from "@/lib/wearable";

/**
 * Today answers one question: what do I do now. Everything competing with that
 * answer is either removed or pushed below it.
 */
export default function TodayPage() {
  const { state, readiness, latestSemen, baselineSemen, hormonePanel, seedDemo } = usePrototype();
  const protocol = state.protocol;
  const contributors = useMemo(() => contributorsFor(state), [state]);

  const night = useMemo(() => latestSleepNight(), []);
  const health = useMemo(() => latestHealthDay(), []);
  const diet = useMemo(() => dietDayFor(TODAY), []);
  const progress = useMemo(() => readinessProgress(state), [state]);

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
        Readiness leads the screen. A safety gate still outranks it above —
        "serious flags sit above everything, including a good score" is not
        negotiable — but below that, this card is the first thing read.
      */}
      <section className="mb-4" aria-labelledby="today-readiness-hero">
        <h2 id="today-readiness-hero" className="visually-hidden">
          Seed Score
        </h2>
        <ReadinessHero progress={progress} />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link
            href="/score"
            className="flex min-h-(--ps-touch-min) items-center justify-between rounded-sm border border-hairline bg-surface-1 px-3.5 t-body-sm font-medium text-ink-1"
          >
            Week and year
            <Icon name="chevron-right" size={18} className="text-ink-3" />
          </Link>
          <Link
            href="/goals"
            className="flex min-h-(--ps-touch-min) items-center justify-between rounded-sm border border-hairline bg-surface-1 px-3.5 t-body-sm font-medium text-ink-1"
          >
            Goals
            <Icon name="chevron-right" size={18} className="text-ink-3" />
          </Link>
        </div>
      </section>

      {/* SemenProfile. Measured values, kept separate from the score above. */}
      {latestSemen ? (
        <section className="mb-4" aria-labelledby="today-profile">
          <h2 id="today-profile" className="visually-hidden">
            Semen profile
          </h2>
          <SemenProfileBoard test={latestSemen} hormones={hormonePanel} baseline={baselineSemen} />

          {/*
            An entry point rather than the list. The caveats on an association
            list matter too much to have it skimmed between a score and a plan.
          */}
          {contributors.length > 0 ? (
            <Link
              href="/contributors"
              className="mt-3 flex min-h-(--ps-touch-min) items-center justify-between gap-3 rounded-md border border-hairline bg-surface-1 px-4 py-3"
            >
              <span className="min-w-0">
                <span className="block t-title-3 text-ink-1">What&rsquo;s affecting this</span>
                <span className="mt-0.5 block t-caption text-ink-3">
                  {contributors.length} associations from your own inputs
                </span>
              </span>
              <Icon name="chevron-right" size={18} className="shrink-0 text-ink-3" />
            </Link>
          ) : null}

          <div className="mt-3">
            <SpermAgeCard />
          </div>
        </section>
      ) : null}

      {/*
        Connected data. These are the inputs that move the score above, so they
        sit directly beneath it; each tile is a door to its own screen rather
        than an interpretation in itself.
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
            source="Whoop"
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
            source="Your log"
          />
          <MetricTile
            glyph="steps"
            label="Steps"
            value={health ? health.steps.toLocaleString("en-GB") : "—"}
            detail={health ? `${health.activeMinutes} active minutes` : "No data"}
            source="Whoop"
          />
          <MetricTile
            glyph="heart"
            label="Resting heart rate"
            value={health ? String(health.restingHeartRate) : "—"}
            unit="bpm"
            detail={health ? `HRV ${health.heartRateVariability} ms` : "No data"}
            source="Whoop"
          />
        </div>
        <p className="mt-2 t-caption text-ink-3">
          Wearable figures are simulated. Heart-rate variability is a recovery proxy, never a
          hormone measurement.
        </p>
      </section>

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

      {/*
        The questionnaire score, kept and relabelled. It answers a different
        question from the card at the top — a point-in-time assessment from
        what you reported, rather than a rolling view of what you logged — and
        two surfaces both called "readiness" would be unreadable.
      */}
      <section className="mt-6" aria-labelledby="today-readiness">
        <SectionHeader
          id="today-readiness"
          eyebrow="From your onboarding answers"
          title="Questionnaire readiness"
          level={3}
        />
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
