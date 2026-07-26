"use client";

/**
 * /next — the redesigned Today, built for review against the current /today.
 *
 * Study: docs/design/next-study.md. Direction: hundred.'s one-number cream
 * calm, Substack's editorial serif register, Strava's single confident stat
 * band. Same tokens, same safety architecture — the redesign is scale,
 * placement and deletion, not a new theme.
 *
 * Density contract: every caveat exactly once, machine metadata off the
 * surface, three mono folios per screen, everything else a door.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { announce } from "@/components/ui";
import { PROTOTYPE_DISCLAIMER } from "@/components/shell";
import {
  BEHAVIOUR_SCORE_CAVEAT,
  behaviourBandLabel,
  behaviourDay,
  formatDelta as fmtDelta,
  readinessProgress,
} from "@/lib/behaviour-score";
import { markerCatalogue, referenceContextLabel, referenceContextOf } from "@/lib/clinical";
import { contributorsFor } from "@/lib/contributors";
import { categoryLabel } from "@/lib/fixtures";
import { TODAY, addDays, daysBetween, formatDate, formatMarker, formatWeekday, relativeDays } from "@/lib/format";
import { dietDayFor } from "@/lib/nutrition";
import {
  adherenceKey,
  adherenceWindow,
  itemsForWeek,
  protocolDay,
  protocolWeek,
  usePrototype,
  type AdherenceStatus,
} from "@/lib/store";
import { formatDuration, latestHealthDay, latestSleepNight, sleepNeedPercent } from "@/lib/wearable";

/* ==========================================================================
   Editorial primitives — local to this study
   ========================================================================== */

/**
 * Small mono running head. Used three times on the screen, never more.
 * The gold dash is the splash palette (PR #20) carried inside: identity
 * punctuation only, never a status colour.
 */
function Folio({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="flex items-baseline gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-3">
        <span aria-hidden="true" className="inline-block h-[3px] w-4 self-center rounded-full bg-gold" />
        {children}
      </p>
      {aside}
    </div>
  );
}

/** A door: one row, one destination. The only link treatment on the screen. */
function Door({ href, children, detail }: { href: string; children: React.ReactNode; detail?: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-(--ps-touch-min) items-center gap-3 border-b border-hairline py-3.5 transition-colors duration-(--ps-duration-fast) hover:bg-surface-3/50"
    >
      <span className="min-w-0 flex-1">
        <span className="block t-body-sm font-medium text-ink-1">{children}</span>
        {detail ? <span className="mt-0.5 block t-caption text-ink-3">{detail}</span> : null}
      </span>
      <Icon name="chevron-right" size={16} className="shrink-0 text-ink-3" />
    </Link>
  );
}

function rise(step: number): React.CSSProperties {
  return {
    animation: `ps-rise-in var(--ps-duration-slow) var(--ps-ease-out) ${step * 70}ms both`,
  };
}

/* ==========================================================================
   Screen
   ========================================================================== */

