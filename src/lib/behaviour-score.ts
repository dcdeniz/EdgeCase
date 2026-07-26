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
import { dietDayFor, scoreDietDay } from "@/lib/nutrition";
import { healthDayFor, sleepNightFor, type WearableSeries } from "@/lib/wearable";
import { adherenceKey, type PrototypeState } from "@/lib/store";

export const BEHAVIOUR_RULE_VERSION = "prototype-behaviour-0.3.0";

export const BEHAVIOUR_SCORE_CAVEAT =
  "This reflects modifiable behaviours, not measured sperm quality.";

export type BehaviourDomainId =
  | "sleep"
  | "substances"
  | "metabolic"
  | "diet"
  | "activity"
  | "heat"
  | "environment"
  | "adherence";

export type BehaviourDomain = {
  id: BehaviourDomainId;
  label: string;
  weight: number;
  source: string;
  evidenceIds: string[];
  /** The claim ceiling for this domain. Rendered next to the number. */
  framing: string;
};

/** Identity hue per domain. Behaviour only — never a clinical parameter. */
export const domainColour: Record<BehaviourDomainId, string> = {
  sleep: "var(--ps-domain-sleep)",
  substances: "var(--ps-status-danger)",
  metabolic: "var(--ps-status-attention)",
  diet: "var(--ps-domain-diet)",
  activity: "var(--ps-domain-activity)",
  heat: "var(--ps-status-attention)",
  environment: "var(--ps-status-information)",
  adherence: "var(--ps-domain-adherence)",
};

