/**
 * Behaviour score — WEEKLY AND YEARLY, FROM LOGGED DATA.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * What this is, and more importantly what it is not.
 *
 * The readiness engine in `readiness.ts` scores a one-off questionnaire. This
 * module scores what was actually *logged* — sleep, food, movement, adherence —
 * day by day, so the same four modifiable domains can be shown over a week and
 * over a year.
 *
 * It obeys the invariant that governs every score in this product
 * (docs/design/README.md, "Four outputs, never one number"):
 *
 *   IT SCORES MODIFIABLE BEHAVIOUR ONLY.
 *
 * No clinical measurement, no model prediction and no data-confidence term is
 * blended in. A semen analysis cannot move this number, and this number must
 * never be presented as describing sperm quality. Every surface that renders it
 * carries `BEHAVIOUR_SCORE_CAVEAT` — that is not decoration, it is the
 * condition under which a composite figure is defensible here at all.
 *
 * Second invariant, inherited: a day with no data scores `null`, never zero.
 * Missing data lands on coverage, so a week spent off the app reads as a gap in
 * the record rather than as bad behaviour.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { TODAY, addDays, daysBetween } from "@/lib/format";
import { dietDayFor } from "@/lib/nutrition";
import { healthDayFor, sleepNightFor } from "@/lib/wearable";
import { adherenceKey, type PrototypeState } from "@/lib/store";

export const BEHAVIOUR_RULE_VERSION = "prototype-behaviour-0.2.0";

export const BEHAVIOUR_SCORE_CAVEAT =
  "This reflects modifiable behaviours, not measured sperm quality.";

export type BehaviourDomainId = "sleep" | "diet" | "activity" | "adherence";

export type BehaviourDomain = {
  id: BehaviourDomainId;
  label: string;
  weight: number;
  source: string;
  evidenceIds: string[];
  /** The claim ceiling for this domain. Rendered next to the number. */
  framing: string;
};

export const behaviourDomains: Record<BehaviourDomainId, BehaviourDomain> = {
  sleep: {
    id: "sleep",
    label: "Sleep",
    weight: 30,
    source: "Simulated wearable",
    evidenceIds: ["sleep-circadian-sr"],
    framing:
      "Sleep informs recovery and hormonal context. The evidence does not support a direct claim about semen measurements.",
  },
  diet: {
    id: "diet",
    label: "Diet pattern",
    weight: 25,
    source: "Food log",
    evidenceIds: ["diet-pattern-sr", "mediterranean-sr"],
    framing:
      "Scored on overall pattern, which the evidence supports more strongly than any single nutrient or calorie total.",
  },
  activity: {
    id: "activity",
    label: "Activity",
    weight: 20,
    source: "Simulated wearable",
    evidenceIds: ["exercise-nma"],
    framing:
      "On a U-shaped curve. Moderate activity scores highest; sustained under-recovered load is flagged, not rewarded.",
  },
  adherence: {
    id: "adherence",
    label: "Protocol adherence",
    weight: 25,
    source: "Your check-ins",
    evidenceIds: [],
    framing:
      "How much of the dated protocol was logged. A record of what happened, not a target to hit.",
  },
};

export type BehaviourDay = {
  date: string;
  /** Null when nothing at all was logged that day. */
  score: number | null;
  domains: Record<BehaviourDomainId, number | null>;
  /** Sum of the weights that had usable data. Drives coverage, not the score. */
  weightCovered: number;
};

/* ==========================================================================
   Per-domain day scoring
   ========================================================================== */

/**
 * Sleep is scored on duration against need *and* schedule regularity, because
 * the evidence card covers circadian disruption as well as duration. Sleeping
 * far beyond need is not extra credit, so the duration term saturates at 100.
 */
function scoreSleepDay(iso: string): number | null {
  const night = sleepNightFor(iso);
  if (!night) return null;

  const durationRatio = night.asleepMinutes / night.needMinutes;
  const duration =
    durationRatio >= 1
      ? 100
      : durationRatio >= 0.9
        ? 88 + (durationRatio - 0.9) * 120
        : Math.max(20, durationRatio * 95);

  // Regularity: a 20-minute bedtime spread is excellent, 90 minutes is poor.
  const regularity = Math.max(
    0,
    Math.min(100, 100 - Math.max(0, night.bedtimeVarianceMinutes - 20) * 1.35),
  );

  return Math.round(duration * 0.7 + regularity * 0.3);
}

function scoreDietDayFor(iso: string): number | null {
  return dietDayFor(iso).score;
}

/**
 * Activity holds the U-shape the master build prompt insists on: moderate
 * movement scores best, and very high load does not score higher. It cannot
 * exceed the moderate band by being extreme.
 */
function scoreActivityDay(iso: string): number | null {
  const day = healthDayFor(iso);
  if (!day) return null;

  const stepTerm = Math.min(100, (day.steps / 9000) * 100);
  const activeTerm =
    day.activeMinutes <= 45
      ? (day.activeMinutes / 45) * 100
      : day.activeMinutes <= 90
        ? 100
        : Math.max(62, 100 - (day.activeMinutes - 90) * 0.5);

  return Math.round(stepTerm * 0.45 + activeTerm * 0.55);
}

/**
 * Adherence for the day, over whatever protocol items were scheduled. Partial
 * counts as half — the same arithmetic the rolling window uses, so the two
 * surfaces cannot disagree.
 */
