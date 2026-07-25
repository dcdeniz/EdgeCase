/**
 * Prototype fixtures.
 *
 * Everything here is demonstration content for a design prototype. Clinical
 * values are simulated and labelled as such everywhere they surface. Evidence
 * entries carry their real source and their real review status — nothing is
 * presented as clinically approved, because nothing has been clinically
 * reviewed. Effect figures supplied in the product brief but not yet traced to
 * a paper are marked `research_candidate` and are excluded from recommendations
 * by construction.
 */

import type { ClinicalTest, MarkerCode } from "@/lib/clinical";
import type { DomainId } from "@/lib/readiness";

/* ==========================================================================
   Evidence registry
   ========================================================================== */

export type ReviewStatus = "internal_review" | "clinical_review_pending" | "research_candidate";

export const reviewStatusLabel: Record<ReviewStatus, string> = {
  internal_review: "Internal review complete",
  clinical_review_pending: "Clinical review pending",
  research_candidate: "Research candidate — not used for recommendations",
};

export type EvidenceConfidence = "moderate" | "limited" | "emerging" | "insufficient";

export const confidenceLabel: Record<EvidenceConfidence, string> = {
  moderate: "Moderate confidence",
  limited: "Limited confidence",
  emerging: "Emerging — early evidence",
  insufficient: "Insufficient for scoring",
};

export type EvidenceClaim = {
  id: string;
  claim: string;
  endpoints: string[];
  studyType: string;
  population: string;
  direction: "favourable" | "adverse" | "measurement" | "context";
  confidence: EvidenceConfidence;
  causal: boolean;
  limitations: string[];
  source: string;
  sourceUrl: string;
  lastReviewed: string;
  reviewStatus: ReviewStatus;
  domains: DomainId[];
};

