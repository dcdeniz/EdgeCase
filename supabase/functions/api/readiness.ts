export const READINESS_RULE_VERSION = "readiness-v0.1.0";

export type SmokingStatus = "never" | "former" | "current";
export type BaselineTestStatus = "none" | "scheduled" | "completed";

export type ReadinessInput = {
  sleep?: {
    averageHours: number;
    regularityMinutes: number;
  };
  substances?: {
    smokingStatus: SmokingStatus;
    alcoholUnitsPerWeek: number;
    bingeEpisodes30Days: number;
    cannabisDays30: number;
  };
  diet?: {
    plantVarietyPerWeek: number;
    fruitVegetableServingsPerDay: number;
    fishMealsPerWeek: number;
    processedMeatMealsPerWeek: number;
    sugaryDrinksPerWeek: number;
  };
  activity?: {
    moderateMinutesPerWeek: number;
    sedentaryHoursPerDay: number;
    extremeTrainingDays30: number;
  };
  heat?: {
    saunaHotTubSessions30Days: number;
    occupationalHeatDays30: number;
    laptopOnLapHoursPerWeek: number;
  };
  reproductiveHealth?: {
    baselineTestStatus: BaselineTestStatus;
    ejaculationDaysPerWeek: number;
    sexualFunctionConcern: boolean;
  };
  environment?: {
    heatedPlasticMealsPerWeek: number;
    plasticDrinkContainersPerDay: number;
    occupationalExposureDays30: number;
    ppeUsedConsistently: boolean;
  };
  clinicalFlags?: {
    exogenousTestosterone: boolean;
    anabolicSteroidsOrSarms: boolean;
    chemotherapyOrRadiotherapy: boolean;
    testicularOrObstructionConcern: boolean;
  };
};

type DomainId =
  | "sleep"
  | "substances"
  | "diet"
  | "activity"
  | "heat"
  | "reproductiveHealth"
  | "environment";

type EvidenceLevel =
  | "supported_modifiable_factor"
  | "emerging_association"
  | "measurement_modifier"
  | "clinical_navigation"
  | "general_guidance";

export type FactorScore = {
  factorId: string;
  domain: DomainId;
  label: string;
  awardedPoints: number;
  maximumPoints: number;
  evidenceLevel: EvidenceLevel;
  causal: boolean;
  studiedEndpoints: string[];
  evidenceIds: string[];
  explanation: string;
};

export type DomainScore = {
  domain: DomainId;
  score: number;
  awardedPoints: number;
  availablePoints: number;
};

export type ClinicalGate = {
  gateId: string;
  severity: "prompt" | "priority";
  message: string;
};

export type ScoreChange = {
  comparable: boolean;
  previousScore: number | null;
  currentScore: number;
  delta: number | null;
  reason: string | null;
  entries: Array<{
    factorId: string;
    label: string;
    delta: number;
    evidenceIds: string[];
  }>;
};

export type ReadinessAssessment = {
  score: number;
  confidence: number;
  ruleVersion: typeof READINESS_RULE_VERSION;
  factors: FactorScore[];
  domains: DomainScore[];
  clinicalGates: ClinicalGate[];
  change: ScoreChange | null;
  interpretation: string;
};

const DOMAIN_WEIGHTS: Record<DomainId, number> = {
  sleep: 20,
  substances: 20,
  diet: 15,
  activity: 15,
  heat: 10,
  reproductiveHealth: 10,
  environment: 10,
};

const evidence = {
  sleep: ["sleep-and-semen-andr-2024", "leproult-jama-2011"],
  smoking: ["smoking-meta-analysis-pmid-27113031"],
  alcohol: ["alcohol-meta-analysis-pmid-37159717"],
  cannabis: ["asrm-tobacco-marijuana-2024"],
  diet: ["mediterranean-diet-nma-pmid-40419219"],
  activity: ["exercise-nma-pmc11913713"],
  heat: ["garolla-sauna-2013", "mckinnon-andrology-2022"],
  ejaculation: ["abstinence-nma-pmc12257329"],
  plastics: ["plastic-tableware-microplastics-pmc12512996"],
} as const;