export default function NextTodayPage() {
  const { state, readiness, latestSemen, seedDemo, logAdherence } = usePrototype();
  const protocol = state.protocol;

  /* The study runs on the verified cream theme. Scoped to this route. */
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "light");
    return () => {
      if (previous) root.setAttribute("data-theme", previous);
      else root.removeAttribute("data-theme");
    };
  }, []);

  const progress = useMemo(() => readinessProgress(state), [state]);
  const contributors = useMemo(() => contributorsFor(state), [state]);
  const window14 = useMemo(() => adherenceWindow(state, 14), [state]);
  const strip = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, index) => {
        const date = addDays(TODAY, -(13 - index));
        return { date, score: behaviourDay(state, date).score };
      }),
    [state],
  );

  const night = useMemo(() => latestSleepNight(), []);
  const health = useMemo(() => latestHealthDay(), []);
  const diet = useMemo(() => dietDayFor(TODAY), []);

  const score = progress.current.score;
  const day = protocol ? protocolDay(protocol) : null;
  const week = protocol ? protocolWeek(protocol) : null;
  const dailyItems = protocol ? itemsForWeek(protocol, week!).filter((item) => item.cadence === "daily") : [];
  const weeklyItems = protocol ? itemsForWeek(protocol, week!).filter((item) => item.cadence !== "daily") : [];
  const retestSoon = protocol ? daysBetween(protocol.retestDueOn, TODAY) > -14 : false;

  const headlineMarkers = latestSemen
    ? (["concentration_million_ml", "progressive_motility_pct"] as const)
        .map((code) => latestSemen.markers.find((marker) => marker.code === code))
        .filter((marker): marker is NonNullable<typeof marker> => Boolean(marker))
    : [];

  const [expanded, setExpanded] = useState<string | null>(null);

  const statusOptions: Array<{ value: AdherenceStatus; label: string }> = [
    { value: "completed", label: "Done" },
    { value: "partial", label: "Partly" },
    { value: "skipped", label: "Skipped" },
  ];

  return (
    <div className="min-h-dvh bg-ground text-ink-1">
      {/* Masthead. The one place the prototype label lives. */}
      <header className="border-b border-hairline" style={rise(0)}>
        <div className="mx-auto flex min-h-(--ps-header-height) max-w-(--ps-shell-max) items-center justify-between gap-3 px-5 pad-safe-top">
          <p className="font-serif text-[1.25rem] font-medium italic tracking-[-0.01em] text-ink-1">
            preseed<span className="text-gold">.</span>
          </p>
          <Link
            href="/account/safety"
            className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-3 underline-offset-4 hover:underline"
          >
            Prototype · simulated data
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-(--ps-shell-max) px-5 pb-32">
        {/* Gates outrank everything, including a good score. Unchanged rule. */}
        {readiness.gates.length > 0 ? (
          <section className="mt-6 space-y-4" aria-label="Clinical flags" style={rise(1)}>
            {readiness.gates.map((gate) => (
              <div
                key={gate.id}
                role="group"
                aria-label={gate.title}
                className={`border-l-2 pl-4 ${gate.severity === "escalation" ? "border-l-escalation" : "border-l-attention"}`}
              >
                <h2 className="font-serif text-[1.125rem] font-medium text-ink-1">{gate.title}</h2>
                <p className="mt-1 t-body-sm text-ink-2">{gate.body}</p>
                <p className="mt-1.5 t-body-sm font-medium text-ink-1">{gate.action}</p>
              </div>
            ))}
          </section>
        ) : null}

        {/* ── Hero: the number, alone on cream ─────────────────────────── */}
        <section className="mt-10" aria-label="Seed Score" style={rise(2)}>
          <Folio
            aside={
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-3">
                {formatWeekday(TODAY)} {formatDate(TODAY)}
              </p>
            }
          >
            Seed Score
          </Folio>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-[5.5rem] font-medium leading-none tracking-[-0.04em] text-ink-1">
              {score ?? "—"}
            </span>
            <span className="font-mono text-[0.8125rem] text-ink-3">/100</span>
          </div>

          <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-serif text-[1.1875rem] italic text-ink-1">
              {behaviourBandLabel(score)}
            </span>
            {progress.weekDelta != null ? (
              <span className={`t-body-sm font-medium ${progress.weekDelta >= 0 ? "text-accent" : "text-attention"}`}>
                {fmtDelta(progress.weekDelta)} this week
              </span>
            ) : null}
          </p>

          {/* Fourteen days, four pixels wide each. The consistency card, shrunk. */}
          <div className="mt-6 flex h-10 items-end gap-[3px]" aria-hidden="true">
            {strip.map((dayCell, index) => (
              <span
                key={dayCell.date}
                className={`flex-1 rounded-[2px] ${
                  dayCell.score == null
                    ? "h-[3px] bg-line-strong"
                    : index === strip.length - 1
                      ? "bg-gold"
                      : "bg-accent/55"
                }`}
                style={dayCell.score != null ? { height: `${Math.max(12, dayCell.score)}%` } : undefined}
              />
            ))}
          </div>
          <p className="visually-hidden">
            Daily behaviour score over the last fourteen days.{" "}
            {window14.percent == null ? "Nothing logged yet." : `${window14.percent}% of logged actions completed.`}
          </p>

          <div className="mt-2 flex items-baseline justify-between gap-3">
            <p className="t-caption text-ink-3">
              Last 14 days{window14.percent != null ? ` · ${window14.percent}% of actions logged` : ""}
            </p>
            <Link href="/score" className="t-caption font-medium text-accent">
              How it&rsquo;s scored →
            </Link>
          </div>

          {/* The caveat, once, in the reasoning register. */}
          <p className="mt-4 max-w-[38ch] font-serif text-[0.9375rem] italic leading-snug text-ink-3">
            {BEHAVIOUR_SCORE_CAVEAT}
          </p>
        </section>

        {state.adaptation ? (
          <Link
            href="/protocol"
            className="mt-8 flex min-h-(--ps-touch-min) items-center gap-3 border-l-2 border-l-information bg-information-quiet py-3 pl-4 pr-3"
            style={rise(3)}
          >
            <span className="min-w-0 flex-1">
              <span className="block t-body-sm font-medium text-ink-1">
                A change to your plan is waiting for review
              </span>
              <span className="mt-0.5 block t-caption text-ink-3">
                Nothing changes until you accept it
              </span>
            </span>
            <Icon name="chevron-right" size={16} className="shrink-0 text-ink-3" />
          </Link>
        ) : null}

        {/* ── Actions: tap to log, detail one tap away ─────────────────── */}
        <section className="mt-12" aria-label="Today's actions" style={rise(4)}>
          <Folio
            aside={
              protocol ? (
                <Link href="/protocol" className="t-caption font-medium text-accent">
                  Full plan →
                </Link>
              ) : undefined
            }
          >
            {protocol ? `Today · day ${day} of ${protocol.days}` : "Protocol"}
          </Folio>

          {!protocol ? (
            <div className="mt-5">
              <p className="font-serif text-[1.375rem] font-medium text-ink-1">No protocol yet.</p>
              <p className="mt-2 max-w-[44ch] t-body-sm text-ink-2">
                A dated protocol is built from a measured result, so the plan responds to something
                real rather than to a questionnaire alone.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/tests/new"
                  className="inline-flex min-h-(--ps-touch-min) items-center gap-2 rounded-sm bg-accent px-4 t-body-sm font-medium text-accent-ink"
                >
                  <Icon name="plus" size={16} />
                  Add a clinical result
                </Link>
                <button
                  type="button"
                  onClick={() => seedDemo("baseline")}
                  className="inline-flex min-h-(--ps-touch-min) items-center rounded-sm px-3 t-body-sm font-medium text-accent hover:bg-accent-quiet"
                >
                  Load the demo baseline
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <ul className="m-0 list-none p-0">
                {dailyItems.map((item) => {
                  const current = state.adherence[adherenceKey(item.id, TODAY)];
                  const done = current === "completed";
                  const open = expanded === item.id;
                  return (
                    <li key={item.id} className="border-b border-hairline">
                      <div className="flex items-center gap-3.5 py-3.5">
                        <button
                          type="button"
                          aria-pressed={done}
                          aria-label={`Mark ${item.title} done`}
                          onClick={() => {
                            logAdherence(item.id, TODAY, "completed");
                            announce(`${item.title} marked done`);
                          }}
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-(--ps-duration-fast) ${
                            done
                              ? "border-accent bg-accent text-accent-ink"
                              : "border-line-control text-transparent hover:bg-surface-3"
                          }`}
                        >
                          <Icon name="check" size={15} />
                        </button>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setExpanded(open ? null : item.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <span className="min-w-0 flex-1">
                            <span className={`block t-body font-medium ${done ? "text-ink-3" : "text-ink-1"}`}>
                              {item.title}
                            </span>
                            <span className="mt-0.5 block t-caption text-ink-3">
                              {categoryLabel[item.category]}
                              {current === "partial" ? " · logged partly" : current === "skipped" ? " · skipped" : ""}
                            </span>
                          </span>
                          <Icon
                            name="chevron-down"
                            size={16}
                            className={`shrink-0 text-ink-3 transition-transform duration-(--ps-duration-base) ${open ? "rotate-180" : ""}`}
                          />
                        </button>
                      </div>

                      {open ? (
                        <div className="pb-4 pl-[2.9375rem]">
                          <p className="t-body-sm text-ink-2">{item.description}</p>
                          <div role="group" aria-label={`Log ${item.title}`} className="mt-3 flex gap-2">
                            {statusOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                aria-pressed={current === option.value}
                                onClick={() => {
                                  logAdherence(item.id, TODAY, option.value);
                                  announce(`${item.title} marked ${option.label.toLowerCase()}`);
                                }}
                                className={`rounded-full border px-3.5 py-1.5 t-caption font-medium transition-colors duration-(--ps-duration-fast) ${
                                  current === option.value
                                    ? "border-accent bg-accent text-accent-ink"
                                    : "border-line-control text-ink-2 hover:bg-surface-3"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                            {item.reasoningId ? (
                              <Link
                                href={`/results/reasoning/${item.reasoningId}`}
                                className="t-caption font-medium text-accent"
                              >
                                Why this is in my plan →
                              </Link>
                            ) : null}
                            {item.evidenceStatus === "general_guidance" ? (
                              <span className="t-caption text-ink-3">General guidance, not evidence-cited</span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              <Door href="/protocol" detail={`Week ${week} of the plan`}>
                This week · {weeklyItems.length} weekly {weeklyItems.length === 1 ? "action" : "actions"}
              </Door>
              <Door href="/protocol/check-in" detail="Your answers propose changes — they never apply themselves">
                Weekly check-in · two minutes
              </Door>
              {retestSoon ? (
                <Door href="/tests/new" detail="Matching collection conditions is what makes results comparable">
                  Closing analysis due {relativeDays(protocol.retestDueOn)}
                </Door>
              ) : null}
            </div>
          )}
        </section>

        {/* ── Body data: one band, one provenance line ─────────────────── */}
        <section className="mt-12" aria-label="Body data" style={rise(5)}>
          <Folio>Body</Folio>
          <div className="mt-3 grid grid-cols-4 divide-x divide-hairline border-y border-hairline">
            {[
              {
                label: "Sleep",
                value: night ? formatDuration(night.asleepMinutes) : "—",
                detail: night ? `${sleepNeedPercent(night)}% of need` : "No night",
                href: "/sleep",
              },
              {
                label: "Diet",
                value: diet.score == null ? "—" : String(diet.score),
                detail: diet.entries.length === 0 ? "Not logged" : `${diet.entries.length} ${diet.entries.length === 1 ? "meal" : "meals"}`,
                href: "/food",
              },
              {
                label: "Steps",
                value: health ? health.steps.toLocaleString("en-GB") : "—",
                detail: health ? `${health.activeMinutes} active min` : "No data",
              },
              {
                label: "Rest HR",
                value: health ? String(health.restingHeartRate) : "—",
                detail: health ? `HRV ${health.heartRateVariability} ms` : "No data",
              },
            ].map((stat) => {
              const body = (
                <>
                  <span className="block font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-3">
                    {stat.label}
                  </span>
                  <span className="mt-1 block truncate font-mono text-[1.0625rem] font-medium tracking-[-0.01em] text-ink-1">
                    {stat.value}
                  </span>
                  <span className="mt-0.5 block truncate t-caption text-ink-3">{stat.detail}</span>
                </>
              );
              return stat.href ? (
                <Link key={stat.label} href={stat.href} className="px-2.5 py-3 transition-colors duration-(--ps-duration-fast) hover:bg-surface-3/50">
                  {body}
                </Link>
              ) : (
                <div key={stat.label} className="px-2.5 py-3">
                  {body}
                </div>
              );
            })}
          </div>
          <p className="mt-2 t-caption text-ink-3">Whoop and your log · simulated wearable data</p>
        </section>

        {/* ── Latest analysis: a teaser and two doors ──────────────────── */}
        {latestSemen ? (
          <section className="mt-12" aria-label="Latest analysis" style={rise(6)}>
            <Folio
              aside={
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-3">
                  {formatDate(latestSemen.collectedAt)}
                </p>
              }
            >
              Latest analysis
            </Folio>

            <ul className="m-0 mt-2 list-none p-0">
              {headlineMarkers.map((marker) => {
                const definition = markerCatalogue[marker.code];
                return (
                  <li
                    key={marker.code}
                    className="flex items-baseline justify-between gap-3 border-b border-hairline py-3"
                  >
                    <span className="min-w-0">
                      <span className="block t-body-sm text-ink-1">{definition.label}</span>
                      <span className="mt-0.5 block t-caption text-ink-3">
                        {referenceContextLabel[referenceContextOf(marker)]}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[1.0625rem] font-medium text-ink-1">
                      {formatMarker(marker)} <span className="text-[0.75rem] font-normal text-ink-3">{definition.unit}</span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <Door href="/results" detail={latestSemen.source === "simulated" ? "Simulated result" : undefined}>
              Open results
            </Door>
            {contributors.length > 0 ? (
              <Door href="/contributors" detail="Associations from your own inputs, with their limits">
                What&rsquo;s affecting this · {contributors.length}
              </Door>
            ) : null}
          </section>
        ) : null}

        {/* One disclaimer, once. */}
        <footer className="mt-14 border-t border-hairline pt-4" style={rise(7)}>
          <p className="t-caption text-ink-3">
            {PROTOTYPE_DISCLAIMER}{" "}
            <Link href="/account/safety" className="text-accent underline underline-offset-2">
              Safety centre
            </Link>
          </p>
          <p className="mt-3 t-caption text-ink-3">
            Design study ·{" "}
            <Link href="/today" className="text-accent underline underline-offset-2">
              compare with the current Today
            </Link>
          </p>
        </footer>
      </main>

      {/* Slimmed chrome: same five destinations, quieter frame. */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-ground/95 backdrop-blur-md pad-safe-bottom"
      >
        <ul className="mx-auto flex max-w-(--ps-shell-max) items-stretch">
          {(
            [
              { href: "/next", label: "Today", glyph: "today", active: true },
              { href: "/results", label: "Results", glyph: "results", active: false },
              { href: "/protocol", label: "Protocol", glyph: "protocol", active: false },
              { href: "/ask", label: "Ask", glyph: "coach", active: false },
              { href: "/account", label: "Account", glyph: "account", active: false },
            ] as const
          ).map((destination) => (
            <li key={destination.href} className="flex-1">
              <Link
                href={destination.href}
                aria-current={destination.active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition-colors duration-(--ps-duration-fast) ${
                  destination.active ? "text-ink-1" : "text-ink-3 hover:text-ink-2"
                }`}
              >
                <Icon name={destination.glyph} size={20} />
                <span className="font-mono text-[0.5625rem] uppercase tracking-[0.1em]">
                  {destination.label}
                </span>
                {destination.active ? (
                  <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-gold" />
                ) : (
                  <span aria-hidden="true" className="h-0.5 w-4" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
