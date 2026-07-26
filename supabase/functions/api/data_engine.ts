import type { EvidenceMatch } from "./rag.ts";

export const DATA_ENGINE_PROMPT_VERSION = "preseed-data-engine-1";

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
  },
) {
  const global =
    `Male fertility evidence for a ${context.track} profile with measured semen and hormone results. Consider interacting causes, collection conditions, safety escalation, and modifiable factors. Context: ${
      JSON.stringify(context.onboarding)
    }`;
  return [
    global,
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