export const evidence: EvidenceClaim[] = [
  {
    id: "sleep-circadian-sr",
    claim: "Poor sleep duration, quality and circadian disruption are associated with lower semen measurements.",
    endpoints: ["Sperm concentration", "Total sperm count", "Total motile count"],
    studyType: "Systematic review and meta-analysis of observational studies",
    population: "Adult men across multiple cohorts, including fertility-clinic and preconception samples",
    direction: "adverse",
    confidence: "moderate",
    causal: false,
    limitations: [
      "Observational. Sleep, stress, shift work and body weight travel together and are hard to separate.",
      "Sleep is usually self-reported, and short and very long sleep have both been linked to lower measurements.",
      "No trial has shown that improving sleep raises a specific measurement by a specific amount.",
    ],
    source: "Sleep and circadian systematic review and meta-analysis",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9326175/",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: ["sleep"],
  },
  {
    id: "smoking-umbrella",
    claim: "Cigarette smoking shows consistent adverse associations with semen measurements, and cumulative exposure matters.",
    endpoints: ["Sperm concentration", "Total motility", "Normal morphology", "Sperm DNA fragmentation"],
    studyType: "Umbrella review of systematic reviews and meta-analyses",
    population: "Adult men across many populations and study designs",
    direction: "adverse",
    confidence: "moderate",
    causal: false,
    limitations: [
      "Smokers differ from non-smokers in diet, alcohol and occupation, so residual confounding is likely.",
      "Because sperm take roughly 64–74 days to mature, change after cessation is measured in months, not weeks.",
    ],
    source: "Umbrella review of risk factors and semen parameters",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13258348/",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: ["substances"],
  },
  {
    id: "alcohol-umbrella",
    claim: "Heavy or chronic alcohol exposure is more consistently associated with poorer semen measurements than light intake.",
    endpoints: ["Semen volume", "Sperm concentration", "Normal morphology"],
    studyType: "Umbrella review of systematic reviews and meta-analyses",
    population: "Adult men, with heterogeneous definitions of intake",
    direction: "adverse",
    confidence: "limited",
    causal: false,
    limitations: [
      "Intake categories differ between studies, so thresholds are not directly comparable.",
      "Alcohol and smoking co-occur, and few studies isolate alcohol reduction on its own.",
    ],
    source: "Umbrella review of risk factors and semen parameters",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13258348/",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: ["substances"],
  },
  {
    id: "diet-pattern-sr",
    claim: "Healthier overall dietary patterns are associated with better semen measurements than Western-style patterns.",
    endpoints: ["Sperm concentration", "Total motility", "Normal morphology"],
    studyType: "Systematic review and meta-analysis",
    population: "Adult men across cohort and cross-sectional studies",
    direction: "favourable",
    confidence: "moderate",
    causal: false,
    limitations: [
      "Evidence is stronger for whole patterns than for any single food, nutrient or supplement.",
      "Dietary recall is imprecise, and diet correlates with income, activity and smoking.",
    ],
    source: "Healthy dietary-pattern systematic review and meta-analysis",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9491032/",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: ["diet"],
  },
  {
    id: "mediterranean-sr",
    claim: "Mediterranean-style dietary patterns show favourable associations with semen measurements.",
    endpoints: ["Sperm concentration", "Progressive motility", "Normal morphology"],
    studyType: "Systematic review and meta-analysis",
    population: "Adult men, largely from Mediterranean and European cohorts",
    direction: "favourable",
    confidence: "moderate",
    causal: false,
    limitations: [
      "Findings may not transfer to populations with different baseline diets.",
      "Adherence scores vary between studies, so the exposure is not defined identically.",
    ],
    source: "Mediterranean-diet systematic review and meta-analysis",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12276387/",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: ["diet"],
  },
  {
    id: "exercise-nma",
    claim: "Structured physical activity can change reproductive markers in selected populations, on a curve where moderate activity is favourable.",
    endpoints: ["Sperm concentration", "Total motility", "Normal morphology"],
    studyType: "Network meta-analysis of randomised and controlled trials",
    population: "Adult men, several trials in overweight or sedentary groups",
    direction: "favourable",
    confidence: "moderate",
    causal: true,
    limitations: [
      "Effects are clearest where baseline activity was low, so they may not generalise to already-active men.",
      "Trials are small and short, and the sustained high-load extreme is a separate question this evidence does not answer.",
    ],
    source: "Exercise network meta-analysis",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9214906/",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: ["activity"],
  },
  {
    id: "obesity-intervention-sr",
    claim: "Weight-loss interventions in men with obesity can improve semen measurements, with gradual loss preferred.",
    endpoints: ["Total sperm count", "Sperm concentration", "Normal morphology"],
    studyType: "Systematic review and meta-analysis of interventions",
    population: "Men with overweight or obesity",
    direction: "favourable",
    confidence: "moderate",
    causal: true,
    limitations: [
      "Benefit appears tied to maintaining the loss, not to the loss itself.",
      "Rapid loss after bariatric surgery has been associated with impaired production, so pace matters.",
      "Applies to men with obesity, and should not be read as a recommendation to lose weight at a healthy weight.",
    ],
    source: "Obesity-intervention systematic review and meta-analysis",
    sourceUrl: "https://academic.oup.com/humupd/article/32/2/154/8279592",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: ["activity"],
  },
  {
    id: "heat-umbrella",
    claim: "Recurrent substantial scrotal heat exposure and recent high fever are associated with lower semen measurements.",
    endpoints: ["Sperm concentration", "Total sperm count", "Total motility"],
    studyType: "Umbrella review, drawing on small human exposure studies",
    population: "Adult men, including sauna and occupational-heat studies",
    direction: "adverse",
    confidence: "limited",
    causal: false,
    limitations: [
      "Human studies are small, and the strongest evidence concerns repeated or occupational heat rather than occasional exposure.",
      "Evidence for laptop placement, heated seats and tight clothing is weaker still and carries little weight.",
      "Timing matters: effects peak weeks after exposure and typically recover over about three months.",
    ],
    source: "Umbrella review of risk factors and semen parameters",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13258348/",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: ["heat"],
  },
  {
    id: "air-pollution-sr",
    claim: "Outdoor air pollution exposure is associated with lower semen measurements.",
    endpoints: ["Sperm concentration", "Total sperm count", "Total motility", "Normal morphology"],
    studyType: "Systematic review and meta-analysis",
    population: "Adult men across multiple regions and pollution levels",
    direction: "adverse",
    confidence: "moderate",
    causal: false,
    limitations: [
      "Exposure is estimated from location, so it is a population-level proxy rather than a personal measurement.",
      "No trial has shown that reducing personal exposure changes a semen measurement.",
    ],
    source: "Outdoor air-pollution systematic review and meta-analysis",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/40082868/",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: ["environment"],
  },
  {
    id: "lead-ma",
    claim: "Lead exposure is associated with lower semen quality, with comparatively consistent human evidence.",
    endpoints: ["Sperm concentration", "Total motility", "Normal morphology"],
    studyType: "Meta-analysis, largely occupational cohorts",
    population: "Occupationally and environmentally exposed men",
    direction: "adverse",
    confidence: "moderate",
    causal: false,
    limitations: [
      "Most evidence comes from higher occupational exposures than a typical user experiences.",
      "Measured biomarkers are far stronger evidence than questionnaire answers about exposure.",
    ],
    source: "Lead and semen-quality meta-analysis",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/41370422/",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: ["environment"],
  },
  {
    id: "abstinence-sr",
    claim: "Abstinence duration materially changes semen volume and concentration, independently of reproductive health.",
    endpoints: ["Semen volume", "Sperm concentration", "Total motility"],
    studyType: "Systematic review and meta-analysis",
    population: "Adult men undergoing semen analysis",
    direction: "measurement",
    confidence: "moderate",
    causal: true,
    limitations: [
      "This is a measurement modifier, not a health factor. It changes the reading, not the underlying biology.",
      "It is one of several collection conditions that must match before two samples are compared.",
    ],
    source: "Abstinence systematic review and meta-analysis",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12257329/",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: ["sexual"],
  },
  {
    id: "who-semen-manual",
    claim: "Semen reference limits describe the 5th centile of a reference population of recent fathers, not a fertile/infertile boundary.",
    endpoints: ["All semen measurements"],
    studyType: "Laboratory manual and reference distribution",
    population: "Reference population of men with a recent time-to-pregnancy",
    direction: "context",
    confidence: "moderate",
    causal: false,
    limitations: [
      "A value below a lower reference limit does not mean infertility, and a value above it does not mean fertility.",
      "Confirming azoospermia requires examining the sediment of a centrifuged sample, which no consumer method can do.",
    ],
    source: "WHO laboratory manual for the examination and processing of human semen, 6th edition",
    sourceUrl: "https://www.who.int/publications/i/item/9789240030787",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: [],
  },
  {
    id: "aua-asrm-guideline",
    claim: "Specific findings and histories warrant clinician-directed evaluation rather than lifestyle management.",
    endpoints: ["Clinical pathway"],
    studyType: "Clinical practice guideline",
    population: "Men undergoing fertility evaluation",
    direction: "context",
    confidence: "moderate",
    causal: false,
    limitations: [
      "A guideline describes clinical pathways. It is not a substitute for an individual assessment.",
    ],
    source: "AUA/ASRM, Diagnosis and Treatment of Infertility in Men, amended 2024",
    sourceUrl:
      "https://www.auanet.org/documents/Guidelines/PDF/2024%20Guidelines/Male%20Infertility%20Unabridged%20Final.pdf",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: [],
  },
  {
    id: "anabolic-steroid-sr",
    claim: "Exogenous testosterone and anabolic-androgenic steroids can suppress spermatogenesis, with recovery taking months or longer.",
    endpoints: ["Sperm concentration", "Total sperm count", "Reproductive hormones"],
    studyType: "Systematic review",
    population: "Men using anabolic-androgenic steroids or exogenous testosterone",
    direction: "adverse",
    confidence: "moderate",
    causal: true,
    limitations: [
      "This is an established clinical determinant, so it creates a clinician pathway rather than a score deduction.",
      "PreSeed never recommends starting, stopping or changing any hormone treatment.",
    ],
    source: "Anabolic-steroid systematic review",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/35146992/",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: [],
  },
  {
    id: "medication-review",
    claim: "Selected medicines have documented effects on male reproductive function, varying by drug, dose and duration.",
    endpoints: ["Semen measurements", "Reproductive hormones", "Sexual function"],
    studyType: "Narrative review",
    population: "Men taking the medicines reviewed",
    direction: "context",
    confidence: "limited",
    causal: false,
    limitations: [
      "Evidence for many medicines is conditional or mixed, and the underlying condition also matters.",
      "PreSeed never advises stopping prescribed treatment. It creates a clinician-discussion prompt.",
    ],
    source: "Medication and male-fertility review",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/28622464/",
    lastReviewed: "2026-07-25",
    reviewStatus: "internal_review",
    domains: [],
  },
  {
    id: "microplastics-sr",
    claim: "Seminal microplastics and plastic-tableware use have been associated with poorer sperm-quality measurements.",
    endpoints: ["Sperm concentration", "Total motility"],
    studyType: "Systematic review of small human studies",
    population: "Small human samples, with difficult source attribution",
    direction: "adverse",
    confidence: "emerging",
    causal: false,
    limitations: [
      "Studies are small, exposure attribution is difficult, and there is no intervention evidence at all.",
      "This cannot support any conversion such as one fewer plastic cup equalling a known change in a measurement.",
    ],
    source: "Microplastic reproductive-outcomes systematic review",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/38287142/",
    lastReviewed: "2026-07-25",
    reviewStatus: "clinical_review_pending",
    domains: ["environment"],
  },
  {
    id: "lifestyle-prediction-study",
    claim: "Lifestyle and general characteristics can predict some variation in semen-quality categories at population level.",
    endpoints: ["Semen-quality category"],
    studyType: "Retrospective single-centre machine-learning study",
    population: "5,109 men at one centre",
    direction: "context",
    confidence: "limited",
    causal: false,
    limitations: [
      "Single centre and retrospective, so it requires external, geographic and prospective validation.",
      "Demonstrates predictive signal only. It does not validate a consumer risk score.",
    ],
    source: "Lifestyle-based semen prediction study",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9514383/",
    lastReviewed: "2026-07-25",
    reviewStatus: "clinical_review_pending",
    domains: [],
  },
  {
    id: "antioxidant-effect-candidate",
    claim:
      "Candidate effect sizes for CoQ10, L-carnitine, omega-3 and selenium with vitamin E on semen measurements, supplied in the product brief.",
    endpoints: ["Sperm concentration", "Total motility", "Normal morphology"],
    studyType: "Network meta-analyses and randomised trials, not yet traced to source",
    population: "Not yet verified",
    direction: "favourable",
    confidence: "insufficient",
    causal: false,
    limitations: [
      "The underlying papers have not been retrieved, so no figure here may be shown to a user or used in a recommendation.",
      "The largest network meta-analysis reportedly showed no significant pregnancy-rate benefit, so parameter evidence must never be converted into a conception claim.",
      "Broad antioxidant formulations have not consistently improved measurements in randomised trials.",
    ],
    source: "Product brief effect-size candidates — source not yet verified",
    sourceUrl: "",
    lastReviewed: "2026-07-25",
    reviewStatus: "research_candidate",
    domains: [],
  },
];

