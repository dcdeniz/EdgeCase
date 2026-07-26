/**
 * Ask PreSeed — question routing and answer composition.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NO TEXT IS GENERATED HERE.
 *
 * Every sentence in an answer is a field on an existing object: an evidence
 * claim, its limitations, a supplement candidate's blocker, a domain's framing.
 * The router picks which objects are relevant; the renderer shows their real
 * fields. Nothing is paraphrased, and no figure appears that the model did not
 * compute.
 *
 * This is the whole reason the feature is safe to ship in a fertility product.
 * A language model asked "is CoQ10 good for fertility?" will produce a fluent,
 * confident, cited-looking paragraph — and the citations will be plausible and
 * sometimes fabricated. This cannot: if there is no card, there is no answer,
 * and the surface says so.
 *
 * When a real model is wired in, it should be constrained to SELECTING cards
 * and never to writing the claim text. The retrieval boundary is the safety
 * property, not the phrasing.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { evidence, evidenceById, type EvidenceClaim } from "@/lib/fixtures";
import { supplementCandidates, type SupplementCandidate } from "@/lib/supplements";
import { supplementProducts, type SupplementProduct } from "@/lib/supplements";
import { behaviourDomains, type BehaviourDomainId } from "@/lib/behaviour-score";
import { domainHeadroom, matchScenario, project, type Projection } from "@/lib/what-if";
import type { PrototypeState } from "@/lib/store";

/* ==========================================================================
   Seed Score impact
   --------------------------------------------------------------------------
   The honest answer is often "none". Supplements, smoking and alcohol are not
   among the four scored domains, so nothing about them moves the number — and
   saying so plainly is more useful than implying an effect the model cannot
   produce.
   ========================================================================== */

export type ScoreImpact = {
  domain: BehaviourDomainId | null;
  available: number;
  explanation: string;
};

export function impactFor(
  state: PrototypeState,
  domain: BehaviourDomainId | null,
  subject: string,
): ScoreImpact {
  if (!domain) {
    return {
      domain: null,
      available: 0,
      explanation: `${subject} is not one of the four scored domains, so it does not move your Seed Score. Your Seed Score covers sleep, diet pattern, activity and protocol adherence only.`,
    };
  }
  const { available } = domainHeadroom(state, domain);
  return {
    domain,
    available,
    explanation:
      available > 0
        ? `This acts through ${behaviourDomains[domain].label.toLowerCase()}, where you currently have up to ${available} points of Seed Score available.`
        : `This acts through ${behaviourDomains[domain].label.toLowerCase()}, which is already near its ceiling, so there is little Seed Score left to gain there.`,
  };
}

/* ==========================================================================
   Topic routing
   ========================================================================== */

type Topic = {
  id: string;
  keywords: string[];
  /** Cards that answer it. Must resolve in the evidence library. */
  evidenceIds: string[];
  /** Scored domain it acts through, if any. */
  domain: BehaviourDomainId | null;
  supplementId?: string;
  productId?: string;
  subject: string;
};

