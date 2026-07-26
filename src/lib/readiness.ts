/**
 * Readiness score — PROTOTYPE PRESENTATION LOGIC ONLY.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * This is not the production scoring engine and must not become it. Production
 * readiness is a versioned, server-side, clinically reviewed deterministic rules
 * engine that writes append-only `score_snapshots`; that engine does not exist
 * yet and no API contract exposes it (see docs/design/dependencies.md).
 *
 * This module exists so the interface can be designed against realistic,
 * self-consistent numbers. It is deliberately transparent and auditable, and it
 * obeys the product invariants the real engine must also obey:
 *
 *   1. It scores modifiable behaviours only. It never claims sperm quality changed.
 *   2. Missing or withheld answers lower *confidence*, never readiness.
 *   3. Non-modifiable conditions never deduct points.
 *   4. Clinical gates are returned separately and cannot be averaged away.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const READINESS_RULE_VERSION = "prototype-rules-0.5.0";

export type DomainId =
  | "sleep"
  | "substances"
  | "diet"
  | "activity"
  | "metabolic"
  | "heat"
  | "sexual"
  | "environment";

export type OnboardingAnswers = {
  goalTiming?: "trying_now" | "within_3_months" | "within_year" | "few_years";
  protocolDays?: number;
  sleepHours?: "under6" | "6to7" | "7to8" | "over8" | "prefer_not";
  sleepPattern?: "regular" | "variable" | "shift";
  smoking?: "never" | "former" | "vape_only" | "under10" | "over10" | "prefer_not";
  smokingExposureYears?: "under5" | "5to10" | "over10" | "prefer_not";
  alcoholUnits?: "none" | "1to7" | "8to14" | "over14" | "prefer_not";
  dietPattern?: "mediterranean" | "mixed" | "western" | "prefer_not";
  produceServings?: "under2" | "2to4" | "over4";
  activitySessions?: "none" | "1to2" | "3to5" | "over5";
  sedentaryHours?: "under4" | "4to8" | "over8";
  trainingLoad?: "moderate" | "high_recovered" | "high_underrecovered";
  sleepDisorder?: "none" | "suspected" | "diagnosed" | "prefer_not";
  metabolicContext?:
    | "supportive"
    | "overweight"
    | "central_adiposity"
    | "obesity"
    | "insulin_resistance"
    | "metabolic_syndrome"
    | "prefer_not";
  energyBalance?: "stable" | "moderate_deficit" | "severe_restriction" | "metabolic_disruption" | "prefer_not";
  recentFever?: "none" | "last_month" | "last_3_months" | "prefer_not";
  heatExposure?: string[];
  sexualHealth?: string[];
  exposures?: string[];
  conditions?: string[];
  medications?: string[];
  supplements?: string[];
};

export type DomainDefinition = {
  id: DomainId;
  label: string;
  weight: number;
  /** Window the domain is assessed over, per the roadmap's feature windows. */
  window: string;
  evidenceConfidence: "moderate" | "limited" | "emerging";
  evidenceIds: string[];
  summary: string;
};

