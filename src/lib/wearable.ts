/**
 * Synthetic wearable data — SLEEP AND HEALTH METRICS.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Every value in this module is generated, not measured. No wearable is
 * connected in the prototype, and MVP capability 8 (Apple Health, Oura, Whoop,
 * Garmin) has no implementation behind it. Surfaces that render this data must
 * carry the simulated label, exactly as clinical fixtures do.
 *
 * Generation is deterministic — a pure function of the date string — for two
 * reasons. The server and the first client render must agree, and a demo that
 * reshuffles its own history on every reload is not a demo of longitudinal
 * tracking.
 *
 * Evidence framing, from the master build prompt: sleep informs recovery and
 * hormonal context. It is a *modifiable contextual factor*. This module must
 * never be used to claim a direct effect on a semen measurement.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { TODAY, addDays, daysBetween } from "@/lib/format";

export const WEARABLE_SOURCE_LABEL = "Simulated wearable";

/* ==========================================================================
   Deterministic noise
   --------------------------------------------------------------------------
   FNV-1a over the date string, then mulberry32. Same date, same night, on
   every machine and every render.
   ========================================================================== */

function hashSeed(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rng(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

/** Day of week for an ISO date. 0 is Sunday. */
function weekdayOf(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

/* ==========================================================================
   Sleep
   ========================================================================== */

export type SleepStage = "deep" | "rem" | "light" | "awake";

export const sleepStageOrder: SleepStage[] = ["deep", "rem", "light", "awake"];

export const sleepStageLabel: Record<SleepStage, string> = {
  deep: "Deep",
  rem: "REM",
  light: "Light",
  awake: "Awake",
};

/**
 * Hypnogram segment. `startMinute` is measured from sleep onset, so the chart
 * can lay segments out without needing wall-clock arithmetic.
 */
export type SleepSegment = {
  stage: SleepStage;
  startMinute: number;
  durationMinute: number;
};

export type SleepNight = {
  /** The date the sleep *ended* — the morning, which is how wearables label a night. */
  date: string;
  /** Minutes actually asleep, excluding time awake in bed. */
  asleepMinutes: number;
  /** Personalised need. Held at 8h for the prototype rather than modelled. */
  needMinutes: number;
  /** Wall-clock, local, 24h. */
  bedtime: string;
  wakeTime: string;
  stages: Record<SleepStage, number>;
  segments: SleepSegment[];
  /** Standard deviation proxy for schedule regularity, in minutes. */
  bedtimeVarianceMinutes: number;
  source: "simulated";
};

const SLEEP_NEED_MINUTES = 480;

/**
 * A night is unlogged when the band was not worn. Roughly one night in nine,
 * clustered a little rather than evenly spread, because real gaps come in runs
 * — a forgotten charger, a weekend away.
 */
function nightIsLogged(iso: string): boolean {
  const random = rng(hashSeed(`worn:${iso}`));
  const daysAgo = daysBetween(iso, TODAY);
  // A holiday in the recent record, so the grid has one honest visible gap.
  if (daysAgo >= 96 && daysAgo <= 108) return random() > 0.75;
  return random() > 0.11;
}

export function sleepNightFor(iso: string): SleepNight | null {
  if (!nightIsLogged(iso)) return null;

  const random = rng(hashSeed(`sleep:${iso}`));
  const weekday = weekdayOf(iso);
  const isWeekend = weekday === 0 || weekday === 6;

  /*
   * Upward drift across the year, so the record shows a man whose behaviour
   * genuinely improved: roughly 5h30m and erratic a year ago, roughly 7h30m and
   * steady now. This describes sleep only. It is not, and must never be
   * rendered as, evidence that a clinical measurement moved.
   */
  const daysAgo = daysBetween(iso, TODAY);
  const drift = (365 - Math.min(daysAgo, 365)) / 365;

  const base = 312 + drift * 136 + (isWeekend ? 30 : 0);
  const asleepMinutes = Math.round(
    Math.max(255, Math.min(552, base + (random() - 0.5) * 88)),
  );

  /*
   * Stage proportions sit in physiologically ordinary ranges: deep 13–20%,
   * REM 19–26%, the remainder light, plus a separate awake allowance. Consumer
   * apps routinely render impossible splits; this one should not.
   */
  const deepShare = 0.13 + random() * 0.07;
  const remShare = 0.19 + random() * 0.07;
  const deep = Math.round(asleepMinutes * deepShare);
  const rem = Math.round(asleepMinutes * remShare);
  const light = asleepMinutes - deep - rem;
  const awake = Math.round(14 + random() * 34);

  // Minutes from midnight, so a bedtime after midnight wraps rather than
  // rendering as an impossible 24:47.
  const bedMinutes = ((isWeekend ? 23 : 22) * 60 + Math.round(random() * 119)) % (24 * 60);
  const bedtime = `${String(Math.floor(bedMinutes / 60)).padStart(2, "0")}:${String(
    bedMinutes % 60,
  ).padStart(2, "0")}`;

  const totalInBed = asleepMinutes + awake;
  const wakeMinutes = (bedMinutes + totalInBed) % (24 * 60);
  const wakeTime = `${String(Math.floor(wakeMinutes / 60)).padStart(2, "0")}:${String(
    wakeMinutes % 60,
  ).padStart(2, "0")}`;

  return {
    date: iso,
    asleepMinutes,
    needMinutes: SLEEP_NEED_MINUTES,
    bedtime,
    wakeTime,
    stages: { deep, rem, light, awake },
    segments: buildSegments(asleepMinutes, { deep, rem, light, awake }, random),
    // Schedule steadies over the year alongside duration: ±100 min early, ±30 now.
    bedtimeVarianceMinutes: Math.round(104 - drift * 74 + random() * 24),
    source: "simulated",
  };
}

/**
 * Build a plausible hypnogram rather than a random shuffle. Real sleep runs in
 * roughly 90-minute cycles, deep-weighted early and REM-weighted late, so the
 * chart should show that shape — it is the one feature of a sleep graph a user
 * can actually read.
 */
function buildSegments(
  asleepMinutes: number,
  stages: Record<SleepStage, number>,
  random: () => number,
): SleepSegment[] {
  const cycles = Math.max(3, Math.round(asleepMinutes / 92));
  const segments: SleepSegment[] = [];
  let cursor = 0;

  let deepLeft = stages.deep;
  let remLeft = stages.rem;
  let lightLeft = stages.light;
  let awakeLeft = stages.awake;

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    const progress = cycle / Math.max(1, cycles - 1);

    // Deep dominates early cycles and all but disappears by morning.
    const deepShare = Math.max(0, 1 - progress * 1.35);
    const deepSlice = Math.min(deepLeft, Math.round((stages.deep / cycles) * deepShare * 2.1));
    // REM does the inverse.
    const remSlice = Math.min(remLeft, Math.round((stages.rem / cycles) * (0.35 + progress * 1.5)));
    const lightSlice = Math.min(lightLeft, Math.round(stages.light / cycles));
    const awakeSlice = random() > 0.55 ? Math.min(awakeLeft, Math.round(random() * 9)) : 0;

    if (lightSlice > 0) {
      segments.push({ stage: "light", startMinute: cursor, durationMinute: lightSlice });
      cursor += lightSlice;
      lightLeft -= lightSlice;
    }
    if (deepSlice > 0) {
      segments.push({ stage: "deep", startMinute: cursor, durationMinute: deepSlice });
      cursor += deepSlice;
      deepLeft -= deepSlice;
    }
    if (remSlice > 0) {
      segments.push({ stage: "rem", startMinute: cursor, durationMinute: remSlice });
      cursor += remSlice;
      remLeft -= remSlice;
    }
    if (awakeSlice > 0) {
      segments.push({ stage: "awake", startMinute: cursor, durationMinute: awakeSlice });
      cursor += awakeSlice;
      awakeLeft -= awakeSlice;
    }
  }

  // Whatever rounding left behind is folded into a closing light block.
  const remainder = lightLeft + deepLeft + remLeft;
  if (remainder > 0) {
    segments.push({ stage: "light", startMinute: cursor, durationMinute: remainder });
  }

  return segments;
}

/** Most recent `days` nights, oldest first. Unlogged nights are omitted. */
export function sleepHistory(days: number, endingOn = TODAY): SleepNight[] {
  const nights: SleepNight[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const night = sleepNightFor(addDays(endingOn, -offset));
    if (night) nights.push(night);
  }
  return nights;
}

export function latestSleepNight(endingOn = TODAY): SleepNight | null {
  for (let offset = 0; offset < 14; offset += 1) {
    const night = sleepNightFor(addDays(endingOn, -offset));
    if (night) return night;
  }
  return null;
}

/** Share of need met, capped at 100 — over-sleeping is not extra credit. */
export function sleepNeedPercent(night: SleepNight): number {
  return Math.min(100, Math.round((night.asleepMinutes / night.needMinutes) * 100));
}

/* ==========================================================================
   Health metrics
   --------------------------------------------------------------------------
   Resting heart rate and HRV are proxies for recovery, never hormone
   measurements — the master build prompt is explicit about this, and any copy
   rendering these values has to stay on the proxy side of that line.
   ========================================================================== */

export type HealthDay = {
  date: string;
  restingHeartRate: number;
  /** RMSSD in milliseconds. */
  heartRateVariability: number;
  steps: number;
  activeMinutes: number;
  source: "simulated";
};

export function healthDayFor(iso: string): HealthDay | null {
  if (!nightIsLogged(iso)) return null;
  const random = rng(hashSeed(`health:${iso}`));
  const weekday = weekdayOf(iso);
  const isWeekend = weekday === 0 || weekday === 6;
  const daysAgo = daysBetween(iso, TODAY);
  const drift = (365 - Math.min(daysAgo, 365)) / 365;

  return {
    date: iso,
    restingHeartRate: Math.round(66 - drift * 9 + (random() - 0.5) * 6),
    heartRateVariability: Math.round(40 + drift * 22 + (random() - 0.5) * 14),
    steps: Math.round(
      (isWeekend ? 2900 : 3700) + drift * 5300 + (random() - 0.5) * 3000,
    ),
    activeMinutes: Math.round(
      Math.max(0, (isWeekend ? 6 : 9) + drift * 31 + (random() - 0.5) * 22),
    ),
    source: "simulated",
  };
}

export function healthHistory(days: number, endingOn = TODAY): HealthDay[] {
  const rows: HealthDay[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = healthDayFor(addDays(endingOn, -offset));
    if (day) rows.push(day);
  }
  return rows;
}

export function latestHealthDay(endingOn = TODAY): HealthDay | null {
  for (let offset = 0; offset < 14; offset += 1) {
    const day = healthDayFor(addDays(endingOn, -offset));
    if (day) return day;
  }
  return null;
}

/* ==========================================================================
   Sperm Epigenetic Age
   --------------------------------------------------------------------------
   SIMULATED, exactly like the semen analysis it sits beside.

   Sperm Epigenetic Age is a real DNA-methylation clock. Higher SEA has been
   associated with a longer time to pregnancy and with shorter gestation, and
   is higher in men who smoke (Hum Reprod, 379 men — see the card for the link).

   It cannot be computed from lifestyle logs. The figure below stands in for a
   laboratory methylation assay that has not been run, and every surface
   rendering it must carry the simulated label. Nothing in the app scores off
   it, and no protocol action claims to move it.
   ========================================================================== */

export type SpermAge = {
  /** Years, from the simulated methylation assay. */
  epigeneticAge: number;
  /** Years, from date of birth. */
  chronologicalAge: number;
  /** Positive means the sperm reads older than the man. */
  differenceYears: number;
  collectedOn: string;
  source: "simulated";
};

export function spermAge(): SpermAge {
  const epigeneticAge = 38.4;
  const chronologicalAge = 34;
  return {
    epigeneticAge,
    chronologicalAge,
    differenceYears: Number((epigeneticAge - chronologicalAge).toFixed(1)),
    collectedOn: "2026-04-18",
    source: "simulated",
  };
}

/** Compact form for the disc: "4.5 years older". */
export function formatAgeGapShort(differenceYears: number): string {
  const absolute = Math.abs(differenceYears);
  const rounded = Number(absolute.toFixed(1));
  return `${rounded} year${rounded === 1 ? "" : "s"} ${differenceYears >= 0 ? "older" : "younger"}`;
}

/** "4 years and 5 months older", from a decimal year difference. */
export function formatAgeGap(differenceYears: number): string {
  const absolute = Math.abs(differenceYears);
  const years = Math.floor(absolute);
  const months = Math.round((absolute - years) * 12);
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? "" : "s"}`);
  if (months > 0) parts.push(`${months} month${months === 1 ? "" : "s"}`);
  const span = parts.length > 0 ? parts.join(" and ") : "less than a month";
  return `${span} ${differenceYears >= 0 ? "older" : "younger"} than your age in years`;
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours === 0) return `${rest}m`;
  return `${hours}h ${String(rest).padStart(2, "0")}m`;
}