export const evidenceById = new Map(evidence.map((claim) => [claim.id, claim]));

/** Only internally reviewed claims may back a recommendation. */
export function isCitable(id: string) {
  return evidenceById.get(id)?.reviewStatus === "internal_review";
}

/* ==========================================================================
   Parameter reasoning — the signature screen's content
   ========================================================================== */

export type ProtocolCategory =
  | "nutrition"
  | "exercise"
  | "sleep"
  | "supplement"
  | "exposure"
  | "lifestyle"
  | "clinical_navigation";

export const categoryLabel: Record<ProtocolCategory, string> = {
  nutrition: "Nutrition",
  exercise: "Exercise",
  sleep: "Sleep",
  supplement: "Supplement information",
  exposure: "Exposure reduction",
  lifestyle: "Lifestyle",
  clinical_navigation: "Clinical navigation",
};

export type ReasoningChain = {
  id: string;
  markerCode: MarkerCode;
  /** Why this marker, in one line, for the summary card. */
  headline: string;
  applicability: string;
  mechanism: string;
  integrativeNote: string;
  action: {
    title: string;
    description: string;
    category: ProtocolCategory;
    bounded: string;
  };
  evidenceIds: string[];
  limitations: string[];
  escalation?: string;
};

export const reasoningChains: ReasoningChain[] = [
  {
    id: "chain-concentration",
    markerCode: "concentration_million_ml",
    headline: "Concentration sits below the reference interval for this reference set",
    applicability:
      "Your concentration was measured below the WHO 6th edition lower reference limit, and your total count sits just above its own limit. That combination points at overall production rather than at the sample itself, which is why your plan emphasises the factors that affect output over a full sperm-production cycle.",
    mechanism:
      "Sperm production runs continuously in the seminiferous tubules and takes roughly 64 to 74 days from start to finish, under the control of the hormonal axis linking the brain and the testes. Anything that disturbs that axis or the local environment of the testes — sustained heat, metabolic strain, particulate exposure — shows up in output a few weeks later rather than immediately. That delay is the reason a protocol is dated in months and not in days.",
    integrativeNote:
      "Concentration, motility and morphology are not independent dials. They share upstream causes, so your plan emphasises particular areas because of a specific result, rather than treating each measurement as a separate lever.",
    action: {
      title: "Reduce recurrent heat exposure and add indoor air filtration",
      description:
        "Skip sauna and hot-tub sessions for the remainder of this protocol, take a standing break every 45 minutes on desk days, and run a HEPA filter in the room you sleep in.",
      category: "exposure",
      bounded: "Two changes, both reversible, for the remaining weeks of this protocol.",
    },
    evidenceIds: ["heat-umbrella", "air-pollution-sr", "who-semen-manual"],
    limitations: [
      "The heat and air-quality evidence is association-level. It supports moving the environment in a sensible direction, not a predicted change in your numbers.",
      "Air-pollution exposure is estimated from where you live, not measured on you.",
      "No part of this predicts conception, and no lifestyle change is a substitute for clinical assessment.",
    ],
  },
  {
    id: "chain-progressive-motility",
    markerCode: "progressive_motility_pct",
    headline: "Progressive motility is the largest gap to its reference interval",
    applicability:
      "Progressive motility is the measurement furthest below its reference limit in your result, and your total motility sits below its limit too. When both move together, the shared explanation is usually the energy supply to the sperm tail rather than the number of sperm produced.",
    mechanism:
      "Forward movement is powered by mitochondria packed into the sperm midpiece. Those mitochondria, and the membranes around them, are unusually vulnerable to reactive oxygen species, because sperm carry very little of the repair machinery other cells rely on. Oxidative stress is therefore the mechanism that sits at the crossroads of reduced motility and DNA damage, and it is the reason smoking, particulate exposure and heat all appear in the same part of your plan.",
    integrativeNote:
      "Because oxidative stress is a shared upstream driver, exposure reduction and dietary pattern reinforce each other here. They are not two separate treatments for two separate problems.",
    action: {
      title: "Shift dietary pattern toward the Mediterranean-style profile",
      description:
        "Four fish meals a week, a daily portion of nuts, and olive oil in place of butter for cooking. Pattern first — no supplement is recommended here.",
      category: "nutrition",
      bounded: "Three specific substitutions, assessed at your next check-in.",
    },
    evidenceIds: ["mediterranean-sr", "diet-pattern-sr", "smoking-umbrella"],
    limitations: [
      "Dietary-pattern evidence is observational. It cannot promise a specific increase in motility.",
      "Evidence is stronger for whole patterns than for any single food, and much stronger than for supplements.",
      "Supplement effect sizes supplied in the product brief have not been traced to their papers and are excluded from recommendations.",
    ],
  },
  {
    id: "chain-morphology",
    markerCode: "normal_morphology_pct",
    headline: "Morphology is below its reference interval and is the least lifestyle-responsive measurement",
    applicability:
      "Your normal morphology was measured just below its reference limit. Morphology overlaps with the oxidative-stress picture behind your motility result, but it is also partly a question of how sperm are assembled during production — which makes it the measurement least likely to respond to lifestyle change alone.",
    mechanism:
      "Head and tail shape is determined during spermiogenesis, the final packaging stage of sperm development. Faults introduced there are not corrected later. Strict assessment criteria also mean low percentages of normal forms are expected even in men with no fertility difficulty, so this measurement is read as part of a pattern rather than on its own.",
    integrativeNote:
      "This is where PreSeed deliberately claims less. Morphology is the clearest case for a specialist conversation rather than a stronger lifestyle push.",
    action: {
      title: "Bring these results to a clinician alongside a repeat analysis",
      description:
        "Book a fertility assessment and take both results with you. Ask specifically whether a sperm DNA fragmentation test is appropriate, since it has not been measured and would change how this pattern is read.",
      category: "clinical_navigation",
      bounded: "One appointment, with a prepared question list.",
    },
    evidenceIds: ["aua-asrm-guideline", "who-semen-manual", "diet-pattern-sr"],
    limitations: [
      "Morphology-specific interventions are not well evidenced. Nothing here should be read as a way to change this measurement.",
      "A single analysis is not a diagnosis. Measurements vary substantially between samples from the same man.",
    ],
    escalation:
      "Morphology below the reference interval, together with two motility measurements below theirs, is a reasonable point to involve a clinician rather than to continue with lifestyle change alone.",
  },
];