export const domains: Record<DomainId, DomainDefinition> = {
  sleep: {
    id: "sleep",
    label: "Sleep and circadian health",
    weight: 15,
    window: "Trailing 14–30 days",
    evidenceConfidence: "moderate",
    evidenceIds: ["sleep-circadian-sr"],
    summary: "Sleep duration and regularity, and whether your schedule is stable.",
  },
  substances: {
    id: "substances",
    label: "Alcohol, smoking and drugs",
    weight: 15,
    window: "Trailing 30 days",
    evidenceConfidence: "moderate",
    evidenceIds: ["smoking-umbrella", "alcohol-umbrella"],
    summary: "Nicotine exposure and alcohol amount, modelled by dose rather than yes or no.",
  },
  diet: {
    id: "diet",
    label: "Diet quality",
    weight: 15,
    window: "Trailing 14–30 days",
    evidenceConfidence: "moderate",
    evidenceIds: ["diet-pattern-sr", "mediterranean-sr"],
    summary: "Overall dietary pattern and diversity, which the evidence supports more strongly than single nutrients.",
  },
  activity: {
    id: "activity",
    label: "Activity and metabolic health",
    weight: 15,
    window: "Trailing 28 days",
    evidenceConfidence: "moderate",
    evidenceIds: ["exercise-nma", "obesity-intervention-sr"],
    summary: "Movement, sedentary time and training load, on a U-shaped curve rather than more-is-better.",
  },
  metabolic: {
    id: "metabolic",
    label: "Metabolic and energy balance",
    weight: 15,
    window: "Current context and trailing 30 days",
    evidenceConfidence: "moderate",
    evidenceIds: ["obesity-intervention-sr"],
    summary: "Central adiposity, obesity, insulin resistance, diabetes, metabolic syndrome and severe energy restriction.",
  },
  heat: {
    id: "heat",
    label: "Heat exposure",
    weight: 10,
    window: "Trailing 30 days",
    evidenceConfidence: "limited",
    evidenceIds: ["heat-umbrella"],
    summary: "Recurrent scrotal heat from saunas, hot tubs, occupational heat or prolonged sitting.",
  },
  sexual: {
    id: "sexual",
    label: "Sexual and reproductive health",
    weight: 5,
    window: "Persistent context",
    evidenceConfidence: "limited",
    evidenceIds: ["abstinence-sr"],
    summary: "Ejaculation frequency and any function concerns worth raising with a clinician.",
  },
  environment: {
    id: "environment",
    label: "Environmental exposure reduction",
    weight: 10,
    window: "Trailing 30 days",
    evidenceConfidence: "emerging",
    evidenceIds: ["air-pollution-sr", "lead-ma"],
    summary: "Air quality, plastics, pesticides and occupational chemicals you can practically reduce.",
  },
};

export const domainOrder: DomainId[] = [
  "sleep",
  "substances",
  "diet",
  "activity",
  "metabolic",
  "heat",
  "sexual",
  "environment",
];

export type Driver = {
  label: string;
  points: number;
  detail: string;
};

export type DomainResult = {
  id: DomainId;
  /** null means not enough information — this lowers confidence, not readiness. */
  score: number | null;
  drivers: Driver[];
  missing: string[];
};

const WITHHELD = "prefer_not";

function build(id: DomainId, base: number, drivers: Driver[], missing: string[]): DomainResult {
  if (missing.length > 0 && drivers.length === 0) {
    return { id, score: null, drivers, missing };
  }
  const total = drivers.reduce((sum, driver) => sum + driver.points, base);
  return { id, score: Math.max(0, Math.min(100, Math.round(total))), drivers, missing };
}

function scoreSleep(a: OnboardingAnswers): DomainResult {
  const drivers: Driver[] = [];
  const missing: string[] = [];

  if (!a.sleepHours || a.sleepHours === WITHHELD) missing.push("Typical sleep duration");
  else if (a.sleepHours === "7to8")
    drivers.push({ label: "Sleep duration in range", points: 30, detail: "7–8 hours is the range most consistently associated with better semen measurements." });
  else if (a.sleepHours === "over8")
    drivers.push({ label: "Long sleep duration", points: 18, detail: "Over 8 hours is not penalised, but very long sleep has also been associated with lower measurements." });
  else if (a.sleepHours === "6to7")
    drivers.push({ label: "Slightly short sleep", points: 12, detail: "6–7 hours sits just below the range used in the sleep evidence." });
  else drivers.push({ label: "Short sleep", points: 0, detail: "Under 6 hours is the clearest sleep signal in the association evidence." });

  if (!a.sleepPattern) missing.push("Schedule regularity");
  else if (a.sleepPattern === "regular")
    drivers.push({ label: "Regular schedule", points: 30, detail: "Consistent timing matters alongside duration." });
  else if (a.sleepPattern === "variable")
    drivers.push({ label: "Variable schedule", points: 14, detail: "Irregular timing weakens circadian signalling." });
  else
    drivers.push({ label: "Shift work", points: 8, detail: "Shift work is treated as a constraint to work around, not a personal failing. Targets adjust rather than penalise." });

  if (a.sleepDisorder === "diagnosed")
    drivers.push({ label: "Diagnosed sleep disorder", points: -15, detail: "Adds context to duration and circadian disruption without diagnosing or estimating a semen effect." });
  else if (a.sleepDisorder === "suspected")
    drivers.push({ label: "Possible sleep disorder", points: -8, detail: "A prompt to seek assessment, not a diagnosis." });

  return build("sleep", 40, drivers, missing);
}

