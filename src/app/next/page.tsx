"use client";

/**
 * /next — the redesigned Today, in the bible's language.
 *
 * Bible: docs/design/DESIGN.md (Jeton — editorial fintech on warm marble),
 * and jeton.com itself: the page is a magazine spread. Massive tight-set
 * editorial statements carry the structure; orange is punctuation, not
 * decoration; steps are numbered 01/02/03; feature cards wear pastel washes;
 * sections breathe across 80px of white. One typeface, weights 400/450/500.
 *
 * Density contract (docs/design/next-study.md): one question per screen,
 * every caveat exactly once, machine metadata off the surface, everything
 * else a door.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
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
   Bible primitives
   ========================================================================== */

/** The orange full stop. Jeton's headlines end in brand punctuation. */
function Dot() {
  return <span className="text-signal-orange">.</span>;
}

/**
 * An editorial statement. On jeton.com the headline IS the section — 44px+,
 * line-height at or under 1.05, weight 500 never more. Size is the hierarchy.
 */
function Statement({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div>
      <h2 className="max-w-[12ch] text-heading font-medium leading-[1.02] text-ink-roast">{children}</h2>
      {sub ? <p className="mt-4 max-w-[38ch] text-body-sm text-ink-roast">{sub}</p> : null}
    </div>
  );
}