export const reasoningByMarker = new Map(reasoningChains.map((chain) => [chain.markerCode, chain]));

/* ==========================================================================
   Protocol template
   ========================================================================== */

export type ProtocolItem = {
  id: string;
  weekFrom: number;
  weekTo: number;
  cadence: "daily" | "weekly" | "once";
  category: ProtocolCategory;
  title: string;
  description: string;
  evidenceStatus: "evidence_backed" | "general_guidance";
  evidenceIds: string[];
  /** The measurement this item responds to, when it responds to one. */
  markerCode?: MarkerCode;
  reasoningId?: string;
};

export const protocolTemplate: ProtocolItem[] = [
  {
    id: "item-sleep-window",
    weekFrom: 1,
    weekTo: 15,
    cadence: "daily",
    category: "sleep",
    title: "Keep a 7.5-hour sleep window",
    description:
      "Same lights-out and wake time within about 30 minutes each day, including at weekends. Regularity is doing as much work here as duration.",
    evidenceStatus: "evidence_backed",
    evidenceIds: ["sleep-circadian-sr"],
  },
  {
    id: "item-mediterranean-swap",
    weekFrom: 1,
    weekTo: 15,
    cadence: "daily",
    category: "nutrition",
    title: "Olive oil and nuts in place of butter and crisps",
    description:
      "One daily portion of unsalted nuts, olive oil for cooking. A pattern change, not a supplement.",
    evidenceStatus: "evidence_backed",
    evidenceIds: ["mediterranean-sr", "diet-pattern-sr"],
    markerCode: "progressive_motility_pct",
    reasoningId: "chain-progressive-motility",
  },
  {
    id: "item-fish-weekly",
    weekFrom: 1,
    weekTo: 15,
    cadence: "weekly",
    category: "nutrition",
    title: "Four fish meals this week",
    description: "Oily fish twice, white fish twice. Tinned counts.",
    evidenceStatus: "evidence_backed",
    evidenceIds: ["diet-pattern-sr"],
    markerCode: "progressive_motility_pct",
    reasoningId: "chain-progressive-motility",
  },
  {
    id: "item-activity",
    weekFrom: 1,
    weekTo: 15,
    cadence: "weekly",
    category: "exercise",
    title: "Four moderate sessions",
    description:
      "Around 40 minutes at a pace where you could hold a conversation. Moderate is the target, not maximum.",
    evidenceStatus: "evidence_backed",
    evidenceIds: ["exercise-nma"],
  },
  {
    id: "item-standing-breaks",
    weekFrom: 1,
    weekTo: 15,
    cadence: "daily",
    category: "lifestyle",
    title: "Stand and move every 45 minutes",
    description:
      "Breaks up both sedentary time and the heat that builds up from prolonged sitting.",
    evidenceStatus: "evidence_backed",
    evidenceIds: ["heat-umbrella"],
    markerCode: "concentration_million_ml",
    reasoningId: "chain-concentration",
  },
  {
    id: "item-heat-pause",
    weekFrom: 1,
    weekTo: 15,
    cadence: "weekly",
    category: "exposure",
    title: "No sauna or hot tub this week",
    description:
      "Paused for the length of this protocol so the next analysis is not reading a recent heat exposure.",
    evidenceStatus: "evidence_backed",
    evidenceIds: ["heat-umbrella"],
    markerCode: "concentration_million_ml",
    reasoningId: "chain-concentration",
  },
  {
    id: "item-air-filter",
    weekFrom: 2,
    weekTo: 15,
    cadence: "daily",
    category: "exposure",
    title: "Run the HEPA filter overnight",
    description:
      "In the room you sleep in. Indoor filtration is the best-evidenced way to reduce your own particulate exposure.",
    evidenceStatus: "evidence_backed",
    evidenceIds: ["air-pollution-sr"],
    markerCode: "concentration_million_ml",
    reasoningId: "chain-concentration",
  },
  {
    id: "item-alcohol-cap",
    weekFrom: 1,
    weekTo: 15,
    cadence: "weekly",
    category: "lifestyle",
    title: "Keep alcohol under 7 units",
    description:
      "Spread across the week rather than concentrated into one night. Heavy episodes are the pattern the evidence is clearest about.",
    evidenceStatus: "evidence_backed",
    evidenceIds: ["alcohol-umbrella"],
  },
  {
    id: "item-plastics",
    weekFrom: 3,
    weekTo: 15,
    cadence: "weekly",
    category: "exposure",
    title: "Nothing reheated in plastic",
    description:
      "Glass or steel for hot food and drinks. Low cost, and the evidence is early rather than strong — which is why it sits here rather than near the top of your plan.",
    evidenceStatus: "evidence_backed",
    evidenceIds: ["microplastics-sr"],
  },
  {
    id: "item-supplement-info",
    weekFrom: 4,
    weekTo: 15,
    cadence: "once",
    category: "supplement",
    title: "Read before buying any supplement",
    description:
      "PreSeed is not recommending a supplement. The effect sizes circulating for CoQ10, carnitine and omega-3 have not been traced to their papers in this prototype, and broad antioxidant formulations have not consistently improved measurements in trials. Discuss any supplement with a clinician first.",
    evidenceStatus: "general_guidance",
    evidenceIds: [],
  },
  {
    id: "item-clinical-appointment",
    weekFrom: 2,
    weekTo: 6,
    cadence: "once",
    category: "clinical_navigation",
    title: "Book a fertility assessment",
    description:
      "Take both analyses. Ask whether a sperm DNA fragmentation test is appropriate, and whether a hormone panel is worth repeating.",
    evidenceStatus: "evidence_backed",
    evidenceIds: ["aua-asrm-guideline"],
    markerCode: "normal_morphology_pct",
    reasoningId: "chain-morphology",
  },
  {
    id: "item-retest-booking",
    weekFrom: 12,
    weekTo: 15,
    cadence: "once",
    category: "clinical_navigation",
    title: "Book the closing semen analysis",
    description:
      "Same laboratory, and aim for the same abstinence duration as your baseline — 62 hours. Matching collection conditions is what makes the two results comparable.",
    evidenceStatus: "evidence_backed",
    evidenceIds: ["abstinence-sr"],
  },
];