const round1 = (value: number) => Math.round(value * 10) / 10;
const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));
const points = (maximum: number, proportion: number) =>
  round1(maximum * clamp(proportion));

function factor(
  factorId: string,
  domain: DomainId,
  label: string,
  awardedPoints: number,
  maximumPoints: number,
  evidenceLevel: EvidenceLevel,
  studiedEndpoints: string[],
  evidenceIds: readonly string[],
  explanation: string,
  causal = false,
): FactorScore {
  return {
    factorId,
    domain,
    label,
    awardedPoints,
    maximumPoints,
    evidenceLevel,
    causal,
    studiedEndpoints,
    evidenceIds: [...evidenceIds],
    explanation,
  };
}

function scoreSleep(
  input: NonNullable<ReadinessInput["sleep"]>,
): FactorScore[] {
  const duration = input.averageHours >= 7 && input.averageHours <= 9
    ? 1
    : input.averageHours >= 6 && input.averageHours <= 10
    ? 0.65
    : input.averageHours >= 5 && input.averageHours <= 11
    ? 0.3
    : 0;
  const regularity = input.regularityMinutes <= 60
    ? 1
    : input.regularityMinutes <= 90
    ? 0.75
    : input.regularityMinutes <= 120
    ? 0.5
    : input.regularityMinutes <= 180
    ? 0.25
    : 0;
  return [
    factor(
      "sleep_duration",
      "sleep",
      "Sleep duration",
      points(12, duration),
      12,
      "emerging_association",
      ["progressive_motility", "sperm_concentration", "total_sperm_count"],
      evidence.sleep,
      "Population studies associate sleep duration with semen measurements; a wearable does not measure sperm.",
    ),
    factor(
      "sleep_regularity",
      "sleep",
      "Sleep regularity",
      points(8, regularity),
      8,
      "emerging_association",
      ["hormonal_context", "semen_quality"],
      evidence.sleep,
      "Regularity is a modifiable recovery signal. The thresholds are a product hypothesis, not a clinical cut-off.",
    ),
  ];
}

function scoreSubstances(
  input: NonNullable<ReadinessInput["substances"]>,
): FactorScore[] {
  const smoking = input.smokingStatus === "never"
    ? 1
    : input.smokingStatus === "former"
    ? 0.7
    : 0;
  const alcohol = input.bingeEpisodes30Days === 0
    ? 1
    : input.bingeEpisodes30Days === 1
    ? 0.7
    : input.bingeEpisodes30Days <= 3
    ? 0.35
    : 0;
  const cannabis = input.cannabisDays30 === 0
    ? 1
    : input.cannabisDays30 <= 2
    ? 0.65
    : input.cannabisDays30 <= 8
    ? 0.3
    : 0;
  return [
    factor(
      "smoking",
      "substances",
      "Smoking exposure",
      points(10, smoking),
      10,
      "supported_modifiable_factor",
      ["sperm_concentration", "motility", "morphology"],
      evidence.smoking,
      "Smoking has consistent adverse semen associations; recovery is assessed over months, not days.",
    ),
    factor(
      "alcohol_binges",
      "substances",
      "Binge-drinking frequency",
      points(6, alcohol),
      6,
      "emerging_association",
      ["semen_volume", "reproductive_hormones"],
      evidence.alcohol,
      "Heavy or chronic alcohol exposure is more consistently concerning than light intake. These bands are a product hypothesis.",
    ),
    factor(
      "cannabis",
      "substances",
      "Cannabis exposure",
      points(4, cannabis),
      4,
      "emerging_association",
      ["sperm_concentration", "morphology", "reproductive_hormones"],
      evidence.cannabis,
      "Human findings are inconsistent, so cannabis carries fewer readiness points than smoking.",
    ),
  ];
}