function scoreSubstances(a: OnboardingAnswers): DomainResult {
  const drivers: Driver[] = [];
  const missing: string[] = [];

  if (!a.smoking || a.smoking === WITHHELD) missing.push("Nicotine use");
  else if (a.smoking === "never")
    drivers.push({ label: "No nicotine use", points: 35, detail: "Smoking has the most consistent adverse semen associations of the modifiable factors." });
  else if (a.smoking === "former")
    drivers.push({ label: "Former smoker", points: 30, detail: "Improvement after cessation tracks time since quitting, over roughly three months." });
  else if (a.smoking === "vape_only")
    drivers.push({ label: "Vaping only", points: 18, detail: "Vaping evidence is less mature than cigarette evidence, so this is weighted cautiously." });
  else if (a.smoking === "under10")
    drivers.push({ label: "Light smoking", points: 8, detail: "Cumulative exposure matters, so amount and duration both count." });
  else drivers.push({ label: "Heavy smoking", points: 0, detail: "The strongest modifiable signal in this domain." });

  if (a.smoking && !["never", "prefer_not"].includes(a.smoking)) {
    if (a.smokingExposureYears === "over10")
      drivers.push({ label: "Long cumulative exposure", points: -12, detail: "Duration is combined with current dose rather than treated as a yes/no factor." });
    else if (a.smokingExposureYears === "5to10")
      drivers.push({ label: "Cumulative exposure", points: -7, detail: "Duration adds context to current dose." });
    else if (!a.smokingExposureYears || a.smokingExposureYears === WITHHELD)
      missing.push("Cumulative smoking exposure");
  }

  if (!a.alcoholUnits || a.alcoholUnits === WITHHELD) missing.push("Alcohol intake");
  else if (a.alcoholUnits === "none")
    drivers.push({ label: "No alcohol", points: 30, detail: "Heavy intake is more consistently concerning than light intake." });
  else if (a.alcoholUnits === "1to7")
    drivers.push({ label: "Low alcohol intake", points: 26, detail: "Light intake is not clearly associated with lower measurements." });
  else if (a.alcoholUnits === "8to14")
    drivers.push({ label: "Moderate alcohol intake", points: 14, detail: "Sits between the light and heavy exposure groups in the evidence." });
  else drivers.push({ label: "Higher alcohol intake", points: 2, detail: "Above 14 units a week falls into the range where associations strengthen." });

  return build("substances", 35, drivers, missing);
}

function scoreDiet(a: OnboardingAnswers): DomainResult {
  const drivers: Driver[] = [];
  const missing: string[] = [];

  if (!a.dietPattern || a.dietPattern === WITHHELD) missing.push("Dietary pattern");
  else if (a.dietPattern === "mediterranean")
    drivers.push({ label: "Mediterranean-style pattern", points: 35, detail: "Pattern-level evidence is stronger than evidence for any single food or supplement." });
  else if (a.dietPattern === "mixed")
    drivers.push({ label: "Mixed pattern", points: 20, detail: "Room to shift toward the patterns with favourable associations." });
  else drivers.push({ label: "Western-style pattern", points: 5, detail: "Processed meat, refined carbohydrate and sugary drink patterns show unfavourable associations." });

  if (!a.produceServings) missing.push("Fruit and vegetable intake");
  else if (a.produceServings === "over4")
    drivers.push({ label: "High dietary diversity", points: 25, detail: "Diversity and fibre track with the favourable pattern evidence." });
  else if (a.produceServings === "2to4")
    drivers.push({ label: "Moderate produce intake", points: 15, detail: "" });
  else drivers.push({ label: "Low produce intake", points: 4, detail: "" });

  return build("diet", 35, drivers, missing);
}

