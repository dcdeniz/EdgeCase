import type { EvidenceMatch } from "./rag.ts";

export const DATA_ENGINE_PROMPT_VERSION = "preseed-data-engine-2";

export type NormalizedMeasurement = {
  code: string;
  value: number;
  unit: string;
  verification: string;
  referenceLow: number | null;
  referenceHigh: number | null;
  referenceContext:
    | "below_reference"
    | "within_reference"
    | "above_reference"
    | "no_reference";
  derived: boolean;
};

export type WearableDailyRow = {
  observed_on: string;
  source: string;
  sleep_minutes: number | null;
  steps: number | null;
  active_minutes: number | null;
  resting_heart_rate: number | null;
};

export type CompactWearableContext = {
  provenance: "Google Health";
  role: "contextual_signal_only";
  windowDays: number;
  observedFrom: string;
  observedThrough: string;
  sleep: { meanMinutes: number | null; daysObserved: number };
  steps: { meanPerDay: number | null; daysObserved: number };
  activeMinutes: { meanPerDay: number | null; daysObserved: number };
  restingHeartRate: { meanBpm: number | null; daysObserved: number };
};

export const SCORE_FACTOR_DOMAINS = [
  "cigarette smoking and cumulative exposure",
  "heavy or chronic alcohol exposure",
  "obesity, central adiposity, insulin resistance, diabetes, and metabolic syndrome",
  "poor sleep, sleep disorders, and circadian disruption",
  "physical inactivity and sustained high-load or under-recovered training",
  "recurrent substantial heat exposure and recent high fever",
  "healthier versus Western-style dietary patterns",
  "occupational lead, pesticide, solvent, ionising-radiation, and air-pollution exposure",
  "severe energy restriction or metabolic disruption",
] as const;

export type CollectionContext = {
  testType: string;
  abstinenceHours: number | null;
  collectionComplete: boolean | null;
  recentFever: boolean | null;
};

export function compactWearableContext(
  input: WearableDailyRow[],
): CompactWearableContext | null {
  const rows = input.filter((row) => row.source === "google_health")
    .sort((left, right) => right.observed_on.localeCompare(left.observed_on))
    .slice(0, 14)
    .sort((left, right) => left.observed_on.localeCompare(right.observed_on));
  if (rows.length === 0) return null;
  const aggregate = (values: Array<number | null>) => {
    const observed = values.filter((value): value is number => value != null);
    return {
      mean: observed.length === 0
        ? null
        : Number((observed.reduce((sum, value) => sum + value, 0) / observed.length).toFixed(1)),
      daysObserved: observed.length,
    };
  };
  const sleep = aggregate(rows.map((row) => row.sleep_minutes));
  const steps = aggregate(rows.map((row) => row.steps));
  const active = aggregate(rows.map((row) => row.active_minutes));
  const heart = aggregate(rows.map((row) => row.resting_heart_rate));
  return {
    provenance: "Google Health",
    role: "contextual_signal_only",
    windowDays: rows.length,
    observedFrom: rows[0].observed_on,
    observedThrough: rows.at(-1)!.observed_on,
    sleep: { meanMinutes: sleep.mean, daysObserved: sleep.daysObserved },
    steps: { meanPerDay: steps.mean, daysObserved: steps.daysObserved },
    activeMinutes: { meanPerDay: active.mean, daysObserved: active.daysObserved },
    restingHeartRate: { meanBpm: heart.mean, daysObserved: heart.daysObserved },
  };
}

export type SemenProfileSynthesis = {
  summary: string;
  parameterContexts: Array<{
    markerCode: string;
    emphasis: string;
    mechanisms: string[];
    improvementOpportunities: string[];
    evidenceIds: string[];
    clinicalEscalation: boolean;
  }>;
  protocolSuggestions: Array<{
    category:
      | "nutrition"
      | "exercise"
      | "sleep"
      | "supplement"
      | "exposure"
      | "lifestyle"
      | "clinical_navigation";
    title: string;
    rationale: string;
    evidenceStatus: "evidence_backed" | "general_guidance";
    evidenceIds: string[];
  }>;
  collectionCautions: string[];
  missingInputs: string[];
  clinicalEscalations: string[];
  limitations: string[];
};

