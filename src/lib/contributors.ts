/**
 * Parameter contributors — WHY A PARAMETER SITS WHERE IT DOES.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Extends ParameterReasoning with attribution to the user's OWN inputs:
 * onboarding answers, wearable record, food log and reported exposures.
 *
 * Three rules govern every string this module produces.
 *
 * 1. ASSOCIATION, NEVER CAUSATION. No contributor here "caused" a result. The
 *    underlying evidence is observational, so the copy says *associated with*
 *    and the UI states it. "Your smoking caused your low count" is not a claim
 *    this product can make, and would be false on the evidence as it stands.
 *
 * 2. NO INDEPENDENT DIALS. Concentration, motility, morphology and DFI share
 *    upstream causes — chiefly oxidative stress and the HPG axis. Contributors
 *    are therefore listed against a parameter as *shared* influences, never as
 *    a decomposition summing to the deficit.
 *
 * 3. EVERY CONTRIBUTOR CARRIES A REAL, ALLOW-LISTED CITATION. `evidenceId`
 *    must resolve in the evidence library. Contributors whose card is not
 *    `internal_review` are surfaced as candidates and are excluded from
 *    recommendations, per the library's own rule.
 *
 * Mapping and sources: docs/design/parameter-contributors.md
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { MarkerCode } from "@/lib/clinical";
import { evidenceById } from "@/lib/fixtures";
import type { OnboardingAnswers } from "@/lib/readiness";
import type { PrototypeState } from "@/lib/store";
import { dietDayFor } from "@/lib/nutrition";
import { TODAY } from "@/lib/format";
import { mean, sleepHistory } from "@/lib/wearable";

export type ContributorStrength = "established" | "probable" | "emerging";

export const strengthLabel: Record<ContributorStrength, string> = {
  established: "Consistent association",
  probable: "Probable association",
  emerging: "Emerging, not actionable",
};

export type Contributor = {
  id: string;
  label: string;
  /** The user's own value, verbatim enough to be checkable. */
  yourValue: string;
  /** Where that value came from. Provenance, same as a lab result. */
  source: "Onboarding" | "Wearable" | "Food log" | "Exposure log";
  /** Parameters this exposure is associated with in the cited work. */
  affects: MarkerCode[];
  mechanism: string;
  evidenceId: string;
  strength: ContributorStrength;
};

const OXIDATIVE = "Oxidative stress — sperm carry minimal antioxidant repair machinery.";
const HPG = "Disruption of the hypothalamic–pituitary–gonadal axis.";
const ENDOCRINE = "Endocrine disruption and oxidative stress.";

const SEMEN_CORE: MarkerCode[] = [
  "concentration_million_ml",
  "total_count_million",
  "progressive_motility_pct",
  "total_motility_pct",
  "normal_morphology_pct",
];

/* ==========================================================================
   Derivation from the user's record
   ========================================================================== */

