export const retrievalCases = [
  {
    id: "direct-smoking",
    category: "direct",
    question: "What does the evidence say about smoking and semen quality?",
    expectedEvidenceIds: ["ev_smoking_meta_2016"],
    forbiddenEvidenceIds: ["eval_contradiction_smoking"],
  },
  {
    id: "paraphrase-weight",
    category: "paraphrased",
    question: "Could sustained weight reduction affect sperm amount?",
    expectedEvidenceIds: ["ev_weight_loss_rct_2022"],
  },
  {
    id: "misspelling-pollution",
    category: "misspelling",
    question: "does air polution lower progresive motillity?",
    expectedEvidenceIds: ["ev_air_pollution_meta_2023"],
  },
  {
    id: "informal-motility",
    category: "informal",
    question: "why are my swimmers not moving well?",
    expectedEvidenceIds: [
      "ev_antioxidant_nma_2022",
      "ev_smoking_meta_2016",
      "ev_air_pollution_meta_2023",
    ],
  },
  {
    id: "mechanism-oxidative",
    category: "mechanism",
    question: "How could oxidative stress affect movement?",
    expectedEvidenceIds: ["ev_air_pollution_meta_2023", "ev_smoking_meta_2016"],
  },
  {
    id: "parameter-concentration",
    category: "parameter-differentiation",
    question:
      "Which evidence is specifically about sperm concentration rather than shape?",
    expectedEvidenceIds: ["ev_weight_loss_rct_2022", "ev_antioxidant_nma_2022"],
  },
  {
    id: "parameter-motility",
    category: "parameter-differentiation",
    question: "Which evidence discusses motility rather than concentration?",
    expectedEvidenceIds: [
      "ev_antioxidant_nma_2022",
      "ev_smoking_meta_2016",
      "ev_air_pollution_meta_2023",
    ],
  },
  {
    id: "parameter-morphology",
    category: "parameter-differentiation",
    question: "What evidence addresses morphology or sperm shape?",
    expectedEvidenceIds: ["ev_antioxidant_nma_2022", "ev_smoking_meta_2016"],
  },
  {
    id: "parameter-dna-fragmentation",
    category: "parameter-differentiation",
    question: "What evidence explains high DNA fragmentation?",
    expectedEvidenceIds: [],
    expectEmpty: true,
  },
  {
    id: "distractor",
    category: "distractor",
    question: "Does smoking affect sperm motility?",
    expectedEvidenceIds: ["ev_smoking_meta_2016"],
    forbiddenEvidenceIds: [
      "eval_distractor_female_ivf",
      "eval_contradiction_smoking",
    ],
  },
  {
    id: "contradiction",
    category: "contradictory",
    question: "Does smoking improve motility and guarantee pregnancy?",
    expectedEvidenceIds: ["ev_smoking_meta_2016"],
    forbiddenEvidenceIds: ["eval_contradiction_smoking"],
  },
  {
    id: "unsupported-folate",
    category: "unsupported",
    question: "What exact folate dose guarantees pregnancy?",
    expectedEvidenceIds: [],
    expectEmpty: true,
  },
];