export const weeklyFocus: string[] = [
  "Set the sleep window and record a baseline. Nothing else changes this week.",
  "Add the overnight filter and the standing breaks.",
  "Dietary swaps become routine. Plastics reduction starts.",
  "First full week with everything running. Expect it to feel like a lot.",
  "Consolidation week. No new actions.",
  "Check the clinical appointment is booked.",
  "Halfway. Review what has actually stuck rather than what was planned.",
  "Alcohol pattern is the focus this week.",
  "Consolidation week. No new actions.",
  "Heat exposure review, including anything seasonal.",
  "Activity quality over quantity. Moderate, not maximum.",
  "Book the closing analysis and confirm abstinence timing.",
  "Hold everything steady. Changes now will not show in the next result.",
  "Closing week. Collection conditions matter more than anything else you do now.",
];

/* ==========================================================================
   Named screening risks
   --------------------------------------------------------------------------
   No risk output is generated in-app. Each entry exists to specify a state.
   ========================================================================== */

export type RiskState =
  | "unavailable_by_design"
  | "pending_model"
  | "insufficient_data"
  | "externally_generated";

export type RiskOutput = {
  id: string;
  endpoint: string;
  state: RiskState;
  /** Present only for an externally generated result. */
  band?: string;
  bandDetail?: string;
  uncertainty?: string;
  modelVersion?: string;
  generatedAt?: string;
  generatedContext?: string;
  missing: string[];
  confirmation: string;
  nextAction: string;
  note: string;
};