function scoreDiet(input: NonNullable<ReadinessInput["diet"]>): FactorScore[] {
  return [
    factor(
      "diet_diversity",
      "diet",
      "Weekly plant diversity",
      points(6, input.plantVarietyPerWeek / 30),
      6,
      "supported_modifiable_factor",
      ["sperm_count", "motility", "morphology"],
      evidence.diet,
      "Dietary-pattern evidence is stronger than evidence for individual foods.",
    ),
    factor(
      "fruit_vegetables",
      "diet",
      "Fruit and vegetable intake",
      points(4, input.fruitVegetableServingsPerDay / 5),
      4,
      "supported_modifiable_factor",
      ["semen_quality"],
      evidence.diet,
      "This contributes to a dietary-pattern score and is not an individualized semen effect estimate.",
    ),
    factor(
      "fish",
      "diet",
      "Fish intake",
      points(2, input.fishMealsPerWeek / 2),
      2,
      "emerging_association",
      ["sperm_concentration", "motility"],
      evidence.diet,
      "Fish intake is one component of a Mediterranean-style pattern.",
    ),
    factor(
      "processed_meat",
      "diet",
      "Processed-meat exposure",
      points(1.5, 1 - input.processedMeatMealsPerWeek / 5),
      1.5,
      "emerging_association",
      ["semen_quality"],
      evidence.diet,
      "Lower exposure earns readiness points; intervention evidence remains limited.",
    ),
    factor(
      "sugary_drinks",
      "diet",
      "Sugar-sweetened drinks",
      points(1.5, 1 - input.sugaryDrinksPerWeek / 7),
      1.5,
      "emerging_association",
      ["semen_quality", "metabolic_health"],
      evidence.diet,
      "Lower exposure supports the overall dietary pattern rather than a promised semen change.",
    ),
  ];
}

function scoreActivity(
  input: NonNullable<ReadinessInput["activity"]>,
): FactorScore[] {
  const activity = input.moderateMinutesPerWeek >= 150 &&
      input.moderateMinutesPerWeek <= 450
    ? 1
    : input.moderateMinutesPerWeek >= 75 &&
        input.moderateMinutesPerWeek <= 600
    ? 0.65
    : input.moderateMinutesPerWeek > 0
    ? 0.3
    : 0;
  return [
    factor(
      "moderate_activity",
      "activity",
      "Moderate activity",
      points(8, activity),
      8,
      "supported_modifiable_factor",
      ["sperm_concentration", "motility", "metabolic_health"],
      evidence.activity,
      "Moderate activity is favoured; the score avoids treating ever-higher training load as better.",
    ),
    factor(
      "sedentary_time",
      "activity",
      "Sedentary time",
      points(4, 1 - (input.sedentaryHoursPerDay - 6) / 6),
      4,
      "emerging_association",
      ["semen_quality", "metabolic_health"],
      evidence.activity,
      "Sitting is a contextual factor and overlaps with metabolic health and heat.",
    ),
    factor(
      "extreme_training",
      "activity",
      "Extreme training load",
      points(3, 1 - input.extremeTrainingDays30 / 12),
      3,
      "emerging_association",
      ["sperm_count", "reproductive_hormones"],
      evidence.activity,
      "Only repeated under-recovered extremes are penalized; ordinary exercise and cycling are not labelled harmful.",
    ),
  ];
}

function scoreHeat(input: NonNullable<ReadinessInput["heat"]>): FactorScore[] {
  return [
    factor(
      "sauna_hot_tub",
      "heat",
      "Sauna and hot-tub exposure",
      points(5, 1 - input.saunaHotTubSessions30Days / 12),
      5,
      "supported_modifiable_factor",
      ["sperm_concentration", "motility"],
      evidence.heat,
      "Repeated heat exposure is modifiable; any measured change requires a follow-up semen analysis.",
    ),
    factor(
      "occupational_heat",
      "heat",
      "Occupational heat",
      points(3, 1 - input.occupationalHeatDays30 / 20),
      3,
      "emerging_association",
      ["semen_quality"],
      evidence.heat,
      "The score is an exposure-reduction indicator and does not account for every workplace control.",
    ),
    factor(
      "laptop_heat",
      "heat",
      "Laptop-on-lap exposure",
      points(2, 1 - input.laptopOnLapHoursPerWeek / 10),
      2,
      "emerging_association",
      ["scrotal_temperature"],
      evidence.heat,
      "This is scored as heat exposure, not radiation.",
    ),
  ];
}

