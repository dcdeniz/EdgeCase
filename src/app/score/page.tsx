"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { ContributionGrid, DeltaBadge, ScoreRing, WeeklySparkline } from "@/components/score";
import { DisclaimerFooter, Screen } from "@/components/shell";
import {
  Card,
  MetaBadge,
  SectionHeader,
  Segmented,
  SimulatedBadge,
  StatusChip,
} from "@/components/ui";
import {
  BEHAVIOUR_RULE_VERSION,
  BEHAVIOUR_SCORE_CAVEAT,
  behaviourBandLabel,
  behaviourDay,
  behaviourDomains,
  behaviourGrid,
  behaviourWindow,
  readinessProgress,
  weeklySeries,
  type BehaviourDomainId,
} from "@/lib/behaviour-score";
import { TODAY, formatDate } from "@/lib/format";
import { usePrototype } from "@/lib/store";

type Range = "week" | "year";

/**
 * The behaviour score over a week and over a year.
 *
 * This screen carries the product's one composite figure, and it is defensible
 * only because of what it excludes. It blends four *modifiable behaviours*. It
 * does not touch a clinical marker, a screening output or a confidence term —
 * those keep their own surfaces under /results, where their different epistemic
 * status stays visible. See docs/design/README.md, "Four outputs, never one
 * number": this is the behaviour output, rendered well, not a merger of all of
 * them.
 */