function scoreActivity(a: OnboardingAnswers): DomainResult {
  const drivers: Driver[] = [];
  const missing: string[] = [];

  if (!a.activitySessions) missing.push("Weekly activity");
  else if (a.activitySessions === "3to5")
    drivers.push({ label: "Regular moderate activity", points: 32, detail: "Structured moderate activity is the part of the curve with intervention support." });
  else if (a.activitySessions === "1to2")
    drivers.push({ label: "Some activity", points: 18, detail: "" });
  else if (a.activitySessions === "over5")
    drivers.push({ label: "High training frequency", points: 22, detail: "Frequency alone is not a concern; sustained load without recovery is." });
  else drivers.push({ label: "Little activity", points: 5, detail: "Inactivity sits at the lower end of the U-shaped curve." });

  if (!a.sedentaryHours) missing.push("Sedentary time");
  else if (a.sedentaryHours === "under4")
    drivers.push({ label: "Low sedentary time", points: 18, detail: "" });
  else if (a.sedentaryHours === "4to8")
    drivers.push({ label: "Moderate sedentary time", points: 10, detail: "" });
  else drivers.push({ label: "High sedentary time", points: 3, detail: "Prolonged sitting contributes through both metabolic and heat pathways." });

  if (a.trainingLoad === "high_underrecovered") {
    drivers.push({
      label: "High load with poor recovery",
      points: -12,
      detail: "Only the sustained under-recovered extreme is flagged, and only as a modifiable risk if measurements are already borderline.",
    });
  }

  return build("activity", 35, drivers, missing);
}

function scoreMetabolic(a: OnboardingAnswers): DomainResult {
  const drivers: Driver[] = [];
  const missing: string[] = [];
  const diabetes = a.conditions?.includes("diabetes") ?? false;
  if (diabetes)
    drivers.push({ label: "Diabetes context", points: 10, detail: "Included as metabolic context, not diagnosed or graded by PreSeed." });
  else if (!a.metabolicContext || a.metabolicContext === WITHHELD) missing.push("Metabolic and body-composition context");
  else if (a.metabolicContext === "supportive") drivers.push({ label: "No known metabolic concern", points: 45, detail: "Self-reported context only." });
  else if (a.metabolicContext === "overweight") drivers.push({ label: "Overweight", points: 30, detail: "Gradual, sustainable change is favoured over rapid loss." });
  else if (a.metabolicContext === "central_adiposity") drivers.push({ label: "Central adiposity", points: 22, detail: "Waist-centered adiposity is treated as a metabolic context signal." });
  else if (a.metabolicContext === "obesity") drivers.push({ label: "Obesity", points: 16, detail: "A modifiable context where gradual intervention evidence is relevant." });
  else drivers.push({ label: "Insulin resistance or metabolic syndrome", points: 12, detail: "Known clinical context; PreSeed does not diagnose or treat it." });

  if (!a.energyBalance || a.energyBalance === WITHHELD) missing.push("Energy balance");
  else if (a.energyBalance === "stable") drivers.push({ label: "Stable energy balance", points: 40, detail: "Includes gradual, supported change." });
  else if (a.energyBalance === "moderate_deficit") drivers.push({ label: "Moderate planned deficit", points: 32, detail: "Distinguished from severe restriction." });
  else if (a.energyBalance === "severe_restriction") drivers.push({ label: "Severe energy restriction", points: 8, detail: "Severe restriction can create metabolic disruption; this is not a weight-loss recommendation." });
  else drivers.push({ label: "Recent metabolic disruption", points: 5, detail: "Rapid or major metabolic change warrants cautious interpretation." });
  return build("metabolic", 15, drivers, missing);
}

