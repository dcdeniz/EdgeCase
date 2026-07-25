/**
 * Clinical presentation model.
 *
 * This module holds no scoring and no prediction. It describes measured
 * markers, the versioned reference sets they are read against, and the
 * vocabulary used to label them. Reference limits are attributed, versioned
 * and never rendered as a pass/fail verdict.
 *
 * Contract alignment: marker codes and verification values match
 * `docs/project/contracts/http/openapi.yaml` (MarkerInput) and the
 * `clinical_markers` check constraint in the product-domain migration.
 */

export type MarkerCode =
  | "volume_ml"
  | "concentration_million_ml"
  | "total_count_million"
  | "progressive_motility_pct"
  | "total_motility_pct"
  | "normal_morphology_pct"
  | "dna_fragmentation_pct"
  | "fsh_iu_l"
  | "lh_iu_l"
  | "total_testosterone_nmol_l"
  | "free_testosterone_nmol_l"
  | "estradiol_pmol_l"
  | "prolactin_miu_l"
  | "shbg_nmol_l"
  | "tsh_miu_l";

export type TestType = "semen_analysis" | "hormone_panel";
export type TestSource = "manual" | "upload" | "simulated";
export type Verification = "user_entered" | "user_confirmed" | "lab_report";

/** How a marker's reference interval is bounded. */
export type ReferenceShape = "lower_limit" | "upper_limit" | "interval";

export type ReferenceSet = {
  id: string;
  label: string;
  attribution: string;
  sourceUrl: string;
  note: string;
};

/**
 * Semen reference limits come from a published, versioned manual. Hormone
 * intervals are assay-specific and therefore supplied by the reporting
 * laboratory, never asserted by PreSeed.
 */
export const referenceSets: Record<string, ReferenceSet> = {
  "who-6e": {
    id: "who-6e",
    label: "WHO 6th edition",
    attribution: "WHO laboratory manual for the examination and processing of human semen, 6th edition",
    sourceUrl: "https://www.who.int/publications/i/item/9789240030787",
    note:
      "Lower reference limits are the 5th centile of a reference population of recent fathers. They describe a distribution, not a fertile/infertile boundary.",
  },
  "lab-supplied": {
    id: "lab-supplied",
    label: "Laboratory-supplied",
    attribution: "Interval reported by the analysing laboratory",
    sourceUrl: "",
    note:
      "Hormone intervals depend on the assay and platform used. PreSeed shows the interval the reporting laboratory supplied and does not substitute its own.",
  },
};

export type MarkerDefinition = {
  code: MarkerCode;
  label: string;
  shortLabel: string;
  unit: string;
  /** Rendered unit for screen readers, since superscripts do not speak well. */
  unitSpoken: string;
  panel: TestType;
  referenceSet: string;
  shape: ReferenceShape;
  referenceLow: number | null;
  referenceHigh: number | null;
  decimals: number;
  /** Plain-language description of what the marker measures. */
  meaning: string;
  /** Present only for markers requiring a specialist assay. */
  specialistOnly?: boolean;
};