export default function ScorePage() {
  const { state } = usePrototype();
  const [range, setRange] = useState<Range>("week");
  const [selected, setSelected] = useState<string | undefined>();

  const week = useMemo(() => behaviourWindow(state, 7), [state]);
  const year = useMemo(() => behaviourWindow(state, 365), [state]);
  const grid = useMemo(() => behaviourGrid(state), [state]);
  const series = useMemo(() => weeklySeries(state), [state]);
  const progress = useMemo(() => readinessProgress(state), [state]);

  const active = range === "week" ? week : year;
  const selectedDay = selected ? behaviourDay(state, selected) : null;

  return (
    <Screen title="Fertility readiness" eyebrow="Weekly and yearly">
      <Segmented<Range>
        label="Score range"
        value={range}
        onChange={(next) => {
          setRange(next);
          setSelected(undefined);
        }}
        options={[
          { value: "week", label: "This week", glyph: "today" },
          { value: "year", label: "This year", glyph: "grid" },
        ]}
      />

      <Card className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="t-micro text-ink-3">
              {range === "week" ? "Trailing 7 days" : "Trailing 52 weeks"}
            </p>
            <p className="mt-1 t-caption text-ink-2">
              {formatDate(active.from)} — {formatDate(active.to)}
            </p>
          </div>
          <SimulatedBadge compact />
        </div>

        <div className="mt-5 flex justify-center">
          <ScoreRing
            value={active.score}
            label={`Fertility readiness, ${range === "week" ? "trailing seven days" : "trailing year"}`}
            sublabel={behaviourBandLabel(active.score)}
            size={188}
          />
        </div>

        <div className="mt-4 flex flex-col items-center gap-1.5">
          <DeltaBadge delta={progress.delta} size="lg" suffix="since you started" />
          <p className="t-caption text-ink-3">
            Baseline {progress.baseline.score ?? "—"} over the first fortnight logged
          </p>
        </div>

        {/*
          Coverage sits beside the score rather than inside it. Missing data
          lowers this number and never the score itself, which is what keeps a
          fortnight away from the app from reading as a behavioural decline.
        */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-hairline pt-4">
          <div>
            <p className="t-micro text-ink-3">Days with data</p>
            <p className="mt-1 t-title-2 text-ink-1 ps-num">
              {active.scoredDays}
              <span className="t-caption font-normal text-ink-3">/{active.totalDays}</span>
            </p>
          </div>
          <div>
            <p className="t-micro text-ink-3">Coverage</p>
            <p className="mt-1 t-title-2 text-ink-1 ps-num">
              {active.coverage}
              <span className="t-caption font-normal text-ink-3">%</span>
            </p>
          </div>
        </div>
      </Card>

      {range === "year" ? (
        <>
          <section className="mt-6" aria-labelledby="grid">
            <SectionHeader
              id="grid"
              eyebrow="The record"
              title="Every logged day"
              level={2}
            />
            <Card>
              <ContributionGrid cells={grid} onSelect={setSelected} selected={selected} />
            </Card>

            {selectedDay ? (
              <Card className="mt-3" tone="information">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="t-micro text-ink-3">{formatDate(selectedDay.date)}</p>
                    <p className="mt-1 t-title-2 text-ink-1 ps-num">
                      {selectedDay.score == null ? "Nothing logged" : `${selectedDay.score}/100`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(undefined)}
                    className="t-caption text-accent"
                  >
                    Clear
                  </button>
                </div>
                {selectedDay.score != null ? (
                  <ul className="mt-3 space-y-1.5">
                    {(Object.keys(behaviourDomains) as BehaviourDomainId[]).map((id) => (
                      <li key={id} className="flex justify-between t-caption">
                        <span className="text-ink-2">{behaviourDomains[id].label}</span>
                        <span className="t-mono text-ink-1">
                          {selectedDay.domains[id] ?? "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 t-body-sm text-ink-2">
                    No sleep, food or adherence data for this day. It is a gap in the record.
                  </p>
                )}
              </Card>
            ) : null}
          </section>

          <section className="mt-6" aria-labelledby="trend">
            <SectionHeader id="trend" eyebrow="Week by week" title="Trend" level={2} />
            <Card>
              <WeeklySparkline series={series} />
              <p className="mt-2 t-caption text-ink-3">
                Each point is one week&rsquo;s mean. The horizontal line marks 65, where the band
                changes from mixed to mostly consistent.
              </p>
            </Card>
          </section>
        </>
      ) : null}

      <section className="mt-6" aria-labelledby="domains">
        <SectionHeader
          id="domains"
          eyebrow="What went into it"
          title="Four modifiable domains"
          level={2}
        />
        <div className="space-y-3">
          {(Object.keys(behaviourDomains) as BehaviourDomainId[]).map((id) => {
            const domain = behaviourDomains[id];
            const score = active.domains[id];
            const domainProgress = progress.domains.find((row) => row.id === id);
            return (
              <Card key={id}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="t-title-3 text-ink-1">{domain.label}</h3>
                  <span className="flex shrink-0 items-center gap-2">
                    {domainProgress?.isNew ? (
                      <span className="t-caption text-ink-3">New</span>
                    ) : (
                      <DeltaBadge delta={domainProgress?.delta ?? null} size="sm" />
                    )}
                    <span className="t-title-2 text-ink-1 ps-num">
                      {score ?? "—"}
                      <span className="t-caption font-normal text-ink-3">/100</span>
                    </span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  {score != null ? (
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${score}%` }}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="block h-full rounded-full bg-[repeating-linear-gradient(45deg,var(--ps-line-strong)_0_3px,transparent_3px_6px)]"
                    />
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <MetaBadge glyph="results">weight {domain.weight}</MetaBadge>
                  <MetaBadge glyph="simulated">{domain.source}</MetaBadge>
                </div>
                <p className="mt-2.5 t-body-sm text-ink-2">{domain.framing}</p>
                {score == null ? (
                  <p className="mt-2">
                    <StatusChip tone="unavailable" glyph="unavailable">
                      Insufficient data
                    </StatusChip>
                  </p>
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>

      {/* The boundary statement. This is the reason a composite is allowed here at all. */}
      <Card className="mt-6" tone="information">
        <p className="t-body-sm text-ink-2">
          {BEHAVIOUR_SCORE_CAVEAT} Excludes clinical results, screening and confidence.
        </p>
        <Link
          href="/results"
          className="mt-2 inline-flex items-center gap-1 t-body-sm font-medium text-accent"
        >
          Clinical outputs
          <Icon name="chevron-right" size={15} />
        </Link>
      </Card>

      <p className="mt-4 t-mono text-ink-3">
        rules {BEHAVIOUR_RULE_VERSION} · generated {TODAY}
      </p>

      <DisclaimerFooter />
    </Screen>
  );
}