export const riskOutputs: RiskOutput[] = [
  {
    id: "risk-azoospermia",
    endpoint: "Azoospermia screening",
    state: "unavailable_by_design",
    missing: [],
    confirmation: "Laboratory confirmation required",
    nextAction: "Ask a laboratory for a centrifuged sample examination.",
    note:
      "PreSeed cannot confirm azoospermia. A zero or extremely low result requires appropriate laboratory confirmation. The WHO definition depends on examining the sediment of a centrifuged sample, and studies have found rare sperm in a meaningful share of samples first called azoospermic by less rigorous methods.",
  },
  {
    id: "risk-below-reference-motility",
    endpoint: "Below-reference progressive motility",
    state: "externally_generated",
    band: "Elevated screening signal",
    bandDetail: "Band 3 of 4 — bands are used rather than a precise probability, because the model is not calibrated for individual use.",
    uncertainty: "Wide. The model was run on a single centre's retrospective data and has had no prospective validation.",
    modelVersion: "laptop-lgbm-0.2.1",
    generatedAt: "2026-07-19",
    generatedContext:
      "Generated off-device on a founder's laptop and imported. This is not a live prediction, and it did not use your data from the last six days.",
    missing: ["Sperm DNA fragmentation", "Wearable sleep and activity coverage"],
    confirmation: "Confirmation required — this is a screening signal, not a finding",
    nextAction: "Treat this as a reason to keep the clinical appointment, not as a result.",
    note:
      "A screening risk is not a diagnosis. This output estimates the chance that a measurement falls below a declared reference distribution. It says nothing about conception.",
  },
  {
    id: "risk-below-reference-concentration",
    endpoint: "Below-reference sperm concentration",
    state: "pending_model",
    missing: [],
    confirmation: "Confirmation required once available",
    nextAction: "No action. Your measured concentration is already on your profile.",
    note:
      "No model for this endpoint is connected. The assessment contract is reserved until the model-owner pull requests define its inputs and outputs, so PreSeed shows nothing here rather than estimating.",
  },
  {
    id: "risk-endocrine-pattern",
    endpoint: "Endocrine-pattern screening",
    state: "insufficient_data",
    missing: ["FSH", "LH", "Total testosterone", "SHBG"],
    confirmation: "Clinician interpretation required",
    nextAction: "Add a hormone panel if you have one, or discuss whether one is appropriate.",
    note:
      "This output needs a hormone panel. Even with one, PreSeed does not diagnose endocrine disease and never recommends hormone treatment — abnormal results route to a clinician.",
  },
];