export const markerCatalogue: Record<MarkerCode, MarkerDefinition> = {
  volume_ml: {
    code: "volume_ml",
    label: "Semen volume",
    shortLabel: "Volume",
    unit: "mL",
    unitSpoken: "millilitres",
    panel: "semen_analysis",
    referenceSet: "who-6e",
    shape: "lower_limit",
    referenceLow: 1.4,
    referenceHigh: null,
    decimals: 1,
    meaning: "The total volume of the ejaculate. Low volume can also mean part of the sample was lost during collection.",
  },
  concentration_million_ml: {
    code: "concentration_million_ml",
    label: "Sperm concentration",
    shortLabel: "Concentration",
    unit: "×10⁶/mL",
    unitSpoken: "million per millilitre",
    panel: "semen_analysis",
    referenceSet: "who-6e",
    shape: "lower_limit",
    referenceLow: 16,
    referenceHigh: null,
    decimals: 1,
    meaning: "How many sperm are present per millilitre. Reflects spermatogenic output and the hormonal axis that drives it.",
  },
  total_count_million: {
    code: "total_count_million",
    label: "Total sperm number",
    shortLabel: "Total count",
    unit: "×10⁶",
    unitSpoken: "million",
    panel: "semen_analysis",
    referenceSet: "who-6e",
    shape: "lower_limit",
    referenceLow: 39,
    referenceHigh: null,
    decimals: 1,
    meaning: "Concentration multiplied by volume. Usually the more informative of the two for overall output.",
  },
  progressive_motility_pct: {
    code: "progressive_motility_pct",
    label: "Progressive motility",
    shortLabel: "Prog. motility",
    unit: "%",
    unitSpoken: "percent",
    panel: "semen_analysis",
    referenceSet: "who-6e",
    shape: "lower_limit",
    referenceLow: 30,
    referenceHigh: null,
    decimals: 0,
    meaning: "The share of sperm moving purposefully forward. Depends on the mitochondria powering the tail.",
  },
  total_motility_pct: {
    code: "total_motility_pct",
    label: "Total motility",
    shortLabel: "Total motility",
    unit: "%",
    unitSpoken: "percent",
    panel: "semen_analysis",
    referenceSet: "who-6e",
    shape: "lower_limit",
    referenceLow: 42,
    referenceHigh: null,
    decimals: 0,
    meaning: "The share of sperm moving at all, including non-progressive movement.",
  },
  normal_morphology_pct: {
    code: "normal_morphology_pct",
    label: "Normal morphology",
    shortLabel: "Morphology",
    unit: "%",
    unitSpoken: "percent",
    panel: "semen_analysis",
    referenceSet: "who-6e",
    shape: "lower_limit",
    referenceLow: 4,
    referenceHigh: null,
    decimals: 0,
    meaning: "The share of sperm with normally formed heads and tails. Strict criteria mean low percentages are expected.",
  },
  dna_fragmentation_pct: {
    code: "dna_fragmentation_pct",
    label: "DNA fragmentation index",
    shortLabel: "DNA fragmentation",
    unit: "%",
    unitSpoken: "percent",
    panel: "semen_analysis",
    referenceSet: "lab-supplied",
    shape: "upper_limit",
    referenceLow: null,
    referenceHigh: 30,
    decimals: 0,
    specialistOnly: true,
    meaning: "The share of sperm carrying fragmented DNA. Requires a specialist assay and is reported against that laboratory's own threshold.",
  },
  fsh_iu_l: {
    code: "fsh_iu_l",
    label: "Follicle-stimulating hormone",
    shortLabel: "FSH",
    unit: "IU/L",
    unitSpoken: "international units per litre",
    panel: "hormone_panel",
    referenceSet: "lab-supplied",
    shape: "interval",
    referenceLow: 1.5,
    referenceHigh: 12.4,
    decimals: 1,
    meaning: "Signals the testes to produce sperm. Read alongside LH and testosterone, never alone.",
  },
  lh_iu_l: {
    code: "lh_iu_l",
    label: "Luteinising hormone",
    shortLabel: "LH",
    unit: "IU/L",
    unitSpoken: "international units per litre",
    panel: "hormone_panel",
    referenceSet: "lab-supplied",
    shape: "interval",
    referenceLow: 1.7,
    referenceHigh: 8.6,
    decimals: 1,
    meaning: "Signals testosterone production in the testes.",
  },
  total_testosterone_nmol_l: {
    code: "total_testosterone_nmol_l",
    label: "Total testosterone",
    shortLabel: "Total testosterone",
    unit: "nmol/L",
    unitSpoken: "nanomoles per litre",
    panel: "hormone_panel",
    referenceSet: "lab-supplied",
    shape: "interval",
    referenceLow: 8.6,
    referenceHigh: 29,
    decimals: 1,
    meaning: "Required for sperm production. Sensitive to the time of day the sample was taken.",
  },
  free_testosterone_nmol_l: {
    code: "free_testosterone_nmol_l",
    label: "Free testosterone",
    shortLabel: "Free testosterone",
    unit: "nmol/L",
    unitSpoken: "nanomoles per litre",
    panel: "hormone_panel",
    referenceSet: "lab-supplied",
    shape: "interval",
    referenceLow: 0.2,
    referenceHigh: 0.62,
    decimals: 2,
    meaning: "The unbound fraction of testosterone, calculated or measured depending on the laboratory.",
  },
  estradiol_pmol_l: {
    code: "estradiol_pmol_l",
    label: "Estradiol",
    shortLabel: "Estradiol",
    unit: "pmol/L",
    unitSpoken: "picomoles per litre",
    panel: "hormone_panel",
    referenceSet: "lab-supplied",
    shape: "interval",
    referenceLow: 41,
    referenceHigh: 159,
    decimals: 0,
    meaning: "Produced partly by converting testosterone. Context for the hormonal picture, not a target to adjust.",
  },
  prolactin_miu_l: {
    code: "prolactin_miu_l",
    label: "Prolactin",
    shortLabel: "Prolactin",
    unit: "mIU/L",
    unitSpoken: "milli-international units per litre",
    panel: "hormone_panel",
    referenceSet: "lab-supplied",
    shape: "interval",
    referenceLow: 86,
    referenceHigh: 324,
    decimals: 0,
    meaning: "Raised prolactin has clinical causes that need a clinician, not a lifestyle change.",
  },
  shbg_nmol_l: {
    code: "shbg_nmol_l",
    label: "Sex hormone-binding globulin",
    shortLabel: "SHBG",
    unit: "nmol/L",
    unitSpoken: "nanomoles per litre",
    panel: "hormone_panel",
    referenceSet: "lab-supplied",
    shape: "interval",
    referenceLow: 18.3,
    referenceHigh: 54.1,
    decimals: 1,
    meaning: "Binds testosterone in the blood, so it changes how total testosterone should be read.",
  },
  tsh_miu_l: {
    code: "tsh_miu_l",
    label: "Thyroid-stimulating hormone",
    shortLabel: "TSH",
    unit: "mIU/L",
    unitSpoken: "milli-international units per litre",
    panel: "hormone_panel",
    referenceSet: "lab-supplied",
    shape: "interval",
    referenceLow: 0.27,
    referenceHigh: 4.2,
    decimals: 2,
    meaning: "Screens thyroid function, which can affect reproductive health indirectly.",
  },
};