function scoreHeat(a: OnboardingAnswers): DomainResult {
  const exposures = a.heatExposure ?? [];
  if (exposures.length === 0 && !a.recentFever) return build("heat", 0, [], ["Heat exposure", "Recent high fever"]);
  if (exposures.includes(WITHHELD)) return build("heat", 0, [], ["Heat exposure"]);
  const drivers: Driver[] = [];
  let score = 90;
  if (exposures?.includes("none")) drivers.push({ label: "No recurrent heat exposure", points: 0, detail: "Nothing recurrent to reduce here." });
  if (exposures.includes("sauna_hot_tub")) {
    score -= 30;
    drivers.push({ label: "Sauna or hot tub use", points: -30, detail: "Repeated scrotal heating is biologically plausible and supported by limited human studies." });
  }
  if (exposures.includes("occupational")) {
    score -= 30;
    drivers.push({ label: "Occupational heat", points: -30, detail: "Occupational heat is harder to modify, so the plan focuses on cooling breaks rather than avoidance." });
  }
  if (exposures.includes("prolonged_sitting")) {
    score -= 18;
    drivers.push({ label: "Prolonged sitting", points: -18, detail: "Weaker evidence than sauna or occupational heat, so it carries a small weight." });
  }
  if (exposures.includes("laptop")) {
    score -= 8;
    drivers.push({ label: "Laptop on lap", points: -8, detail: "Treated as a heat question only. The radiation framing is not supported." });
  }
  if (a.recentFever === "last_month") {
    score -= 30;
    drivers.push({ label: "High fever within one month", points: -30, detail: "A temporary collection-context factor across a sperm-production cycle." });
  } else if (a.recentFever === "last_3_months") {
    score -= 15;
    drivers.push({ label: "High fever within three months", points: -15, detail: "Timing should accompany any result comparison." });
  } else if (!a.recentFever || a.recentFever === WITHHELD) {
    return build("heat", Math.max(0, score) - drivers.reduce((s, d) => s + d.points, 0), drivers, ["Recent high fever"]);
  }
  return build("heat", Math.max(0, score) - drivers.reduce((s, d) => s + d.points, 0), drivers, []);
}

function scoreSexual(a: OnboardingAnswers): DomainResult {
  const answers = a.sexualHealth;
  if (!answers || answers.length === 0 || answers.includes(WITHHELD)) {
    return build("sexual", 0, [], ["Sexual and reproductive health"]);
  }
  const drivers: Driver[] = [];
  let score = 85;
  if (answers.includes("none")) {
    drivers.push({ label: "No concerns reported", points: 85, detail: "" });
    return build("sexual", 0, drivers, []);
  }
  if (answers.includes("low_libido")) {
    score -= 20;
    drivers.push({ label: "Reduced libido", points: -20, detail: "Can reflect hormonal, vascular, psychological or medication factors. Worth a clinician conversation." });
  }
  if (answers.includes("erectile")) {
    score -= 20;
    drivers.push({ label: "Erectile difficulty", points: -20, detail: "Affects real-world chance of conception and has causes worth investigating." });
  }
  if (answers.includes("infrequent")) {
    score -= 15;
    drivers.push({ label: "Infrequent ejaculation", points: -15, detail: "Long abstinence changes measurements and reduces cycle coverage." });
  }
  return build("sexual", Math.max(0, score) - drivers.reduce((s, d) => s + d.points, 0), drivers, []);
}