export const riskStateLabel: Record<RiskState, string> = {
  unavailable_by_design: "Not available by design",
  pending_model: "Pending integration",
  insufficient_data: "Insufficient data",
  externally_generated: "Externally generated",
};

/* ==========================================================================
   Simulated clinical data
   ========================================================================== */

const SIM_LAB = "Northgate Andrology (simulated)";

export const demoBaseline: ClinicalTest = {
  id: "test-baseline",
  testType: "semen_analysis",
  source: "simulated",
  collectedAt: "2026-04-18T09:15:00Z",
  labName: SIM_LAB,
  abstinenceHours: 62,
  collectionComplete: true,
  recentFever: false,
  notes: "Simulated baseline supplied with the prototype.",
  markers: [
    { code: "volume_ml", value: 2.8, unit: "mL", verification: "lab_report" },
    { code: "concentration_million_ml", value: 14.2, unit: "×10⁶/mL", verification: "lab_report" },
    { code: "total_count_million", value: 39.8, unit: "×10⁶", verification: "lab_report" },
    { code: "progressive_motility_pct", value: 27, unit: "%", verification: "lab_report" },
    { code: "total_motility_pct", value: 39, unit: "%", verification: "lab_report" },
    { code: "normal_morphology_pct", value: 3, unit: "%", verification: "lab_report" },
  ],
};

export const demoRetest: ClinicalTest = {
  id: "test-retest",
  testType: "semen_analysis",
  source: "simulated",
  collectedAt: "2026-07-24T08:40:00Z",
  labName: SIM_LAB,
  abstinenceHours: 60,
  collectionComplete: true,
  recentFever: false,
  notes: "Simulated closing analysis supplied with the prototype.",
  markers: [
    { code: "volume_ml", value: 3.1, unit: "mL", verification: "lab_report" },
    { code: "concentration_million_ml", value: 18.6, unit: "×10⁶/mL", verification: "lab_report" },
    { code: "total_count_million", value: 57.7, unit: "×10⁶", verification: "lab_report" },
    { code: "progressive_motility_pct", value: 33, unit: "%", verification: "lab_report" },
    { code: "total_motility_pct", value: 46, unit: "%", verification: "lab_report" },
    { code: "normal_morphology_pct", value: 4, unit: "%", verification: "lab_report" },
  ],
};

export const demoHormonePanel: ClinicalTest = {
  id: "test-hormones",
  testType: "hormone_panel",
  source: "simulated",
  collectedAt: "2026-04-22T08:05:00Z",
  labName: "Meridian Pathology (simulated)",
  abstinenceHours: null,
  collectionComplete: null,
  recentFever: false,
  notes: "Simulated panel. Morning sample.",
  markers: [
    { code: "fsh_iu_l", value: 9.8, unit: "IU/L", verification: "lab_report", referenceLow: 1.5, referenceHigh: 12.4 },
    { code: "lh_iu_l", value: 6.1, unit: "IU/L", verification: "lab_report", referenceLow: 1.7, referenceHigh: 8.6 },
    {
      code: "total_testosterone_nmol_l",
      value: 11.2,
      unit: "nmol/L",
      verification: "lab_report",
      referenceLow: 8.6,
      referenceHigh: 29,
    },
    { code: "estradiol_pmol_l", value: 132, unit: "pmol/L", verification: "lab_report", referenceLow: 41, referenceHigh: 159 },
    { code: "shbg_nmol_l", value: 31, unit: "nmol/L", verification: "lab_report", referenceLow: 18.3, referenceHigh: 54.1 },
    { code: "tsh_miu_l", value: 2.1, unit: "mIU/L", verification: "lab_report", referenceLow: 0.27, referenceHigh: 4.2 },
  ],
};