export const semenMarkerOrder: MarkerCode[] = [
  "volume_ml",
  "concentration_million_ml",
  "total_count_million",
  "progressive_motility_pct",
  "total_motility_pct",
  "normal_morphology_pct",
  "dna_fragmentation_pct",
];

export const hormoneMarkerOrder: MarkerCode[] = [
  "fsh_iu_l",
  "lh_iu_l",
  "total_testosterone_nmol_l",
  "free_testosterone_nmol_l",
  "estradiol_pmol_l",
  "prolactin_miu_l",
  "shbg_nmol_l",
  "tsh_miu_l",
];

/* ==========================================================================
   Reference context
   --------------------------------------------------------------------------
   The approved vocabulary. "Below reference context" is not "abnormal", and
   never "bad", "failing" or "infertile".
   ========================================================================== */

export type ReferenceContext =
  | "within_reference"
  | "below_reference"
  | "above_reference"
  | "no_reference"
  | "not_measured";

export const referenceContextLabel: Record<ReferenceContext, string> = {
  within_reference: "Within reference context",
  below_reference: "Below reference context",
  above_reference: "Above reference context",
  no_reference: "No reference interval supplied",
  not_measured: "Not measured",
};

export type MarkerValue = {
  code: MarkerCode;
  value: number;
  unit: string;
  verification: Verification;
  /** Laboratory-supplied interval, when the report carried one. */
  referenceLow?: number | null;
  referenceHigh?: number | null;
};

export type ClinicalTest = {
  id: string;
  testType: TestType;
  source: TestSource;
  collectedAt: string;
  labName: string | null;
  abstinenceHours: number | null;
  collectionComplete: boolean | null;
  recentFever: boolean;
  notes: string | null;
  markers: MarkerValue[];
  /** True when a semen result was recorded as zero or unmeasurably low. */
  reportedAsZero?: boolean;
};