function scoreEnvironment(a: OnboardingAnswers): DomainResult {
  const exposures = a.exposures;
  if (!exposures || exposures.length === 0 || exposures.includes(WITHHELD)) {
    return build("environment", 0, [], ["Environmental exposure"]);
  }
  if (exposures.includes("none")) {
    return build("environment", 0, [
      { label: "No tracked exposures reported", points: 85, detail: "" },
    ], []);
  }
  const drivers: Driver[] = [];
  let score = 85;
  if (exposures.includes("air_quality")) {
    score -= 22;
    drivers.push({ label: "Higher local air pollution", points: -22, detail: "Particulate exposure is associated with lower measurements, and indoor filtration is the best-evidenced response." });
  }
  if (exposures.includes("plastics")) {
    score -= 16;
    drivers.push({ label: "Frequent food-contact plastics", points: -16, detail: "Emerging evidence only. Reduction is low-cost, so it is worth doing without over-claiming." });
  }
  if (exposures.includes("pesticides")) {
    score -= 18;
    drivers.push({ label: "Pesticide contact", points: -18, detail: "Occupational contact carries more weight than dietary residue." });
  }
  if (exposures.includes("lead")) {
    score -= 24;
    drivers.push({ label: "Lead exposure", points: -24, detail: "A selected occupational exposure with human association evidence." });
  }
  if (exposures.includes("solvents") || exposures.includes("chemicals")) {
    score -= 22;
    drivers.push({ label: "Occupational chemicals", points: -22, detail: "Solvents, metals and fumes. Protective equipment matters more than avoidance." });
  }
  if (exposures.includes("radiation")) {
    score -= 18;
    drivers.push({ label: "Occupational ionising radiation", points: -18, detail: "Occupational exposure only; ordinary phone and laptop use is not scored as radiation." });
  }
  return build("environment", Math.max(0, score) - drivers.reduce((s, d) => s + d.points, 0), drivers, []);
}

/* ==========================================================================
   Clinical gates
   --------------------------------------------------------------------------
   Gates are not deductions. A good composite score cannot hide one, and a
   non-modifiable condition never costs behavioural points.
   ========================================================================== */

export type ClinicalGate = {
  id: string;
  severity: "escalation" | "attention";
  title: string;
  body: string;
  action: string;
  /** True when the gate must never be expressed as a score deduction. */
  nonModifiable: boolean;
};

const gateRules: Array<{ match: (a: OnboardingAnswers) => boolean; gate: ClinicalGate }> = [
  {
    match: (a) => Boolean(a.medications?.includes("testosterone")),
    gate: {
      id: "gate-exogenous-testosterone",
      severity: "escalation",
      title: "Testosterone or anabolic steroid use recorded",
      body:
        "Exogenous testosterone and anabolic steroids can markedly suppress the hormones that drive sperm production, and recovery after stopping can take months. This sits outside anything a lifestyle protocol can offset, and PreSeed will not recommend starting, stopping or changing a prescribed medicine.",
      action: "Discuss this with a clinician or fertility specialist before making any change.",
      nonModifiable: false,
    },
  },
  {
    match: (a) => Boolean(a.conditions?.includes("cancer_treatment")),
    gate: {
      id: "gate-cancer-treatment",
      severity: "escalation",
      title: "Cancer treatment recorded",
      body:
        "Chemotherapy and testicular or pelvic radiotherapy are established determinants of reproductive damage. If treatment has not started, preservation is time-critical and takes priority over anything else in this app.",
      action: "Contact a fertility specialist about sperm banking as a priority.",
      nonModifiable: true,
    },
  },
  {
    match: (a) => Boolean(a.conditions?.includes("varicocele")),
    gate: {
      id: "gate-varicocele",
      severity: "attention",
      title: "Diagnosed varicocele recorded",
      body:
        "A clinically diagnosed varicocele is managed by a clinician, not by lifestyle change. It does not reduce your readiness score, because it is not a behaviour.",
      action: "Raise your latest results with the clinician managing it.",
      nonModifiable: true,
    },
  },
  {
    match: (a) => Boolean(a.conditions?.includes("undescended_testes")),
    gate: {
      id: "gate-developmental",
      severity: "attention",
      title: "Developmental history recorded",
      body:
        "Childhood undescended testes belongs in baseline clinical interpretation. It is context for reading your results, and it never counts against your behavioural score.",
      action: "Mention this at any fertility assessment.",
      nonModifiable: true,
    },
  },
  {
    match: (a) => Boolean(a.medications?.includes("sulfasalazine") || a.medications?.includes("opioids")),
    gate: {
      id: "gate-medication-review",
      severity: "attention",
      title: "Medication worth discussing",
      body:
        "A medicine you recorded has documented reproductive effects. PreSeed does not advise stopping or changing prescribed treatment under any circumstances.",
      action: "Add this to the questions for your next clinical appointment.",
      nonModifiable: false,
    },
  },
];