export function contributorsFor(state: PrototypeState): Contributor[] {
  const answers: OnboardingAnswers = state.answers;
  const found: Contributor[] = [];

  /* --- Smoking. Strongest lifestyle signal in the library. -------------- */
  if (answers.smoking === "under10" || answers.smoking === "over10") {
    found.push({
      id: "smoking",
      label: "Cigarette smoking",
      yourValue: answers.smoking === "over10" ? "Over 10/day" : "Under 10/day",
      source: "Onboarding",
      affects: [...SEMEN_CORE, "dna_fragmentation_pct"],
      mechanism: OXIDATIVE,
      evidenceId: "smoking-umbrella",
      strength: "established",
    });
  }

  /* --- Alcohol. Dose-dependent; light intake is not flagged. ------------ */
  if (answers.alcoholUnits === "8to14" || answers.alcoholUnits === "over14") {
    found.push({
      id: "alcohol",
      label: "Alcohol intake",
      yourValue: answers.alcoholUnits === "over14" ? "Over 14 units/week" : "8–14 units/week",
      source: "Onboarding",
      affects: SEMEN_CORE,
      mechanism: `${OXIDATIVE} Sertoli and Leydig cell function is also affected at higher intakes.`,
      evidenceId: "alcohol-umbrella",
      strength: "probable",
    });
  }

  /* --- Reported environmental exposures. -------------------------------- */
  const exposures = answers.exposures ?? [];

  if (exposures.includes("air_quality")) {
    found.push({
      id: "air-pollution",
      label: "Air pollution (PM2.5 / NO₂)",
      yourValue: "Reported in your area",
      source: "Exposure log",
      affects: SEMEN_CORE,
      mechanism: `${OXIDATIVE} Particulate exposure raises systemic inflammatory load.`,
      evidenceId: "air-pollution-sr",
      strength: "established",
    });
  }

  if (exposures.includes("pesticides")) {
    found.push({
      id: "pesticides",
      label: "Pesticide exposure",
      yourValue: "Occupational or dietary, reported",
      source: "Exposure log",
      affects: ["concentration_million_ml", "total_motility_pct", "normal_morphology_pct"],
      mechanism: ENDOCRINE,
      evidenceId: "pesticide-sr",
      strength: "probable",
    });
  }

  if (exposures.includes("chemicals")) {
    found.push({
      id: "heavy-metals",
      label: "Occupational chemicals and metals",
      yourValue: "Reported",
      source: "Exposure log",
      affects: SEMEN_CORE,
      mechanism: `${ENDOCRINE} Lead has the most consistent human evidence of the metals.`,
      evidenceId: "lead-ma",
      strength: "established",
    });
  }

  /*
   * Microplastics. Real literature, but the card is clinical_review_pending
   * and the evidence is emerging — small samples, difficult source
   * attribution, zero intervention data. It is surfaced so the user is not
   * kept in the dark, and marked so it cannot drive a recommendation.
   */
  if (exposures.includes("plastics")) {
    found.push({
      id: "microplastics",
      label: "Plastics and microplastics",
      yourValue: "Reported",
      source: "Exposure log",
      affects: ["concentration_million_ml", "total_motility_pct"],
      mechanism: ENDOCRINE,
      evidenceId: "microplastics-sr",
      strength: "emerging",
    });
  }

  /* --- Heat. Scrotal thermoregulation. ---------------------------------- */
  const heat = answers.heatExposure ?? [];
  const heatSources = heat.filter((entry) => entry !== "none" && entry !== "prefer_not");
  if (heatSources.length > 0) {
    found.push({
      id: "heat",
      label: "Recurrent scrotal heat",
      yourValue: `${heatSources.length} source${heatSources.length === 1 ? "" : "s"} reported`,
      source: "Onboarding",
      affects: ["concentration_million_ml", "total_count_million", "progressive_motility_pct"],
      mechanism: "Spermatogenesis requires a testicular temperature below core body temperature.",
      evidenceId: "heat-umbrella",
      strength: "probable",
    });
  }

  /* --- Wearable: short sleep, as recovery/hormonal context only. --------- */
  const nights = sleepHistory(14);
  const meanSleep = mean(nights.map((night) => night.asleepMinutes));
  if (meanSleep != null && meanSleep < 390) {
    found.push({
      id: "short-sleep",
      label: "Short sleep",
      yourValue: `${(meanSleep / 60).toFixed(1)}h mean over 14 nights`,
      source: "Wearable",
      affects: ["concentration_million_ml", "total_count_million"],
      mechanism: `${HPG} Sleep is recovery and hormonal context, not a direct semen effect.`,
      evidenceId: "sleep-circadian-sr",
      strength: "probable",
    });
  }

  /* --- Food log: Western-pattern diet. ---------------------------------- */
  const dietToday = dietDayFor(TODAY).score;
  if (dietToday != null && dietToday < 50) {
    found.push({
      id: "diet-pattern",
      label: "Western dietary pattern",
      yourValue: `Pattern score ${dietToday}/100`,
      source: "Food log",
      affects: SEMEN_CORE,
      mechanism: OXIDATIVE,
      evidenceId: "diet-pattern-sr",
      strength: "probable",
    });
  }

  return found;
}

/** Contributors associated with one parameter, strongest evidence first. */
export function contributorsForMarker(state: PrototypeState, code: MarkerCode): Contributor[] {
  const order: Record<ContributorStrength, number> = {
    established: 0,
    probable: 1,
    emerging: 2,
  };
  return contributorsFor(state)
    .filter((contributor) => contributor.affects.includes(code))
    .sort((a, b) => order[a.strength] - order[b.strength]);
}

/** True when the citation is not cleared for recommendations. */
export function isCandidate(contributor: Contributor): boolean {
  return evidenceById.get(contributor.evidenceId)?.reviewStatus !== "internal_review";
}

/**
 * The sentence that must accompany any contributor list. Stated once per
 * surface, not per row, but never omitted.
 */
export const CONTRIBUTOR_CAVEAT =
  "Associations from observational evidence, matched to your own inputs. These are not causes, they do not decompose the result, and parameters share upstream mechanisms.";