export const behaviourDomains: Record<BehaviourDomainId, BehaviourDomain> = {
  sleep: {
    id: "sleep",
    label: "Sleep",
    weight: 15,
    source: "Simulated wearable",
    evidenceIds: ["sleep-circadian-sr"],
    framing:
      "Sleep informs recovery and hormonal context. The evidence does not support a direct claim about semen measurements.",
  },
  substances: {
    id: "substances",
    label: "Smoking and alcohol",
    weight: 15,
    source: "Onboarding and check-ins",
    evidenceIds: ["smoking-umbrella", "alcohol-umbrella"],
    framing: "Cigarette dose and cumulative exposure matter; heavy or chronic alcohol exposure is weighted more strongly than light intake.",
  },
  metabolic: {
    id: "metabolic",
    label: "Metabolic and energy balance",
    weight: 15,
    source: "Onboarding and health context",
    evidenceIds: ["obesity-intervention-sr"],
    framing: "Body composition, insulin resistance, diabetes, metabolic syndrome and severe energy restriction are contextual inputs, not diagnoses made by PreSeed.",
  },
  diet: {
    id: "diet",
    label: "Diet pattern",
    weight: 15,
    source: "Food log",
    evidenceIds: ["diet-pattern-sr", "mediterranean-sr"],
    framing:
      "Scored on overall pattern, which the evidence supports more strongly than any single nutrient or calorie total.",
  },
  activity: {
    id: "activity",
    label: "Activity",
    weight: 15,
    source: "Simulated wearable",
    evidenceIds: ["exercise-nma"],
    framing:
      "On a U-shaped curve. Moderate activity scores highest; sustained under-recovered load is flagged, not rewarded.",
  },
  heat: {
    id: "heat",
    label: "Heat and recent fever",
    weight: 10,
    source: "Onboarding and collection context",
    evidenceIds: ["heat-umbrella"],
    framing: "Recurrent substantial heat and recent high fever can affect the context in which a semen result is interpreted.",
  },
  environment: {
    id: "environment",
    label: "Occupational and air exposure",
    weight: 10,
    source: "Exposure check-in",
    evidenceIds: ["air-pollution-sr", "lead-ma", "pesticide-sr"],
    framing: "Lead, selected pesticides, solvents, occupational radiation and air pollution are association-level exposure signals.",
  },
  adherence: {
    id: "adherence",
    label: "Protocol adherence",
    weight: 5,
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
function scoreSleepDay(iso: string, state: PrototypeState, wearable?: WearableSeries): number | null {
  const night = wearable
    ? wearable.sleepNights.find((entry) => entry.date === iso) ?? null
    : sleepNightFor(iso);
  if (!night) return null;

  const durationRatio = night.asleepMinutes / night.needMinutes;
  const duration =
    durationRatio >= 1
      ? 100
      : durationRatio >= 0.9
        ? 88 + (durationRatio - 0.9) * 120
        : Math.max(20, durationRatio * 95);

  // Regularity: a 20-minute bedtime spread is excellent, 90 minutes is poor.
  const disorderPenalty = state.answers.sleepDisorder === "diagnosed" ? 18
    : state.answers.sleepDisorder === "suspected" ? 10
    : 0;
  if (night.bedtimeVarianceMinutes == null) return Math.max(0, Math.round(duration) - disorderPenalty);
  const regularity = Math.max(
    0,
    Math.min(100, 100 - Math.max(0, night.bedtimeVarianceMinutes - 20) * 1.35),
  );
  return Math.max(0, Math.round(duration * 0.7 + regularity * 0.3) - disorderPenalty);
}

/**
 * Confirmed meals override the synthetic log for their date. A meal the user
 * logs today therefore moves the diet domain, and through it fertility
 * readiness — in either direction, which is the point. Logging a burger should
 * be visible in the number, or the number is decorative.
 */
function scoreDietDayFor(state: PrototypeState, iso: string): number | null {
  const entered = state.foodEntries.filter((entry) => entry.date === iso);
  if (entered.length > 0) return scoreDietDay(entered).score;
  return dietDayFor(iso).score;
}

/**
 * Activity holds the U-shape the master build prompt insists on: moderate
 * movement scores best, and very high load does not score higher. It cannot
 * exceed the moderate band by being extreme.
 */
function scoreActivityDay(iso: string, state: PrototypeState, wearable?: WearableSeries): number | null {
  const day = wearable
    ? wearable.healthDays.find((entry) => entry.date === iso) ?? null
    : healthDayFor(iso);
  if (!day || day.steps == null || day.activeMinutes == null) return null;

  const stepTerm = Math.min(100, (day.steps / 9000) * 100);
  const activeTerm =
    day.activeMinutes <= 45
      ? (day.activeMinutes / 45) * 100
      : day.activeMinutes <= 90
        ? 100
        : Math.max(62, 100 - (day.activeMinutes - 90) * 0.5);

  const loadPenalty = state.answers.trainingLoad === "high_underrecovered" ? 22 : 0;
  return Math.max(0, Math.round(stepTerm * 0.45 + activeTerm * 0.55) - loadPenalty);
}

function scoreSubstances(state: PrototypeState): number | null {
  const { smoking, smokingExposureYears, alcoholUnits } = state.answers;
  if ((!smoking || smoking === "prefer_not") && (!alcoholUnits || alcoholUnits === "prefer_not")) return null;
  const smokingBase = smoking === "never" ? 100
    : smoking === "former" ? 78
    : smoking === "vape_only" ? 58
    : smoking === "under10" ? 35
    : smoking === "over10" ? 10
    : null;
  const cumulativePenalty = smokingBase == null || smoking === "never"
    ? 0
    : smokingExposureYears === "over10" ? 18
    : smokingExposureYears === "5to10" ? 10
    : smokingExposureYears === "under5" ? 4
    : 0;
  const smokingScore = smokingBase == null ? null : Math.max(0, smokingBase - cumulativePenalty);
  const alcoholScore = alcoholUnits === "none" ? 100
    : alcoholUnits === "1to7" ? 88
    : alcoholUnits === "8to14" ? 65
    : alcoholUnits === "over14" ? 25
    : null;
  const values = [smokingScore, alcoholScore].filter((value): value is number => value != null);
  return values.length === 0 ? null : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function scoreMetabolic(state: PrototypeState): number | null {
  const { metabolicContext, energyBalance, conditions } = state.answers;
  const diabetes = conditions?.includes("diabetes") ?? false;
  const metabolic = diabetes ? 35
    : metabolicContext === "supportive" ? 100
    : metabolicContext === "overweight" ? 75
    : metabolicContext === "central_adiposity" ? 55
    : metabolicContext === "obesity" ? 40
    : metabolicContext === "insulin_resistance" ? 38
    : metabolicContext === "metabolic_syndrome" ? 28
    : null;
  const energy = energyBalance === "stable" ? 100
    : energyBalance === "moderate_deficit" ? 82
    : energyBalance === "severe_restriction" ? 25
    : energyBalance === "metabolic_disruption" ? 20
    : null;
  const values = [metabolic, energy].filter((value): value is number => value != null);
  return values.length === 0 ? null : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function scoreHeatContext(state: PrototypeState): number | null {
  const exposures = state.answers.heatExposure;
  const fever = state.answers.recentFever;
  if ((!exposures || exposures.length === 0 || exposures.includes("prefer_not")) && (!fever || fever === "prefer_not")) return null;
  let score = 100;
  if (exposures && !exposures.includes("none")) {
    if (exposures.includes("sauna_hot_tub")) score -= 28;
    if (exposures.includes("occupational")) score -= 28;
    if (exposures.includes("prolonged_sitting")) score -= 12;
    if (exposures.includes("laptop")) score -= 6;
  }
  if (fever === "last_month") score -= 35;
  else if (fever === "last_3_months") score -= 18;
  return Math.max(0, score);
}

function scoreEnvironmentContext(state: PrototypeState): number | null {
  const exposures = state.answers.exposures;
  if (!exposures || exposures.length === 0 || exposures.includes("prefer_not")) return null;
  if (exposures.includes("none")) return 100;
  let score = 100;
  if (exposures.includes("air_quality")) score -= 18;
  if (exposures.includes("lead")) score -= 25;
  if (exposures.includes("pesticides")) score -= 20;
  if (exposures.includes("solvents") || exposures.includes("chemicals")) score -= 22;
  if (exposures.includes("radiation")) score -= 20;
  return Math.max(0, score);
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

/**
 * Forced domain scores, used only by the what-if projection. Overriding is
 * how a scenario is evaluated: the same model runs, with one input replaced.
 */
export type DomainOverrides = Partial<Record<BehaviourDomainId, number>>;

export function behaviourDay(
  state: PrototypeState,
  iso: string,
  overrides?: DomainOverrides,
  wearable?: WearableSeries,
): BehaviourDay {
  const domainScores: Record<BehaviourDomainId, number | null> = {
    sleep: overrides?.sleep ?? scoreSleepDay(iso, state, wearable),
    substances: overrides?.substances ?? scoreSubstances(state),
    metabolic: overrides?.metabolic ?? scoreMetabolic(state),
    diet: overrides?.diet ?? scoreDietDayFor(state, iso),
    activity: overrides?.activity ?? scoreActivityDay(iso, state, wearable),
    heat: overrides?.heat ?? scoreHeatContext(state),
    environment: overrides?.environment ?? scoreEnvironmentContext(state),
    adherence: overrides?.adherence ?? scoreAdherenceDay(state, iso),
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
  overrides?: DomainOverrides,
  wearable?: WearableSeries,
): BehaviourWindow {
  const rows: BehaviourDay[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    rows.push(behaviourDay(state, addDays(endingOn, -offset), overrides, wearable));
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
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Strong";
  if (score >= 45) return "Building";
  return "Getting started";
};

/* ==========================================================================
   Baseline and progress
   --------------------------------------------------------------------------
   The score opens at a baseline drawn from the earliest logged fortnight, so
   "+32 since you started" is a real comparison between two measured windows
   rather than a number counting up from a decorative zero.
   ========================================================================== */

export const BASELINE_WINDOW_DAYS = 14;
/** Days back to the close of the baseline window — the start of the record. */
const BASELINE_OFFSET_DAYS = 351;

export type DomainProgress = {
  id: BehaviourDomainId;
  label: string;
  weight: number;
  baseline: number | null;
  current: number | null;
  /** Null when either end is missing. `isNew` distinguishes the two cases. */
  delta: number | null;
  /** True when the domain had no baseline because it did not exist yet. */
  isNew: boolean;
};

export type ReadinessProgress = {
  baseline: BehaviourWindow;
  current: BehaviourWindow;
  /** Points gained or lost since the baseline window. */
  delta: number | null;
  /** Change over the last seven days against the seven before that. */
  weekDelta: number | null;
  domains: DomainProgress[];
};

export function readinessProgress(state: PrototypeState, endingOn = TODAY, wearable?: WearableSeries): ReadinessProgress {
  const current = behaviourWindow(state, 7, endingOn, undefined, wearable);
  const baseline = behaviourWindow(
    state,
    BASELINE_WINDOW_DAYS,
    addDays(endingOn, -BASELINE_OFFSET_DAYS),
    undefined,
    wearable,
  );
  const previousWeek = behaviourWindow(state, 7, addDays(endingOn, -7), undefined, wearable);

  const domains = (Object.keys(behaviourDomains) as BehaviourDomainId[]).map((id) => {
    const before = baseline.domains[id];
    const now = current.domains[id];
    return {
      id,
      label: behaviourDomains[id].label,
      weight: behaviourDomains[id].weight,
      baseline: before,
      current: now,
      delta: before == null || now == null ? null : now - before,
      isNew: before == null && now != null,
    };
  });

  return {
    baseline,
    current,
    delta:
      current.score == null || baseline.score == null ? null : current.score - baseline.score,
    weekDelta:
      current.score == null || previousWeek.score == null
        ? null
        : current.score - previousWeek.score,
    domains,
  };
}

/** "+7" / "−3" / "0", with a true minus sign rather than a hyphen. */
export function formatDelta(delta: number | null): string {
  if (delta == null) return "—";
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`;
}

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
export function behaviourGrid(state: PrototypeState, weeks = 53, endingOn = TODAY, wearable?: WearableSeries): GridCell[] {
  const endWeekday = new Date(`${endingOn}T00:00:00Z`).getUTCDay();
  // Walk back to the Sunday that opens the first column.
  const start = addDays(endingOn, -(weeks - 1) * 7 - endWeekday);
  const totalDays = daysBetween(start, endingOn) + 1;

  const cells: GridCell[] = [];
  for (let offset = 0; offset < totalDays; offset += 1) {
    const date = addDays(start, offset);
    const day = behaviourDay(state, date, undefined, wearable);
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
export function weeklySeries(state: PrototypeState, weeks = 52, endingOn = TODAY, wearable?: WearableSeries) {
  const series: Array<{ weekEnding: string; score: number | null; coverage: number }> = [];
  for (let index = weeks - 1; index >= 0; index -= 1) {
    const weekEnding = addDays(endingOn, -index * 7);
    const window = behaviourWindow(state, 7, weekEnding, undefined, wearable);
    series.push({ weekEnding, score: window.score, coverage: window.coverage });
  }
  return series;
}