export function clinicalGates(answers: OnboardingAnswers): ClinicalGate[] {
  return gateRules.filter((rule) => rule.match(answers)).map((rule) => rule.gate);
}

/* ==========================================================================
   Composite
   ========================================================================== */

export type ReadinessBand = {
  id: "insufficient" | "several" | "some" | "mostly" | "broadly";
  label: string;
  description: string;
};

export function readinessBand(score: number | null): ReadinessBand {
  if (score == null) {
    return {
      id: "insufficient",
      label: "Insufficient data",
      description: "Too few domains have information to produce a score you could act on.",
    };
  }
  if (score < 40)
    return {
      id: "several",
      label: "Several areas to work on",
      description: "Most domains sit below the ranges used in the supporting evidence.",
    };
  if (score < 60)
    return {
      id: "some",
      label: "Some areas to work on",
      description: "A mixed picture, with clear opportunities in specific domains.",
    };
  if (score < 80)
    return {
      id: "mostly",
      label: "Mostly supportive",
      description: "Most behaviours already sit in supportive ranges, with a few gaps.",
    };
  return {
    id: "broadly",
    label: "Broadly supportive",
    description: "Behaviours across domains sit in the ranges the evidence supports.",
  };
}

export type ReadinessResult = {
  score: number | null;
  band: ReadinessBand;
  ruleVersion: string;
  domains: DomainResult[];
  /** Domains with no usable answer. These reduce confidence, never readiness. */
  missingInputs: string[];
  gates: ClinicalGate[];
  weightCovered: number;
};

export function computeReadiness(answers: OnboardingAnswers): ReadinessResult {
  const results: DomainResult[] = [
    scoreSleep(answers),
    scoreSubstances(answers),
    scoreDiet(answers),
    scoreActivity(answers),
    scoreMetabolic(answers),
    scoreHeat(answers),
    scoreSexual(answers),
    scoreEnvironment(answers),
  ];

  const available = results.filter((result) => result.score != null);
  const weightCovered = available.reduce((sum, result) => sum + domains[result.id].weight, 0);

  const score =
    available.length === 0 || weightCovered < 40
      ? null
      : Math.round(
          available.reduce((sum, result) => sum + domains[result.id].weight * (result.score ?? 0), 0) /
            weightCovered,
        );

  const missingInputs = results.flatMap((result) => result.missing);

  return {
    score,
    band: readinessBand(score),
    ruleVersion: READINESS_RULE_VERSION,
    domains: results,
    missingInputs,
    gates: clinicalGates(answers),
    weightCovered,
  };
}

/**
 * Displayed score smoothing, kept so the design shows a stable number rather
 * than a figure that lurches on one unusual day. The factor is a product
 * hypothesis from the roadmap, not a validated constant.
 */
export function smoothDisplayed(previous: number | null, next: number | null) {
  if (next == null) return null;
  if (previous == null) return next;
  return Math.round(0.85 * previous + 0.15 * next);
}
