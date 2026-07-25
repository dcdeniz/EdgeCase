/**
 * Tracked exposure quantities — SYNTHETIC.
 *
 * Contributors read better as amounts than as categories: "80 cigarettes a
 * week" is checkable by the user in a way that "smoker" is not, and it is the
 * form the dose-dependent evidence is actually written in.
 *
 * Air quality would come from a real API keyed on the user's location once
 * permission is granted. Here it is generated, and labelled as such wherever
 * it appears.
 */

import { TODAY, addDays, daysBetween } from "@/lib/format";
import type { OnboardingAnswers } from "@/lib/readiness";

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

/* ==========================================================================
   Smoking and alcohol, as weekly amounts
   ========================================================================== */

/** Cigarettes over the trailing week. Null when the user does not smoke. */
export function cigarettesPerWeek(answers: OnboardingAnswers): number | null {
  const random = rng(hashSeed("cigs"));
  if (answers.smoking === "over10") return Math.round(84 + random() * 42);
  if (answers.smoking === "under10") return Math.round(35 + random() * 28);
  return null;
}

/** UK units over the trailing week. Null when the user does not drink. */
export function alcoholUnitsPerWeek(answers: OnboardingAnswers): number | null {
  const random = rng(hashSeed("units"));
  if (answers.alcoholUnits === "over14") return Math.round(18 + random() * 11);
  if (answers.alcoholUnits === "8to14") return Math.round(9 + random() * 5);
  if (answers.alcoholUnits === "1to7") return Math.round(2 + random() * 5);
  return null;
}

/* ==========================================================================
   Air quality
   --------------------------------------------------------------------------
   Stands in for a location-keyed AQI service. Real integration would request
   location permission and read PM2.5 and NO2 for the user's area.
   ========================================================================== */

export type AirQuality = {
  /** Fine particulate, µg/m³, trailing 30-day mean. */
  pm25: number;
  /** Nitrogen dioxide, µg/m³. */
  no2: number;
  band: "low" | "moderate" | "high";
  /** Placeholder for the resolved location name. */
  area: string;
  source: "simulated";
};

/** WHO 2021 annual guideline for PM2.5 is 5 µg/m³. */
export const PM25_WHO_GUIDELINE = 5;

export function airQuality(): AirQuality {
  const random = rng(hashSeed(`aqi:${TODAY}`));
  const pm25 = Number((11 + random() * 5).toFixed(1));
  return {
    pm25,
    no2: Math.round(24 + random() * 14),
    band: pm25 >= 15 ? "high" : pm25 >= 10 ? "moderate" : "low",
    area: "your area",
    source: "simulated",
  };
}

/** Days in the trailing month where PM2.5 sat above the WHO guideline. */
export function daysAboveGuideline(): number {
  let count = 0;
  for (let offset = 0; offset < 30; offset += 1) {
    const random = rng(hashSeed(`aqi:${addDays(TODAY, -offset)}`));
    if (11 + random() * 5 > PM25_WHO_GUIDELINE) count += 1;
  }
  return count;
}

/** Kept so the module has a single place to read "how long has this run". */
export function trackedSinceDays(): number {
  return daysBetween(addDays(TODAY, -365), TODAY);
}