export const semenProfileSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "parameterContexts",
    "protocolSuggestions",
    "collectionCautions",
    "missingInputs",
    "clinicalEscalations",
    "limitations",
  ],
  properties: {
    summary: { type: "string", minLength: 1, maxLength: 1200 },
    parameterContexts: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "markerCode",
          "emphasis",
          "mechanisms",
          "improvementOpportunities",
          "evidenceIds",
          "clinicalEscalation",
        ],
        properties: {
          markerCode: { type: "string" },
          emphasis: { type: "string", maxLength: 400 },
          mechanisms: {
            type: "array",
            maxItems: 5,
            items: { type: "string", maxLength: 300 },
          },
          improvementOpportunities: {
            type: "array",
            maxItems: 6,
            items: { type: "string", maxLength: 300 },
          },
          evidenceIds: {
            type: "array",
            maxItems: 8,
            items: { type: "string" },
          },
          clinicalEscalation: { type: "boolean" },
        },
      },
    },
    protocolSuggestions: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "category",
          "title",
          "rationale",
          "evidenceStatus",
          "evidenceIds",
        ],
        properties: {
          category: {
            type: "string",
            enum: [
              "nutrition",
              "exercise",
              "sleep",
              "supplement",
              "exposure",
              "lifestyle",
              "clinical_navigation",
            ],
          },
          title: { type: "string", maxLength: 200 },
          rationale: { type: "string", maxLength: 600 },
          evidenceStatus: {
            type: "string",
            enum: ["evidence_backed", "general_guidance"],
          },
          evidenceIds: {
            type: "array",
            maxItems: 8,
            items: { type: "string" },
          },
        },
      },
    },
    collectionCautions: {
      type: "array",
      maxItems: 8,
      items: { type: "string", maxLength: 300 },
    },
    missingInputs: {
      type: "array",
      maxItems: 20,
      items: { type: "string", maxLength: 100 },
    },
    clinicalEscalations: {
      type: "array",
      maxItems: 8,
      items: { type: "string", maxLength: 400 },
    },
    limitations: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string", maxLength: 400 },
    },
  },
} as const;

export function retrievalQueries(
  context: {
    track: string;
    measurements: NormalizedMeasurement[];
    onboarding: unknown;
    collection?: CollectionContext[];
    wearable?: CompactWearableContext | null;
  },
) {
  const factorQuery =
    `Find human evidence relevant to the observed modifiable-readiness factors in this account context. ` +
    `Evaluate only supported inputs; missing factors reduce coverage and must not be treated as healthy or unhealthy. ` +
    `Candidate domains: ${SCORE_FACTOR_DOMAINS.join("; ")}. ` +
    `Account context: ${JSON.stringify(context.onboarding)}. ` +
    `Collection context: ${JSON.stringify(context.collection ?? [])}.`;
  const global =
    `Male fertility evidence for a ${context.track} profile with measured semen and hormone results. Consider interacting causes, collection conditions, safety escalation, and modifiable factors. Wearable information, when present, is contextual only and cannot establish a semen effect, hormone level, diagnosis, or fertility outcome. Context: ${
      JSON.stringify(context.onboarding)
    }. Wearable context: ${JSON.stringify(context.wearable ?? null)}`;
  return [
    global,
    factorQuery,
    ...context.measurements.map((measurement) =>
      `${measurement.code} is ${measurement.referenceContext}. Find human evidence about this exact endpoint, mechanisms, limitations, modifiable factors, and when clinical review is appropriate.`
    ),
  ];
}

export function fuseEvidence(
  groups: EvidenceMatch[][],
  limit = 8,
): EvidenceMatch[] {
  const fused = new Map<string, { match: EvidenceMatch; score: number }>();
  groups.forEach((group) =>
    group.forEach((match, rank) => {
      const score = match.similarity + 0.08 / (rank + 1);
      const previous = fused.get(match.id);
      if (!previous || score > previous.score) {
        fused.set(match.id, { match, score });
      }
    })
  );
  return [...fused.values()].sort((a, b) => b.score - a.score).slice(0, limit)
    .map(({ match }) => match);
}

export function validateSemenProfile(
  value: unknown,
  markerCodes: Set<string>,
  evidenceIds: Set<string>,
): value is SemenProfileSynthesis {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const profile = value as Record<string, unknown>;
  if (
    typeof profile.summary !== "string" || profile.summary.length < 1 ||
    profile.summary.length > 1200
  ) return false;
  if (
    !Array.isArray(profile.parameterContexts) ||
    !Array.isArray(profile.protocolSuggestions)
  ) return false;
  const idsValid = (ids: unknown, allowEmpty = true) =>
    Array.isArray(ids) && (allowEmpty || ids.length > 0) && ids.length <= 8 &&
    ids.every((id) => typeof id === "string" && evidenceIds.has(id));
  if (
    !profile.parameterContexts.every((raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
      const item = raw as Record<string, unknown>;
      return typeof item.markerCode === "string" &&
        markerCodes.has(item.markerCode) && typeof item.emphasis === "string" &&
        Array.isArray(item.mechanisms) &&
        Array.isArray(item.improvementOpportunities) &&
        idsValid(item.evidenceIds) &&
        typeof item.clinicalEscalation === "boolean";
    })
  ) return false;
  if (
    !profile.protocolSuggestions.every((raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
      const item = raw as Record<string, unknown>;
      const validIds = idsValid(item.evidenceIds);
      return typeof item.title === "string" &&
        typeof item.rationale === "string" &&
        ["evidence_backed", "general_guidance"].includes(
          String(item.evidenceStatus),
        ) && validIds &&
        (item.evidenceStatus !== "evidence_backed" ||
          (item.evidenceIds as unknown[]).length > 0);
    })
  ) return false;
  return [
    "collectionCautions",
    "missingInputs",
    "clinicalEscalations",
    "limitations",
  ].every((key) => Array.isArray(profile[key])) &&
    (profile.limitations as unknown[]).length > 0;
}