function scoreReproductiveHealth(
  input: NonNullable<ReadinessInput["reproductiveHealth"]>,
): FactorScore[] {
  const baseline = input.baselineTestStatus === "completed"
    ? 1
    : input.baselineTestStatus === "scheduled"
    ? 0.5
    : 0;
  const cadence = input.ejaculationDaysPerWeek >= 2 &&
      input.ejaculationDaysPerWeek <= 7
    ? 1
    : input.ejaculationDaysPerWeek === 1
    ? 0.5
    : 0;
  return [
    factor(
      "baseline_test",
      "reproductiveHealth",
      "Clinical baseline",
      points(4, baseline),
      4,
      "clinical_navigation",
      ["measured_semen_profile"],
      [],
      "A standardized semen analysis measures change; completing one earns navigation points, not biological points.",
    ),
    factor(
      "ejaculation_cadence",
      "reproductiveHealth",
      "Ejaculation cadence",
      points(6, cadence),
      6,
      "measurement_modifier",
      ["motility", "dna_fragmentation", "sample_comparability"],
      evidence.ejaculation,
      "Abstinence affects sample measurements and conception timing; it is not a direct fertility diagnosis.",
    ),
  ];
}

function scoreEnvironment(
  input: NonNullable<ReadinessInput["environment"]>,
): FactorScore[] {
  const occupational = input.occupationalExposureDays30 === 0
    ? 1
    : input.ppeUsedConsistently
    ? 0.75
    : input.occupationalExposureDays30 <= 4
    ? 0.35
    : 0;
  return [
    factor(
      "occupational_exposure",
      "environment",
      "Occupational exposure controls",
      points(6, occupational),
      6,
      "general_guidance",
      ["semen_quality", "reproductive_hormones"],
      [],
      "The indicator rewards exposure controls and PPE awareness; substance-specific risk requires occupational review.",
    ),
    factor(
      "heated_plastic",
      "environment",
      "Heated-plastic food contact",
      points(2, 1 - input.heatedPlasticMealsPerWeek / 7),
      2,
      "emerging_association",
      ["semen_quality", "endocrine_disruption"],
      evidence.plastics,
      "Human evidence is early and no intervention trial converts fewer plastic meals into a semen improvement.",
    ),
    factor(
      "plastic_drinks",
      "environment",
      "Plastic drink-container exposure",
      points(2, 1 - input.plasticDrinkContainersPerDay / 3),
      2,
      "emerging_association",
      ["semen_quality", "microplastic_exposure"],
      evidence.plastics,
      "This is a low-weight exposure-reduction indicator, not a per-bottle biological effect.",
    ),
  ];
}