function scoreAdherenceDay(state: PrototypeState, iso: string): number | null {
  if (!state.protocol) return null;
  let completed = 0;
  let partial = 0;
  let skipped = 0;

  for (const item of state.protocol.items) {
    const status = state.adherence[adherenceKey(item.id, iso)];
    if (status === "completed") completed += 1;
    else if (status === "partial") partial += 1;
    else if (status === "skipped") skipped += 1;
  }

  const logged = completed + partial + skipped;
  if (logged === 0) return null;
  return Math.round(((completed + partial * 0.5) / logged) * 100);
}

/* ==========================================================================
   Day, week and year
   ========================================================================== */

export function behaviourDay(state: PrototypeState, iso: string): BehaviourDay {
  const domainScores: Record<BehaviourDomainId, number | null> = {
    sleep: scoreSleepDay(iso),
    diet: scoreDietDayFor(iso),
    activity: scoreActivityDay(iso),
    adherence: scoreAdherenceDay(state, iso),
  };

  let weighted = 0;
  let weightCovered = 0;
  for (const id of Object.keys(domainScores) as BehaviourDomainId[]) {
    const score = domainScores[id];
    if (score == null) continue;
    weighted += behaviourDomains[id].weight * score;
    weightCovered += behaviourDomains[id].weight;
  }

  /*
   * A day needs at least 30 points of weight behind it before it gets a number.
   * One logged snack is not a day, and letting it render as a score would make
   * the yearly grid a picture of logging habits rather than of behaviour.
   */
  return {
    date: iso,
    score: weightCovered < 30 ? null : Math.round(weighted / weightCovered),
    domains: domainScores,
    weightCovered,
  };
}

export type BehaviourWindow = {
  from: string;
  to: string;
  /** Mean of the scored days in the window. Null when none were scored. */
  score: number | null;
  /** Share of days in the window that produced a score, 0–100. */
  coverage: number;
  scoredDays: number;
  totalDays: number;
  domains: Record<BehaviourDomainId, number | null>;
  days: BehaviourDay[];
};

export function behaviourWindow(
  state: PrototypeState,
  days: number,
  endingOn = TODAY,
): BehaviourWindow {
  const rows: BehaviourDay[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    rows.push(behaviourDay(state, addDays(endingOn, -offset)));
  }

  const scored = rows.filter((row) => row.score != null);
  const domainMeans = {} as Record<BehaviourDomainId, number | null>;
  for (const id of Object.keys(behaviourDomains) as BehaviourDomainId[]) {
    const values = rows.map((row) => row.domains[id]).filter((value): value is number => value != null);
    domainMeans[id] =
      values.length === 0
        ? null
        : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  return {
    from: addDays(endingOn, -(days - 1)),
    to: endingOn,
    score:
      scored.length === 0
        ? null
        : Math.round(scored.reduce((sum, row) => sum + (row.score ?? 0), 0) / scored.length),
    coverage: Math.round((scored.length / days) * 100),
    scoredDays: scored.length,
    totalDays: days,
    domains: domainMeans,
    days: rows,
  };
}

export const behaviourBandLabel = (score: number | null): string => {
  if (score == null) return "Not enough logged";
  if (score >= 80) return "Consistent";
  if (score >= 65) return "Mostly consistent";
  if (score >= 45) return "Mixed";
  return "Sparse";
};

/* ==========================================================================
   Contribution grid
   --------------------------------------------------------------------------
   A year of logged days, as a record. Deliberately NOT a streak: there is no
   current-streak count, no longest-streak count and no loss-aversion copy
   anywhere near it, because those fail the bad-news test the design research
   applies to every borrowed pattern (docs/design/market-inspiration.md).
   A gap here reads as a gap in the record. That is all it is.
   ========================================================================== */

export type GridCell = {
  date: string;
  score: number | null;
  /** 0 = nothing logged, 1–4 = quartile of the day score. */
  level: 0 | 1 | 2 | 3 | 4;
  weekIndex: number;
  weekday: number;
};

export function gridLevel(score: number | null): 0 | 1 | 2 | 3 | 4 {
  if (score == null) return 0;
  if (score >= 80) return 4;
  if (score >= 65) return 3;
  if (score >= 45) return 2;
  return 1;
}

/**
 * Build a 53-week grid ending on `endingOn`, aligned so each column is a week
 * running Sunday to Saturday.
 */
export function behaviourGrid(state: PrototypeState, weeks = 53, endingOn = TODAY): GridCell[] {
  const endWeekday = new Date(`${endingOn}T00:00:00Z`).getUTCDay();
  // Walk back to the Sunday that opens the first column.
  const start = addDays(endingOn, -(weeks - 1) * 7 - endWeekday);
  const totalDays = daysBetween(start, endingOn) + 1;

  const cells: GridCell[] = [];
  for (let offset = 0; offset < totalDays; offset += 1) {
    const date = addDays(start, offset);
    const day = behaviourDay(state, date);
    cells.push({
      date,
      score: day.score,
      level: gridLevel(day.score),
      weekIndex: Math.floor(offset / 7),
      weekday: offset % 7,
    });
  }
  return cells;
}

/** Weekly means across the year, for the trend line under the yearly ring. */
export function weeklySeries(state: PrototypeState, weeks = 52, endingOn = TODAY) {
  const series: Array<{ weekEnding: string; score: number | null; coverage: number }> = [];
  for (let index = weeks - 1; index >= 0; index -= 1) {
    const weekEnding = addDays(endingOn, -index * 7);
    const window = behaviourWindow(state, 7, weekEnding);
    series.push({ weekEnding, score: window.score, coverage: window.coverage });
  }
  return series;
}