/** Ghost text link — inline navigation. Orange, arrow, no box. */
function Ghost({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-(--ps-touch-min) items-center gap-1.5 rounded-links py-2 text-body-sm font-[450] tracking-[0.03em] text-signal-orange"
    >
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

function rise(step: number): React.CSSProperties {
  return {
    animation: `ps-rise-in var(--ps-duration-slow) var(--ps-ease-out) ${step * 80}ms both`,
  };
}

/* ==========================================================================
   Screen
   ========================================================================== */

export default function NextTodayPage() {
  const { state, readiness, latestSemen, seedDemo, logAdherence } = usePrototype();
  const protocol = state.protocol;

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

  /* Category-coded body data — the only place secondary accents may appear. */
  const stats: Array<{
    label: string;
    value: string;
    detail: string;
    glyph: IconName;
    accent: string;
    wash: string;
    href?: string;
  }> = [
    {
      label: "Sleep",
      value: night ? formatDuration(night.asleepMinutes) : "—",
      detail: night ? `${sleepNeedPercent(night)}% of need` : "No night recorded",
      glyph: "moon",
      accent: "text-cobalt-blue",
      wash: "bg-cobalt-blue/5",
      href: "/sleep",
    },
    {
      label: "Diet",
      value: diet.score == null ? "—" : String(diet.score),
      detail: diet.entries.length === 0 ? "Nothing logged" : `${diet.entries.length} ${diet.entries.length === 1 ? "meal" : "meals"}`,
      glyph: "food",
      accent: "text-emerald-green",
      wash: "bg-emerald-green/5",
      href: "/food",
    },
    {
      label: "Steps",
      value: health?.steps == null ? "—" : health.steps.toLocaleString("en-GB"),
      detail: health?.activeMinutes == null ? "No data" : `${health.activeMinutes} active minutes`,
      glyph: "steps",
      accent: "text-coral-red",
      wash: "bg-coral-red/5",
    },
    {
      label: "Rest HR",
      value: health?.restingHeartRate == null ? "—" : String(health.restingHeartRate),
      detail: health?.heartRateVariability == null ? "No data" : `HRV ${health.heartRateVariability} ms`,
      glyph: "heart",
      accent: "text-signal-orange",
      wash: "bg-category-tint",
    },
  ];

  return (
    <div className="min-h-dvh bg-paper-white font-sequel-sans text-ink-roast [font-variant-numeric:tabular-nums]">
      {/* Nav: wordmark left, one outlined pill right. Jeton keeps it weightless. */}
      <header className="bg-paper-white/80 backdrop-blur-md" style={rise(0)}>
        <div className="mx-auto flex min-h-16 max-w-(--ps-shell-max) items-center justify-between gap-3 px-6 pad-safe-top">
          <p className="text-body font-medium tracking-[0.01em] text-ink-roast">
            PreSeed<Dot />
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-(--ps-shell-max) px-6 pb-44">
        {/* Gates outrank everything, including a good score. Unchanged rule. */}
        {readiness.gates.length > 0 ? (
          <section className="mt-6 space-y-3" aria-label="Clinical flags" style={rise(1)}>
            {readiness.gates.map((gate) => (
              <div key={gate.id} role="group" aria-label={gate.title} className="rounded-cards bg-linen-blush p-6">
                <h2 className="text-subheading font-medium leading-[1.1] text-signal-orange">{gate.title}</h2>
                <p className="mt-2 text-body-sm text-ink-roast">{gate.body}</p>
                <p className="mt-2 text-body-sm font-medium text-ink-roast">{gate.action}</p>
              </div>
            ))}
          </section>
        ) : null}

        {/* ── Hero. The score is the headline of the magazine. ──────────── */}
        <section className="mt-14" aria-label="Seed Score" style={rise(2)}>
          <p className="text-caption font-[450] tracking-[0.03em] text-carbon-black">
            {formatWeekday(TODAY)} {formatDate(TODAY)} — Seed Score
          </p>

          <div className="mt-4 flex items-baseline">
            <span className="text-[9.75rem] font-medium leading-[0.9] tracking-[0.01em] text-ink-roast">
              {score ?? "—"}
            </span>
            <span className="text-heading-sm font-normal text-ash-grey">/100</span>
          </div>

          {/* The band word is the sentence. 44px, tight, orange full stop. */}
          <h1 className="mt-6 max-w-[10ch] text-heading font-medium leading-[1.02] text-ink-roast">
            {behaviourBandLabel(score)}
            <Dot />
          </h1>
          {progress.weekDelta != null ? (
            <p className="mt-3 text-subheading font-medium text-signal-orange">
              {fmtDelta(progress.weekDelta)} this week
            </p>
          ) : null}

          {/* Fourteen days in the brand voice. Height is the value; today is solid. */}
          <div className="mt-10 flex h-14 items-end gap-1.5" aria-hidden="true">
            {strip.map((dayCell, index) => (
              <span
                key={dayCell.date}
                className={`flex-1 rounded-[4px] ${
                  dayCell.score == null
                    ? "h-1 bg-sand-wash"
                    : index === strip.length - 1
                      ? "bg-signal-orange"
                      : "bg-signal-orange/20"
                }`}
                style={dayCell.score != null ? { height: `${Math.max(12, dayCell.score)}%` } : undefined}
              />
            ))}
          </div>
          <p className="visually-hidden">
            Daily behaviour score over the last fourteen days.{" "}
            {window14.percent == null ? "Nothing logged yet." : `${window14.percent}% of logged actions completed.`}
          </p>

          <div className="mt-3 flex items-baseline justify-between gap-3">
            <p className="text-caption text-carbon-black">
              Last 14 days{window14.percent != null ? ` · ${window14.percent}% logged` : ""}
            </p>
            <Ghost href="/score">How it&rsquo;s scored</Ghost>
          </div>

          {/* The caveat, once. */}
          <p className="mt-2 max-w-[40ch] text-caption text-carbon-black">{BEHAVIOUR_SCORE_CAVEAT}</p>
        </section>

        {state.adaptation ? (
          <Link
            href="/protocol"
            className="mt-16 flex items-center gap-4 rounded-cards bg-citrus-wash p-6"
            style={rise(3)}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-subheading font-medium leading-[1.1] text-ink-roast">
                A plan change awaits your review
                <Dot />
              </span>
              <span className="mt-1.5 block text-caption text-carbon-black">
                Nothing changes until you accept it
              </span>
            </span>
            <span aria-hidden="true" className="text-subheading font-[450] text-signal-orange">
              →
            </span>
          </Link>
        ) : null}

        {/* ── Actions. Numbered like Jeton's scroll indicator: 01, 02, 03. ── */}
        <section className="mt-20" aria-label="Today's actions" style={rise(4)}>
          {!protocol ? (
            <>
              <Statement sub="A dated protocol is built from a measured result, so the plan responds to something real rather than to a questionnaire alone.">
                No protocol yet
                <Dot />
              </Statement>
              <div className="mt-7 flex flex-wrap items-center gap-5">
                <Link
                  href="/tests/new"
                  className="inline-flex min-h-(--ps-touch-min) items-center rounded-buttons bg-signal-orange px-5 py-2 text-body-sm font-[450] tracking-[0.03em] text-paper-white"
                >
                  Add a clinical result
                </Link>
                <button
                  type="button"
                  onClick={() => seedDemo("baseline")}
                  className="inline-flex min-h-(--ps-touch-min) items-center text-body-sm font-[450] tracking-[0.03em] text-signal-orange"
                >
                  Load the demo baseline →
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-end justify-between gap-4">
                <Statement>
                  Do {dailyItems.length === 3 ? "three" : dailyItems.length} things today
                  <Dot />
                </Statement>
                <p className="shrink-0 pb-1 text-caption font-[450] tracking-[0.03em] text-carbon-black">
                  Day {day} / {protocol.days}
                </p>
              </div>

              <ol className="m-0 mt-10 list-none p-0">
                {dailyItems.map((item, index) => {
                  const current = state.adherence[adherenceKey(item.id, TODAY)];
                  const done = current === "completed";
                  const open = expanded === item.id;
                  return (
                    <li key={item.id} className="border-t border-sand-wash last:border-b">
                      <div className="flex items-center gap-5 py-6">
                        {/* The step number, in the brand voice. */}
                        <span
                          aria-hidden="true"
                          className={`text-subheading font-[450] ${done ? "text-ash-grey" : "text-signal-orange"}`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setExpanded(open ? null : item.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-subheading font-medium leading-[1.15] ${done ? "text-ash-grey" : "text-ink-roast"}`}
                            >
                              {item.title}
                            </span>
                            <span className="mt-1 block text-caption text-carbon-black/60">
                              {categoryLabel[item.category]}
                              {current === "partial" ? " · logged partly" : current === "skipped" ? " · skipped" : ""}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-pressed={done}
                          aria-label={`Mark ${item.title} done`}
                          onClick={() => {
                            logAdherence(item.id, TODAY, "completed");
                            announce(`${item.title} marked done`);
                          }}
                          className={`flex size-10 shrink-0 items-center justify-center rounded-pills border transition-colors duration-(--ps-duration-fast) ${
                            done
                              ? "border-signal-orange bg-signal-orange text-paper-white"
                              : "border-sand-wash text-transparent hover:border-ash-grey"
                          }`}
                        >
                          <Icon name="check" size={17} />
                        </button>
                      </div>

                      {open ? (
                        <div className="pb-7 pl-[3.25rem]">
                          <p className="max-w-[40ch] text-body-sm text-ink-roast">{item.description}</p>
                          <div role="group" aria-label={`Log ${item.title}`} className="mt-5 flex gap-2">
                            {statusOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                aria-pressed={current === option.value}
                                onClick={() => {
                                  logAdherence(item.id, TODAY, option.value);
                                  announce(`${item.title} marked ${option.label.toLowerCase()}`);
                                }}
                                className={`rounded-pills border px-4 py-1.5 text-caption font-[450] tracking-[0.03em] transition-colors duration-(--ps-duration-fast) ${
                                  current === option.value
                                    ? "border-signal-orange bg-signal-orange text-paper-white"
                                    : "border-sand-wash text-ink-roast hover:border-ash-grey"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-x-5">
                            {item.reasoningId ? (
                              <Ghost href={`/results/reasoning/${item.reasoningId}`}>Why this is in my plan</Ghost>
                            ) : null}
                            {item.evidenceStatus === "general_guidance" ? (
                              <span className="text-caption text-carbon-black/60">General guidance, not evidence-cited</span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ol>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-1">
                <Link
                  href="/protocol/check-in"
                  className="inline-flex min-h-(--ps-touch-min) items-center rounded-buttons bg-signal-orange px-5 py-2 text-body-sm font-[450] tracking-[0.03em] text-paper-white"
                >
                  Start the weekly check-in
                </Link>
                <Ghost href="/protocol">
                  {weeklyItems.length} weekly {weeklyItems.length === 1 ? "action" : "actions"}
                </Ghost>
                {retestSoon ? (
                  <Ghost href="/tests/new">Closing analysis {relativeDays(protocol.retestDueOn)}</Ghost>
                ) : null}
              </div>
            </>
          )}
        </section>

        {/* ── Body. Feature category cards — pastel washes, big numerals. ── */}
        <section className="mt-20" aria-label="Body data" style={rise(5)}>
          <Statement>
            Your body, today
            <Dot />
          </Statement>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {stats.map((stat) => {
              const body = (
                <>
                  <Icon name={stat.glyph} size={26} className={stat.accent} />
                  <span className="mt-6 block truncate text-heading-sm font-medium leading-[1.05] text-ink-roast">
                    {stat.value}
                  </span>
                  <span className="mt-1.5 block text-body-sm font-[450] text-ink-roast">{stat.label}</span>
                  <span className="mt-0.5 block truncate text-caption text-carbon-black/60">{stat.detail}</span>
                </>
              );
              return stat.href ? (
                <Link key={stat.label} href={stat.href} className={`rounded-cards p-6 ${stat.wash}`}>
                  {body}
                </Link>
              ) : (
                <div key={stat.label} className={`rounded-cards p-6 ${stat.wash}`}>
                  {body}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-caption text-carbon-black">Whoop and your log</p>
        </section>

        {/* ── Latest analysis. One warm card, values as the headline. ────── */}
        {latestSemen ? (
          <section className="mt-20" aria-label="Latest analysis" style={rise(6)}>
            <div className="flex items-end justify-between gap-4">
              <Statement>
                The last measurement
                <Dot />
              </Statement>
              <p className="shrink-0 pb-1 text-caption font-[450] tracking-[0.03em] text-carbon-black">
                {formatDate(latestSemen.collectedAt)}
              </p>
            </div>

            <div className="mt-8 rounded-cards bg-linen-blush p-6">
              <ul className="m-0 list-none divide-y divide-ink-roast/10 p-0">
                {headlineMarkers.map((marker) => {
                  const definition = markerCatalogue[marker.code];
                  return (
                    <li key={marker.code} className="py-5 first:pt-0 last:pb-0">
                      <span className="block text-heading-sm font-medium leading-[1.05] text-ink-roast">
                        {formatMarker(marker)}
                        <span className="ml-2 text-body-sm font-normal text-carbon-black/60">{definition.unit}</span>
                      </span>
                      <span className="mt-1.5 block text-body-sm font-[450] text-ink-roast">{definition.label}</span>
                      <span className="mt-0.5 block text-caption text-carbon-black/60">
                        {referenceContextLabel[referenceContextOf(marker)]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-6">
              <Ghost href="/results">Open results</Ghost>
              {contributors.length > 0 ? (
                <Ghost href="/contributors">What&rsquo;s affecting this · {contributors.length}</Ghost>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* One disclaimer, once. */}
        <footer className="mt-24 border-t border-sand-wash pt-6" style={rise(7)}>
          <p className="text-caption text-carbon-black">
            {PROTOTYPE_DISCLAIMER}{" "}
            <Link href="/account/safety" className="font-[450] text-signal-orange">
              Safety centre →
            </Link>
          </p>
        </footer>
      </main>

      {/* Floating pill navigation — 84px radius, orange glass lift. */}
      <nav aria-label="Primary" className="fixed inset-x-4 bottom-4 z-30 pad-safe-bottom">
        <ul className="mx-auto flex max-w-[24rem] items-stretch rounded-nav bg-paper-white/90 px-2 py-1 shadow-lg backdrop-blur-xl">
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
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-pills px-1 transition-colors duration-(--ps-duration-fast) ${
                  destination.active ? "text-signal-orange" : "text-carbon-black hover:text-ink-roast"
                }`}
              >
                <Icon name={destination.glyph} size={20} />
                <span className="text-[10px] font-[450] tracking-[0.03em]">{destination.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