/** Effective interval: a laboratory-supplied interval always wins. */
export function effectiveReference(marker: MarkerValue) {
  const definition = markerCatalogue[marker.code];
  const low = marker.referenceLow ?? definition.referenceLow;
  const high = marker.referenceHigh ?? definition.referenceHigh;
  const supplied = marker.referenceLow != null || marker.referenceHigh != null;
  return {
    low,
    high,
    shape: definition.shape,
    setId: supplied ? "lab-supplied" : definition.referenceSet,
  };
}

export function referenceContextOf(marker: MarkerValue): ReferenceContext {
  const { low, high, shape } = effectiveReference(marker);
  if (low == null && high == null) return "no_reference";
  if (shape === "lower_limit" && low != null) {
    return marker.value < low ? "below_reference" : "within_reference";
  }
  if (shape === "upper_limit" && high != null) {
    return marker.value > high ? "above_reference" : "within_reference";
  }
  if (low != null && marker.value < low) return "below_reference";
  if (high != null && marker.value > high) return "above_reference";
  return "within_reference";
}

/** Attention is drawn by position relative to a reference, not by judgement. */
export function referenceContextTone(context: ReferenceContext) {
  switch (context) {
    case "within_reference":
      return "supported" as const;
    case "below_reference":
    case "above_reference":
      return "attention" as const;
    default:
      return "unavailable" as const;
  }
}

export const verificationLabel: Record<Verification, string> = {
  user_entered: "Entered by you",
  user_confirmed: "Confirmed by you",
  lab_report: "From lab report",
};

export const sourceLabel: Record<TestSource, string> = {
  manual: "Manual entry",
  upload: "Uploaded report",
  simulated: "Simulated",
};

/* ==========================================================================
   Collection comparability
   --------------------------------------------------------------------------
   Feedforward, not hindsight. Two tests are only comparable when collection
   conditions are close enough, and the user is told this before entry.
   ========================================================================== */

export type ComparabilityIssue = {
  label: string;
  detail: string;
  severity: "note" | "caution";
};

export function comparabilityIssues(
  baseline: ClinicalTest,
  latest: ClinicalTest,
): ComparabilityIssue[] {
  const issues: ComparabilityIssue[] = [];

  if (baseline.abstinenceHours != null && latest.abstinenceHours != null) {
    const delta = Math.abs(baseline.abstinenceHours - latest.abstinenceHours);
    if (delta > 24) {
      issues.push({
        label: "Abstinence differs",
        detail: `${delta} hours apart. Abstinence duration changes volume and concentration independently of reproductive health.`,
        severity: "caution",
      });
    }
  } else {
    issues.push({
      label: "Abstinence not recorded",
      detail: "Without abstinence duration for both samples, volume and concentration cannot be compared reliably.",
      severity: "caution",
    });
  }

  if (latest.collectionComplete === false || baseline.collectionComplete === false) {
    issues.push({
      label: "Incomplete collection",
      detail: "One sample was recorded as incomplete. Volume and total count will read low for collection reasons.",
      severity: "caution",
    });
  }

  if (latest.recentFever || baseline.recentFever) {
    issues.push({
      label: "Recent fever or illness",
      detail: "Fever can suppress production for weeks. A drop after illness may reflect the illness, not a trend.",
      severity: "caution",
    });
  }

  if (baseline.labName !== latest.labName) {
    issues.push({
      label: "Different laboratory",
      detail: "Laboratories differ in method and technician. Cross-lab differences can be as large as real change.",
      severity: "caution",
    });
  }

  if (baseline.source !== latest.source) {
    issues.push({
      label: "Different provenance",
      detail: `One result is ${sourceLabel[baseline.source].toLowerCase()} and the other is ${sourceLabel[latest.source].toLowerCase()}.`,
      severity: "note",
    });
  }

  return issues;
}

/**
 * Sample-to-sample variability within the same man is substantial. This band
 * is a presentation device that keeps small movements from reading as change;
 * it is not a measurement error model.
 */
export const NATURAL_VARIABILITY_FRACTION = 0.25;

export function changeExceedsVariability(from: number, to: number) {
  if (from === 0) return false;
  return Math.abs(to - from) / from > NATURAL_VARIABILITY_FRACTION;
}