const topics: Topic[] = [
  {
    id: "coq10",
    keywords: ["coq10", "co-q10", "coenzyme", "q10", "ubiquinol"],
    evidenceIds: ["antioxidant-effect-candidate"],
    domain: null,
    supplementId: "coq10",
    subject: "Coenzyme Q10",
  },
  {
    id: "carnitine",
    keywords: ["carnitine"],
    evidenceIds: ["antioxidant-effect-candidate"],
    domain: null,
    supplementId: "l-carnitine",
    subject: "L-carnitine",
  },
  {
    id: "omega3",
    keywords: ["omega", "fish oil", "epa", "dha"],
    evidenceIds: ["mediterranean-sr"],
    domain: "diet",
    supplementId: "omega-3",
    subject: "Omega-3",
  },
  {
    id: "selenium",
    keywords: ["selenium", "vitamin e", "antioxidant"],
    evidenceIds: ["antioxidant-effect-candidate"],
    domain: null,
    supplementId: "selenium-vitamin-e",
    subject: "Selenium with vitamin E",
  },
  {
    id: "microplastics",
    keywords: ["microplastic", "plastic", "bpa", "phthalate", "winnow", "probiotic"],
    evidenceIds: ["microplastics-sr"],
    domain: null,
    productId: "winnow",
    subject: "Microplastic exposure",
  },
  {
    id: "smoking",
    keywords: ["smok", "cigarette", "nicotine", "vape", "tobacco"],
    evidenceIds: ["smoking-umbrella"],
    domain: null,
    subject: "Smoking",
  },
  {
    id: "alcohol",
    keywords: ["alcohol", "drink", "beer", "wine", "pint", "units"],
    evidenceIds: ["alcohol-umbrella"],
    domain: null,
    subject: "Alcohol",
  },
  {
    id: "sleep",
    keywords: ["sleep", "bed", "insomnia", "circadian", "shift work"],
    evidenceIds: ["sleep-circadian-sr"],
    domain: "sleep",
    subject: "Sleep",
  },
  {
    id: "diet",
    keywords: ["diet", "eat", "food", "mediterranean", "nutrition", "vegetable"],
    evidenceIds: ["diet-pattern-sr", "mediterranean-sr"],
    domain: "diet",
    subject: "Dietary pattern",
  },
  {
    id: "exercise",
    keywords: ["exercise", "gym", "train", "run", "cycl", "activity", "steps", "weight"],
    evidenceIds: ["exercise-nma", "obesity-intervention-sr"],
    domain: "activity",
    subject: "Exercise",
  },
  {
    id: "heat",
    keywords: ["heat", "sauna", "hot tub", "bath", "laptop", "sitting", "underwear"],
    evidenceIds: ["heat-umbrella"],
    domain: null,
    subject: "Scrotal heat",
  },
  {
    id: "pollution",
    keywords: ["pollution", "air quality", "pm2.5", "aqi", "smog"],
    evidenceIds: ["air-pollution-sr"],
    domain: null,
    subject: "Air pollution",
  },
  {
    id: "pesticides",
    keywords: ["pesticide", "organic", "herbicide", "residue"],
    evidenceIds: ["pesticide-sr"],
    domain: null,
    subject: "Pesticide exposure",
  },
  {
    id: "metals",
    keywords: ["lead", "cadmium", "metal", "solvent", "chemical"],
    evidenceIds: ["lead-ma"],
    domain: null,
    subject: "Metals and chemicals",
  },
  {
    id: "steroids",
    keywords: ["steroid", "testosterone replacement", "trt", "anabolic"],
    evidenceIds: ["anabolic-steroid-sr"],
    domain: null,
    subject: "Anabolic steroids and testosterone",
  },
  {
    id: "abstinence",
    keywords: ["abstinence", "how often", "frequency", "ejaculat", "sex"],
    evidenceIds: ["abstinence-sr"],
    domain: null,
    subject: "Ejaculation frequency",
  },
];

export type Answer =
  | { kind: "projection"; projection: Projection }
  | {
      kind: "topic";
      subject: string;
      claims: EvidenceClaim[];
      supplement?: SupplementCandidate;
      product?: SupplementProduct;
      impact: ScoreImpact;
    }
  | { kind: "unsupported" };

/**
 * Route a question. What-if phrasing wins over topic match, because "what if I
 * cut down on drinking" is better served by a recomputed number than by a
 * literature summary.
 */
export function answerQuestion(state: PrototypeState, text: string): Answer {
  const query = text.toLowerCase();

  const asksWhatIf = /\b(what if|if i|would it|how much would|impact on my|affect my)\b/.test(query);
  if (asksWhatIf) {
    const scenario = matchScenario(text);
    if (scenario) return { kind: "projection", projection: project(state, scenario) };
  }

  const topic = topics.find((candidate) =>
    candidate.keywords.some((word) => query.includes(word)),
  );
  if (!topic) return { kind: "unsupported" };

  const claims = topic.evidenceIds
    .map((id) => evidenceById.get(id))
    .filter((claim): claim is EvidenceClaim => claim != null);

  return {
    kind: "topic",
    subject: topic.subject,
    claims,
    supplement: supplementCandidates.find((row) => row.id === topic.supplementId),
    product: supplementProducts.find((row) => row.id === topic.productId),
    impact: impactFor(state, topic.domain, topic.subject),
  };
}

/** Question prompts that the library can actually answer, for the chip row. */
export const sampleQuestions = [
  "Is CoQ10 beneficial for fertility?",
  "Does smoking affect sperm?",
  "What if I slept eight hours a night?",
  "Do microplastics matter?",
  "How does exercise affect my results?",
  "Does alcohol make a difference?",
];

/** Total cards available, for the "what this can answer" line. */
export const evidenceCount = evidence.length;
