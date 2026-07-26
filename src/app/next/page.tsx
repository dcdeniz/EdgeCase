"use client";

/**
 * /next — the redesigned Today, in the bible's language.
 *
 * Bible: docs/design/DESIGN.md (Jeton — editorial fintech on warm marble).
 * White canvas, one chromatic voice (#f73b20), warm near-black ink (#360802),
 * a sole geometric grotesque at weights 400/450/500, oversized tight-set
 * numerals, 16px cards lifted by the inverted shadow, category accents only
 * on category-coded cards. No serif. No mono. No bold.
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

/** Ghost text link — the bible's inline navigation. Orange, arrow, no box. */
function Ghost({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-(--ps-touch-min) items-center gap-1.5 rounded-links py-2 text-body-sm font-[450] text-signal-orange"
    >
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

/** Section heading — editorial, size carries the hierarchy, never weight. */
function SectionHead({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-heading-sm font-medium text-ink-roast">{children}</h2>
      {aside}
    </div>
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

  /* Category-coded body data, per the bible: accent colours live here only. */
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
      value: health ? health.steps.toLocaleString("en-GB") : "—",
      detail: health ? `${health.activeMinutes} active minutes` : "No data",
      glyph: "steps",
      accent: "text-coral-red",
      wash: "bg-coral-red/5",
    },
    {
      label: "Rest HR",
      value: health ? String(health.restingHeartRate) : "—",
      detail: health ? `HRV ${health.heartRateVariability} ms` : "No data",
      glyph: "heart",
      accent: "text-signal-orange",
      wash: "bg-category-tint",
    },
  ];

  return (
    <div className="min-h-dvh bg-paper-white font-sequel-sans text-ink-roast [font-variant-numeric:tabular-nums]">
      {/* Top bar: logo left, one quiet pill right. */}
      <header className="bg-paper-white/80 backdrop-blur-md" style={rise(0)}>
        <div className="mx-auto flex min-h-16 max-w-(--ps-shell-max) items-center justify-between gap-3 px-5 pad-safe-top">
          <p className="text-body font-medium text-ink-roast">PreSeed</p>
          <Link
            href="/account/safety"
            className="rounded-pills border border-sand-wash px-3 py-1.5 text-caption font-[450] text-carbon-black"
          >
            Prototype · simulated
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-(--ps-shell-max) px-5 pb-40">
        {/* Gates outrank everything, including a good score. Unchanged rule. */}
        {readiness.gates.length > 0 ? (
          <section className="mt-4 space-y-3" aria-label="Clinical flags" style={rise(1)}>
            {readiness.gates.map((gate) => (
              <div key={gate.id} role="group" aria-label={gate.title} className="rounded-cards bg-linen-blush p-5">
                <h2 className="text-subheading font-medium text-signal-orange">{gate.title}</h2>
                <p className="mt-1.5 text-body-sm text-ink-roast">{gate.body}</p>
                <p className="mt-2 text-body-sm font-medium text-ink-roast">{gate.action}</p>
              </div>
            ))}
          </section>
        ) : null}

        {/* ── Hero: the number, oversized and tight-set ─────────────────── */}
        <section className="mt-10" aria-label="Seed Score" style={rise(2)}>
          <p className="text-caption font-[450] text-carbon-black">
            Seed Score · {formatWeekday(TODAY)} {formatDate(TODAY)}
          </p>

          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-display font-medium text-ink-roast">{score ?? "—"}</span>
            <span className="text-subheading font-normal text-ink-roast">/100</span>
          </div>

          <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-subheading font-medium text-ink-roast">{behaviourBandLabel(score)}</span>
            {progress.weekDelta != null ? (
              <span className="text-body-sm font-[450] text-signal-orange">
                {fmtDelta(progress.weekDelta)} this week
              </span>
            ) : null}
          </p>

          {/* Fourteen days in the brand voice. Height is the value; today is solid. */}
          <div className="mt-8 flex h-12 items-end gap-1" aria-hidden="true">
            {strip.map((dayCell, index) => (
              <span
                key={dayCell.date}
                className={`flex-1 rounded-[3px] ${
                  dayCell.score == null
                    ? "h-1 bg-sand-wash"
                    : index === strip.length - 1
                      ? "bg-signal-orange"
                      : "bg-signal-orange/25"
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
            <p className="text-caption text-carbon-black">
              Last 14 days{window14.percent != null ? ` · ${window14.percent}% of actions logged` : ""}
            </p>
            <Ghost href="/score">How it&rsquo;s scored</Ghost>
          </div>

          {/* The caveat, once. */}
          <p className="mt-3 max-w-[40ch] text-caption text-carbon-black">{BEHAVIOUR_SCORE_CAVEAT}</p>
        </section>

        {state.adaptation ? (
          <Link
            href="/protocol"
            className="mt-10 flex items-center gap-3 rounded-cards bg-category-tint p-5"
            style={rise(3)}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-body font-medium text-ink-roast">
                A change to your plan is waiting for review
              </span>
              <span className="mt-0.5 block text-caption text-carbon-black">
                Nothing changes until you accept it
              </span>
            </span>
            <span aria-hidden="true" className="text-body-sm font-[450] text-signal-orange">
              →
            </span>
          </Link>
        ) : null}

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <section className="mt-14" aria-label="Today's actions" style={rise(4)}>
          <SectionHead aside={protocol ? <Ghost href="/protocol">Full plan</Ghost> : undefined}>
            {protocol ? `Day ${day}` : "Protocol"}
          </SectionHead>
          {protocol ? (
            <p className="mt-1 text-body-sm text-ink-roast">
              of {protocol.days} · week {week}
            </p>
          ) : null}

          {!protocol ? (
            <div className="mt-5">
              <p className="text-heading font-medium text-ink-roast">No protocol yet.</p>
              <p className="mt-3 max-w-[44ch] text-body-sm text-ink-roast">
                A dated protocol is built from a measured result, so the plan responds to something
                real rather than to a questionnaire alone.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Link
                  href="/tests/new"
                  className="inline-flex min-h-(--ps-touch-min) items-center gap-2 rounded-buttons bg-signal-orange px-4 py-2 text-body-sm font-[450] tracking-[0.03em] text-paper-white"
                >
                  Add a clinical result
                </Link>
                <button
                  type="button"
                  onClick={() => seedDemo("baseline")}
                  className="inline-flex min-h-(--ps-touch-min) items-center rounded-links text-body-sm font-[450] text-signal-orange"
                >
                  Load the demo baseline →
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              {/* The bible's content card: white, 16px radius, lifted from below. */}
              <div className="rounded-cards bg-paper-white px-5 shadow-md">
                <ul className="m-0 list-none divide-y divide-sand-wash p-0">
                  {dailyItems.map((item) => {
                    const current = state.adherence[adherenceKey(item.id, TODAY)];
                    const done = current === "completed";
                    const open = expanded === item.id;
                    return (
                      <li key={item.id}>
                        <div className="flex items-center gap-4 py-4">
                          <button
                            type="button"
                            aria-pressed={done}
                            aria-label={`Mark ${item.title} done`}
                            onClick={() => {
                              logAdherence(item.id, TODAY, "completed");
                              announce(`${item.title} marked done`);
                            }}
                            className={`flex size-8 shrink-0 items-center justify-center rounded-pills border transition-colors duration-(--ps-duration-fast) ${
                              done
                                ? "border-signal-orange bg-signal-orange text-paper-white"
                                : "border-sand-wash text-transparent hover:border-ash-grey"
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
                              <span className={`block text-body font-medium ${done ? "text-ash-grey" : "text-ink-roast"}`}>
                                {item.title}
                              </span>
                              <span className="mt-0.5 block text-caption text-carbon-black/60">
                                {categoryLabel[item.category]}
                                {current === "partial" ? " · logged partly" : current === "skipped" ? " · skipped" : ""}
                              </span>
                            </span>
                            <Icon
                              name="chevron-down"
                              size={16}
                              className={`shrink-0 text-ash-grey transition-transform duration-(--ps-duration-base) ${open ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>

                        {open ? (
                          <div className="pb-5 pl-12">
                            <p className="text-body-sm text-ink-roast">{item.description}</p>
                            <div role="group" aria-label={`Log ${item.title}`} className="mt-4 flex gap-2">
                              {statusOptions.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  aria-pressed={current === option.value}
                                  onClick={() => {
                                    logAdherence(item.id, TODAY, option.value);
                                    announce(`${item.title} marked ${option.label.toLowerCase()}`);
                                  }}
                                  className={`rounded-pills border px-4 py-1.5 text-caption font-[450] transition-colors duration-(--ps-duration-fast) ${
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
                </ul>
              </div>

              <div className="mt-4 flex flex-col items-start">
                <Ghost href="/protocol">
                  This week · {weeklyItems.length} weekly {weeklyItems.length === 1 ? "action" : "actions"}
                </Ghost>
                <Ghost href="/protocol/check-in">Weekly check-in · two minutes</Ghost>
                {retestSoon ? (
                  <Ghost href="/tests/new">Closing analysis due {relativeDays(protocol.retestDueOn)}</Ghost>
                ) : null}
              </div>
            </div>
          )}
        </section>

        {/* ── Body: category-coded cards, the only place accents live ───── */}
        <section className="mt-14" aria-label="Body data" style={rise(5)}>
          <SectionHead>Body</SectionHead>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {stats.map((stat) => {
              const body = (
                <>
                  <span className="flex items-center gap-2">
                    <Icon name={stat.glyph} size={18} className={stat.accent} />
                    <span className="text-body-sm font-[450] text-ink-roast">{stat.label}</span>
                  </span>
                  <span className="mt-3 block truncate text-heading-sm font-medium text-ink-roast">
                    {stat.value}
                  </span>
                  <span className="mt-1 block truncate text-caption text-carbon-black/60">{stat.detail}</span>
                </>
              );
              return stat.href ? (
                <Link key={stat.label} href={stat.href} className={`rounded-cards p-5 ${stat.wash}`}>
                  {body}
                </Link>
              ) : (
                <div key={stat.label} className={`rounded-cards p-5 ${stat.wash}`}>
                  {body}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-caption text-carbon-black">Whoop and your log · simulated wearable data</p>
        </section>

        {/* ── Latest analysis: one card, two doors ──────────────────────── */}
        {latestSemen ? (
          <section className="mt-14" aria-label="Latest analysis" style={rise(6)}>
            <SectionHead
              aside={
                <p className="text-caption text-carbon-black">{formatDate(latestSemen.collectedAt)}</p>
              }
            >
              Latest analysis
            </SectionHead>

            <div className="mt-5 rounded-cards bg-paper-white px-5 shadow-md">
              <ul className="m-0 list-none divide-y divide-sand-wash p-0">
                {headlineMarkers.map((marker) => {
                  const definition = markerCatalogue[marker.code];
                  return (
                    <li key={marker.code} className="flex items-baseline justify-between gap-4 py-4">
                      <span className="min-w-0">
                        <span className="block text-body-sm text-ink-roast">{definition.label}</span>
                        <span className="mt-0.5 block text-caption text-carbon-black/60">
                          {referenceContextLabel[referenceContextOf(marker)]}
                        </span>
                      </span>
                      <span className="shrink-0 text-subheading font-medium text-ink-roast">
                        {formatMarker(marker)}{" "}
                        <span className="text-caption font-normal text-carbon-black/60">{definition.unit}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-4 flex flex-col items-start">
              <Ghost href="/results">Open results</Ghost>
              {contributors.length > 0 ? (
                <Ghost href="/contributors">What&rsquo;s affecting this · {contributors.length}</Ghost>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* One disclaimer, once. */}
        <footer className="mt-16 border-t border-sand-wash pt-5" style={rise(7)}>
          <p className="text-caption text-carbon-black">
            {PROTOTYPE_DISCLAIMER}{" "}
            <Link href="/account/safety" className="font-[450] text-signal-orange">
              Safety centre →
            </Link>
          </p>
          <p className="mt-3 text-caption text-carbon-black/60">
            Design study ·{" "}
            <Link href="/today" className="text-signal-orange">
              compare with the current Today →
            </Link>
          </p>
        </footer>
      </main>

      {/* Floating pill navigation — the bible's 84px radius, orange glass lift. */}
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
