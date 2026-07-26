/**
 * Supplement research candidates — NOT RECOMMENDATIONS.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * The design rationale is explicit: no supplement recommendation, "because the
 * effect sizes in circulation have not been traced to their papers. They appear
 * as a research candidate that is styled so it cannot be mistaken for an
 * approved claim."
 *
 * So these render in the shape of a supplement card — compound, what it is,
 * the parameters the literature discusses, a rationale — with three deliberate
 * differences from the consumer pattern they are modelled on:
 *
 *   1. `studiedDose` is the dose used in the cited trials. It is NOT a
 *      suggested use, is never phrased as an instruction, and always sits
 *      beside the untraced-citation warning.
 *   2. `citationTraced` is false for every entry. Until a real paper is
 *      attached and clinically reviewed, none of these can drive advice.
 *   3. Every card carries `NO_CONCEPTION_CLAIM`. The largest network
 *      meta-analysis reportedly showed no significant pregnancy-rate benefit,
 *      and parameter evidence must not be converted into a conception claim.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { MarkerCode } from "@/lib/clinical";

export const NO_CONCEPTION_CLAIM =
  "Improving a parameter is not the same as improving your chance of conceiving. The largest review of these compounds did not show a clear pregnancy-rate benefit.";

export const SUPPLEMENT_DISCLAIMER =
  "PreSeed does not recommend supplements. These compounds are under research and are listed here so you can discuss them with a clinician.";

/* ==========================================================================
   Named products
   --------------------------------------------------------------------------
   A branded product attached to a contributor. Held to a higher bar than the
   generic compounds, not a lower one: the evidence level is quoted as the
   manufacturer themselves characterise it, and the gap between what the
   product is studied for and what this app is about is stated outright.
   ========================================================================== */

export type SupplementProduct = {
  id: string;
  brand: string;
  name: string;
  tagline: string;
  /** Plain-language opener, in the register of the reference screenshot. */
  what: string;
  suggestedUse: string;
  /** What the manufacturer positions it against. Not a PreSeed claim. */
  positivelyImpacts: string[];
  scientificRationale: string;
  /** Named strains, actives or ingredients, as published. */
  ingredients: string[];
  /** Quoted from the manufacturer where they state it. */
  evidenceLevel: string;
  /** The gap between the product's evidence and this product's domain. */
  limitations: string[];
  sourceUrl: string;
  /** Which contributor this is offered against. */
  contributorId: string;
};

export const supplementProducts: SupplementProduct[] = [
  {
    id: "winnow",
    brand: "Winnow Labs",
    name: "Winnow",
    tagline: "The Microplastic Binding Daily Probiotic",
    what: "Winnow is a daily probiotic containing three well-studied strains of lactobacillus bacteria. It is designed to bind microplastic particles in the gut so they pass through rather than being absorbed.",
    suggestedUse: "Follow the manufacturer's directions. A dose is not published on their science page.",
    positivelyImpacts: [
      "Microplastic clearance (preclinical)",
      "Digestive comfort",
      "Immune support",
    ],
    scientificRationale:
      "The proposed mechanism is adsorption. Microplastic particles moving through the gut stick to exopolysaccharides and S-layer proteins on the bacterial surface through electrostatic and hydrophobic interaction, and are then carried out in normal intestinal transit. The whole process is described as taking place inside the intestine.",
    ingredients: [
      "Lactobacillus rhamnosus (ATCC 53103)",
      "Lactobacillus reuteri (DSM 17938)",
      "Lactobacillus acidophilus (ATCC SD5212)",
    ],
    evidenceLevel:
      "The manufacturer describes the microplastic-binding mechanism as preclinical — laboratory work, not yet tested in people.",
    limitations: [
      "The randomised trials behind these strains cover digestive comfort, immune support and skin health. None of them measured a semen parameter.",
      "No study has shown that binding microplastics in the gut changes sperm concentration, motility or morphology.",
      "The manufacturer's science page links to PubMed searches rather than to specific papers, so the underlying studies have not been checked here.",
      "The microplastics evidence in male fertility is itself emerging: small samples, difficult exposure attribution, and no intervention data.",
    ],
    sourceUrl: "https://winnowlabs.com/pages/science",
    contributorId: "microplastics",
  },
];

export type SupplementCandidate = {
  id: string;
  name: string;
  /** Plain-language, for a reader who has never heard of it. */
  what: string;
  /** Dose used in the studies. Never phrased as an instruction. */
  studiedDose: string;
  /** Parameters the literature discusses. Not promised effects. */
  discussedFor: MarkerCode[];
  rationale: string;
  /** False for all of these, by design. */
  citationTraced: boolean;
  /** What would have to be true before this could ever be recommended. */
  blocker: string;
};

export const supplementCandidates: SupplementCandidate[] = [
  {
    id: "coq10",
    name: "Coenzyme Q10",
    what: "A compound your cells use to produce energy, and an antioxidant.",
    studiedDose: "200–300 mg daily in the trials",
    discussedFor: ["concentration_million_ml", "progressive_motility_pct", "total_motility_pct"],
    rationale:
      "Sperm tails are powered by mitochondria, which are vulnerable to oxidative damage. That is the mechanism the research is testing.",
    citationTraced: false,
    blocker:
      "The network meta-analysis estimates circulating for CoQ10 have not been traced back to their source papers in this prototype.",
  },
  {
    id: "l-carnitine",
    name: "L-carnitine",
    what: "An amino-acid derivative involved in moving fat into cells to be burned for energy.",
    studiedDose: "2–3 g daily in the trials",
    discussedFor: ["progressive_motility_pct", "total_motility_pct", "normal_morphology_pct"],
    rationale: "Concentrated in the epididymis, and studied for the same energy-supply reason.",
    citationTraced: false,
    blocker:
      "The 23-trial ranking supplied in the product brief has not been verified against the underlying studies.",
  },
  {
    id: "omega-3",
    name: "Omega-3",
    what: "Fats found in oily fish. Also available as a supplement.",
    discussedFor: ["concentration_million_ml", "total_count_million"],
    studiedDose: "About 1,840 mg daily over 32 weeks in one trial",
    rationale:
      "Sperm membranes are rich in these fats. Note that the dietary route — oily fish — has the stronger evidence and is already in your protocol.",
    citationTraced: false,
    blocker: "The trial has not been retrieved and checked in this prototype.",
  },
  {
    id: "selenium-vitamin-e",
    name: "Selenium with vitamin E",
    what: "Two antioxidants, usually studied together.",
    studiedDose: "Varies widely across the eight studies",
    discussedFor: ["progressive_motility_pct", "normal_morphology_pct"],
    rationale: "Same oxidative-stress mechanism as the others.",
    citationTraced: false,
    blocker:
      "Doses and effect sizes differ substantially between the studies, and none has been verified here.",
  },
];