function clinicalGates(input: ReadinessInput): ClinicalGate[] {
  const flags = input.clinicalFlags;
  if (!flags) return [];
  const gates: ClinicalGate[] = [];
  if (flags.exogenousTestosterone) {
    gates.push({
      gateId: "exogenous_testosterone",
      severity: "priority",
      message:
        "Exogenous testosterone can suppress sperm production. Do not stop prescribed treatment; discuss fertility goals promptly with the prescribing clinician.",
    });
  }
  if (flags.anabolicSteroidsOrSarms) {
    gates.push({
      gateId: "anabolic_steroids_or_sarms",
      severity: "priority",
      message:
        "Anabolic steroids and SARMs can suppress the reproductive axis. Seek clinician-led assessment; the readiness score cannot offset this risk.",
    });
  }
  if (flags.chemotherapyOrRadiotherapy) {
    gates.push({
      gateId: "gonadotoxic_treatment",
      severity: "priority",
      message:
        "Cancer treatment can require urgent fertility-preservation guidance. Contact the treating team or a fertility specialist before treatment when possible.",
    });
  }
  if (flags.testicularOrObstructionConcern) {
    gates.push({
      gateId: "testicular_or_obstruction_concern",
      severity: "priority",
      message:
        "Testicular symptoms, prior torsion, undescended testes, trauma, or possible obstruction require clinical assessment rather than lifestyle scoring alone.",
    });
  }
  if (input.reproductiveHealth?.sexualFunctionConcern) {
    gates.push({
      gateId: "sexual_function_concern",
      severity: "prompt",
      message:
        "Persistent changes in erections, ejaculation, or libido can merit a clinician discussion. They do not directly measure semen quality.",
    });
  }
  return gates;
}

function buildFactors(input: ReadinessInput): FactorScore[] {
  return [
    ...(input.sleep ? scoreSleep(input.sleep) : []),
    ...(input.substances ? scoreSubstances(input.substances) : []),
    ...(input.diet ? scoreDiet(input.diet) : []),
    ...(input.activity ? scoreActivity(input.activity) : []),
    ...(input.heat ? scoreHeat(input.heat) : []),
    ...(input.reproductiveHealth
      ? scoreReproductiveHealth(input.reproductiveHealth)
      : []),
    ...(input.environment ? scoreEnvironment(input.environment) : []),
  ];
}

function calculateScore(factors: FactorScore[]) {
  const awarded = factors.reduce((sum, item) => sum + item.awardedPoints, 0);
  const available = factors.reduce((sum, item) => sum + item.maximumPoints, 0);
  return {
    score: available === 0 ? 0 : Math.round((awarded / available) * 100),
    confidence: Math.round(available),
  };
}

function scoreDomains(factors: FactorScore[]): DomainScore[] {
  return (Object.keys(DOMAIN_WEIGHTS) as DomainId[]).flatMap((domain) => {
    const members = factors.filter((item) => item.domain === domain);
    if (members.length === 0) return [];
    const awardedPoints = round1(
      members.reduce((sum, item) => sum + item.awardedPoints, 0),
    );
    const availablePoints = members.reduce(
      (sum, item) => sum + item.maximumPoints,
      0,
    );
    return [{
      domain,
      score: Math.round((awardedPoints / availablePoints) * 100),
      awardedPoints,
      availablePoints,
    }];
  });
}

function buildChange(
  current: FactorScore[],
  currentScore: number,
  previous: ReadinessAssessment,
): ScoreChange {
  const currentIds = current.map((item) => item.factorId).sort();
  const previousIds = previous.factors.map((item) => item.factorId).sort();
  if (JSON.stringify(currentIds) !== JSON.stringify(previousIds)) {
    return {
      comparable: false,
      previousScore: previous.score,
      currentScore,
      delta: null,
      reason: "INPUT_COVERAGE_CHANGED",
      entries: [],
    };
  }
  const previousById = new Map(
    previous.factors.map((item) => [item.factorId, item]),
  );
  const entries = current.flatMap((item) => {
    const old = previousById.get(item.factorId);
    if (!old) return [];
    const delta = round1(item.awardedPoints - old.awardedPoints);
    return delta === 0 ? [] : [{
      factorId: item.factorId,
      label: item.label,
      delta,
      evidenceIds: item.evidenceIds,
    }];
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return {
    comparable: true,
    previousScore: previous.score,
    currentScore,
    delta: currentScore - previous.score,
    reason: null,
    entries,
  };
}

export function assessReadiness(
  input: ReadinessInput,
  previous?: ReadinessAssessment,
): ReadinessAssessment {
  const factors = buildFactors(input);
  const { score, confidence } = calculateScore(factors);
  return {
    score,
    confidence,
    ruleVersion: READINESS_RULE_VERSION,
    factors,
    domains: scoreDomains(factors),
    clinicalGates: clinicalGates(input),
    change: previous ? buildChange(factors, score, previous) : null,
    interpretation:
      "This is a modifiable-readiness score, not a fertility percentage or a claim that semen quality changed. A follow-up standardized semen analysis is required to measure change.",
  };
}

const exactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  errors: string[],
) => {
  const allowedKeys = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) errors.push(`${path}.${key} is not supported`);
  }
};