/** Reversal-track series: real-lab entries at four-week intervals. */
export const reversalSeries: ClinicalTest[] = [
  {
    id: "rev-1",
    testType: "semen_analysis",
    source: "simulated",
    collectedAt: "2026-03-14T09:00:00Z",
    labName: SIM_LAB,
    abstinenceHours: 60,
    collectionComplete: true,
    recentFever: false,
    notes: "Four weeks post-reversal.",
    reportedAsZero: true,
    markers: [
      { code: "volume_ml", value: 2.4, unit: "mL", verification: "lab_report" },
      { code: "concentration_million_ml", value: 0, unit: "×10⁶/mL", verification: "lab_report" },
    ],
  },
  {
    id: "rev-2",
    testType: "semen_analysis",
    source: "simulated",
    collectedAt: "2026-04-11T09:00:00Z",
    labName: SIM_LAB,
    abstinenceHours: 58,
    collectionComplete: true,
    recentFever: false,
    notes: "Eight weeks post-reversal.",
    markers: [
      { code: "volume_ml", value: 2.6, unit: "mL", verification: "lab_report" },
      { code: "concentration_million_ml", value: 0.4, unit: "×10⁶/mL", verification: "lab_report" },
      { code: "progressive_motility_pct", value: 11, unit: "%", verification: "lab_report" },
    ],
  },
  {
    id: "rev-3",
    testType: "semen_analysis",
    source: "simulated",
    collectedAt: "2026-05-09T09:00:00Z",
    labName: SIM_LAB,
    abstinenceHours: 62,
    collectionComplete: true,
    recentFever: false,
    notes: "Twelve weeks post-reversal.",
    markers: [
      { code: "volume_ml", value: 2.9, unit: "mL", verification: "lab_report" },
      { code: "concentration_million_ml", value: 3.1, unit: "×10⁶/mL", verification: "lab_report" },
      { code: "progressive_motility_pct", value: 19, unit: "%", verification: "lab_report" },
    ],
  },
  {
    id: "rev-4",
    testType: "semen_analysis",
    source: "simulated",
    collectedAt: "2026-06-06T09:00:00Z",
    labName: SIM_LAB,
    abstinenceHours: 60,
    collectionComplete: true,
    recentFever: false,
    notes: "Sixteen weeks post-reversal.",
    markers: [
      { code: "volume_ml", value: 3, unit: "mL", verification: "lab_report" },
      { code: "concentration_million_ml", value: 7.8, unit: "×10⁶/mL", verification: "lab_report" },
      { code: "progressive_motility_pct", value: 24, unit: "%", verification: "lab_report" },
    ],
  },
];

/* ==========================================================================
   Contextual explanation — prepared prototype responses
   --------------------------------------------------------------------------
   No model call happens. Each entry is authored, cites only citable evidence,
   and the set deliberately includes the two states that must be designed:
   evidence-insufficient and unavailable.
   ========================================================================== */

export type CoachResponse = {
  contextId: string;
  contextLabel: string;
  question: string;
  state: "answered" | "evidence_insufficient" | "unavailable";
  answer: string;
  evidenceIds: string[];
  limitations: string[];
};

export const coachResponses: CoachResponse[] = [
  {
    contextId: "progressive_motility_pct",
    contextLabel: "Progressive motility result",
    question: "Why does my diet matter for motility specifically?",
    state: "answered",
    answer:
      "Forward movement depends on mitochondria in the sperm midpiece, and those mitochondria are unusually exposed to oxidative damage because sperm carry very little repair machinery. Dietary pattern is the lever with the most consistent human evidence for shifting that oxidative environment, which is why your plan changes what you eat rather than adding a supplement. What this does not do is predict a number. The evidence is observational, so it supports moving in a sensible direction and nothing more precise than that.",
    evidenceIds: ["mediterranean-sr", "diet-pattern-sr"],
    limitations: [
      "Observational evidence only. No predicted change in your motility.",
      "Pattern-level evidence is stronger than evidence for individual foods.",
    ],
  },
  {
    contextId: "concentration_million_ml",
    contextLabel: "Sperm concentration result",
    question: "How long before a change would show up?",
    state: "answered",
    answer:
      "Roughly 64 to 74 days, because that is how long a sperm cell takes to develop. A change you make this week affects cells that are only starting production now, so the earliest an effect could appear in a measurement is about two to three months later. That is the reason your protocol is 100 days and ends with a scheduled analysis rather than checking every few weeks.",
    evidenceIds: ["who-semen-manual"],
    limitations: [
      "Timing describes the production cycle, not a guarantee that anything will change.",
      "Measurements vary substantially between samples from the same man, so a single retest cannot isolate an effect.",
    ],
  },
  {
    contextId: "readiness-heat",
    contextLabel: "Heat exposure domain",
    question: "Is sitting all day really a problem?",
    state: "evidence_insufficient",
    answer:
      "Not to the standard PreSeed will give an evidence-backed answer to. Prolonged sitting raises scrotal temperature, and that is measurable, but the human evidence connecting sitting specifically to semen measurements is much weaker than the evidence for sauna, hot-tub or occupational heat. So this stays in your plan as a low-cost precaution with a small weight, and it is labelled general guidance rather than evidence-backed. If you want the strong version of this action, the sauna pause is the one that carries the evidence.",
    evidenceIds: ["heat-umbrella"],
    limitations: [
      "No approved claim covers sitting as an isolated exposure.",
      "Labelled general guidance, so it does not count as an evidence-backed recommendation.",
    ],
  },
  {
    contextId: "risk-below-reference-motility",
    contextLabel: "Below-reference progressive motility screening risk",
    question: "What does this risk band actually mean for me?",
    state: "unavailable",
    answer:
      "PreSeed will not explain this output, because it cannot verify it. The band was produced off-device by an uncalibrated model with no prospective validation, and explaining it in individual terms would give it a confidence it has not earned. What is safe to say: your measured progressive motility is on your clinical profile, and that measurement — not this band — is what to take to a clinician.",
    evidenceIds: [],
    limitations: [
      "The explanation layer retrieves approved evidence. It does not interpret unvalidated model output.",
      "No account-level explanation is available for externally generated risk bands.",
    ],
  },
];

export const suggestedQuestions = [
  "Why does this apply to me?",
  "How strong is the evidence?",
  "How long before a change would show?",
  "What would you not claim here?",
];