const finiteRange = (
  value: unknown,
  minimum: number,
  maximum: number,
  path: string,
  errors: string[],
) => {
  if (
    typeof value !== "number" || !Number.isFinite(value) || value < minimum ||
    value > maximum
  ) {
    errors.push(`${path} must be a number from ${minimum} to ${maximum}`);
  }
};

export function validateReadinessInput(value: unknown): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return ["inputs must be an object"];
  }
  const input = value as Record<string, unknown>;
  const errors: string[] = [];
  exactKeys(
    input,
    [
      "sleep",
      "substances",
      "diet",
      "activity",
      "heat",
      "reproductiveHealth",
      "environment",
      "clinicalFlags",
    ],
    "inputs",
    errors,
  );
  const group = (
    name: string,
    keys: readonly string[],
    validate: (record: Record<string, unknown>) => void,
  ) => {
    const raw = input[name];
    if (raw === undefined) return;
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      errors.push(`inputs.${name} must be an object`);
      return;
    }
    const record = raw as Record<string, unknown>;
    exactKeys(record, keys, `inputs.${name}`, errors);
    for (const key of keys) {
      if (!(key in record)) errors.push(`inputs.${name}.${key} is required`);
    }
    validate(record);
  };
  group("sleep", ["averageHours", "regularityMinutes"], (record) => {
    finiteRange(
      record.averageHours,
      0,
      24,
      "inputs.sleep.averageHours",
      errors,
    );
    finiteRange(
      record.regularityMinutes,
      0,
      720,
      "inputs.sleep.regularityMinutes",
      errors,
    );
  });
  group(
    "substances",
    [
      "smokingStatus",
      "alcoholUnitsPerWeek",
      "bingeEpisodes30Days",
      "cannabisDays30",
    ],
    (record) => {
      if (
        !["never", "former", "current"].includes(String(record.smokingStatus))
      ) {
        errors.push(
          "inputs.substances.smokingStatus must be never, former, or current",
        );
      }
      finiteRange(
        record.alcoholUnitsPerWeek,
        0,
        300,
        "inputs.substances.alcoholUnitsPerWeek",
        errors,
      );
      finiteRange(
        record.bingeEpisodes30Days,
        0,
        30,
        "inputs.substances.bingeEpisodes30Days",
        errors,
      );
      finiteRange(
        record.cannabisDays30,
        0,
        30,
        "inputs.substances.cannabisDays30",
        errors,
      );
    },
  );
  group(
    "diet",
    [
      "plantVarietyPerWeek",
      "fruitVegetableServingsPerDay",
      "fishMealsPerWeek",
      "processedMeatMealsPerWeek",
      "sugaryDrinksPerWeek",
    ],
    (record) => {
      finiteRange(
        record.plantVarietyPerWeek,
        0,
        100,
        "inputs.diet.plantVarietyPerWeek",
        errors,
      );
      finiteRange(
        record.fruitVegetableServingsPerDay,
        0,
        30,
        "inputs.diet.fruitVegetableServingsPerDay",
        errors,
      );
      finiteRange(
        record.fishMealsPerWeek,
        0,
        21,
        "inputs.diet.fishMealsPerWeek",
        errors,
      );
      finiteRange(
        record.processedMeatMealsPerWeek,
        0,
        21,
        "inputs.diet.processedMeatMealsPerWeek",
        errors,
      );
      finiteRange(
        record.sugaryDrinksPerWeek,
        0,
        70,
        "inputs.diet.sugaryDrinksPerWeek",
        errors,
      );
    },
  );
  group(
    "activity",
    ["moderateMinutesPerWeek", "sedentaryHoursPerDay", "extremeTrainingDays30"],
    (record) => {
      finiteRange(
        record.moderateMinutesPerWeek,
        0,
        2_000,
        "inputs.activity.moderateMinutesPerWeek",
        errors,
      );
      finiteRange(
        record.sedentaryHoursPerDay,
        0,
        24,
        "inputs.activity.sedentaryHoursPerDay",
        errors,
      );
      finiteRange(
        record.extremeTrainingDays30,
        0,
        30,
        "inputs.activity.extremeTrainingDays30",
        errors,
      );
    },
  );
  group(
    "heat",
    [
      "saunaHotTubSessions30Days",
      "occupationalHeatDays30",
      "laptopOnLapHoursPerWeek",
    ],
    (record) => {
      finiteRange(
        record.saunaHotTubSessions30Days,
        0,
        60,
        "inputs.heat.saunaHotTubSessions30Days",
        errors,
      );
      finiteRange(
        record.occupationalHeatDays30,
        0,
        30,
        "inputs.heat.occupationalHeatDays30",
        errors,
      );
      finiteRange(
        record.laptopOnLapHoursPerWeek,
        0,
        168,
        "inputs.heat.laptopOnLapHoursPerWeek",
        errors,
      );
    },
  );
  group(
    "reproductiveHealth",
    ["baselineTestStatus", "ejaculationDaysPerWeek", "sexualFunctionConcern"],
    (record) => {
      if (
        !["none", "scheduled", "completed"].includes(
          String(record.baselineTestStatus),
        )
      ) {
        errors.push(
          "inputs.reproductiveHealth.baselineTestStatus must be none, scheduled, or completed",
        );
      }
      finiteRange(
        record.ejaculationDaysPerWeek,
        0,
        7,
        "inputs.reproductiveHealth.ejaculationDaysPerWeek",
        errors,
      );
      if (typeof record.sexualFunctionConcern !== "boolean") {
        errors.push(
          "inputs.reproductiveHealth.sexualFunctionConcern must be boolean",
        );
      }
    },
  );
  group(
    "environment",
    [
      "heatedPlasticMealsPerWeek",
      "plasticDrinkContainersPerDay",
      "occupationalExposureDays30",
      "ppeUsedConsistently",
    ],
    (record) => {
      finiteRange(
        record.heatedPlasticMealsPerWeek,
        0,
        21,
        "inputs.environment.heatedPlasticMealsPerWeek",
        errors,
      );
      finiteRange(
        record.plasticDrinkContainersPerDay,
        0,
        20,
        "inputs.environment.plasticDrinkContainersPerDay",
        errors,
      );
      finiteRange(
        record.occupationalExposureDays30,
        0,
        30,
        "inputs.environment.occupationalExposureDays30",
        errors,
      );
      if (typeof record.ppeUsedConsistently !== "boolean") {
        errors.push(
          "inputs.environment.ppeUsedConsistently must be boolean",
        );
      }
    },
  );
  group(
    "clinicalFlags",
    [
      "exogenousTestosterone",
      "anabolicSteroidsOrSarms",
      "chemotherapyOrRadiotherapy",
      "testicularOrObstructionConcern",
    ],
    (record) => {
      for (
        const key of [
          "exogenousTestosterone",
          "anabolicSteroidsOrSarms",
          "chemotherapyOrRadiotherapy",
          "testicularOrObstructionConcern",
        ]
      ) {
        if (typeof record[key] !== "boolean") {
          errors.push(`inputs.clinicalFlags.${key} must be boolean`);
        }
      }
    },
  );
  if (
    ![
      "sleep",
      "substances",
      "diet",
      "activity",
      "heat",
      "reproductiveHealth",
      "environment",
    ].some((key) => input[key] !== undefined)
  ) {
    errors.push("at least one scored input domain is required");
  }
  return errors;
}
