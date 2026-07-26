export const generationCases = [
  {
    id: "grounded-smoking",
    retrievedEvidenceIds: ["ev_smoking_meta_2016"],
    answerEvidenceIds: ["ev_smoking_meta_2016"],
    claims: [
      {
        text:
          "Smoking was associated with lower count, motility and morphology.",
        citedEvidenceIds: ["ev_smoking_meta_2016"],
        classification: "evidence_backed",
        entailedBy: ["ev_smoking_meta_2016"],
      },
      {
        text: "Consider discussing smoking cessation support with a clinician.",
        citedEvidenceIds: [],
        classification: "general_guidance",
        entailedBy: [],
      },
    ],
  },
  {
    id: "citation-outside-context",
    retrievedEvidenceIds: ["ev_smoking_meta_2016"],
    answerEvidenceIds: ["ev_smoking_meta_2016", "ev_weight_loss_rct_2022"],
    claims: [{
      text: "Smoking was associated with lower motility.",
      citedEvidenceIds: ["ev_smoking_meta_2016"],
      classification: "evidence_backed",
      entailedBy: ["ev_smoking_meta_2016"],
    }],
  },
  {
    id: "fabricated-figure",
    retrievedEvidenceIds: ["ev_weight_loss_rct_2022"],
    answerEvidenceIds: ["ev_weight_loss_rct_2022"],
    claims: [{
      text: "Weight loss improved concentration by 73% in 9,000 participants.",
      citedEvidenceIds: ["ev_weight_loss_rct_2022"],
      classification: "evidence_backed",
      entailedBy: [],
    }],
  },
  {
    id: "fabricated-paper-author-conclusion",
    retrievedEvidenceIds: ["ev_sleep_testosterone_2011"],
    answerEvidenceIds: ["ev_sleep_testosterone_2011"],
    claims: [{
      text:
        "The fictional Smith fertility trial proved that sleep cures low sperm count.",
      citedEvidenceIds: ["ev_sleep_testosterone_2011"],
      classification: "evidence_backed",
      entailedBy: [],
    }],
  },
  {
    id: "incomplete-citations",
    retrievedEvidenceIds: [
      "ev_smoking_meta_2016",
      "ev_air_pollution_meta_2023",
    ],
    answerEvidenceIds: ["ev_smoking_meta_2016"],
    claims: [{
      text: "Smoking and air pollution are associated with lower motility.",
      citedEvidenceIds: ["ev_smoking_meta_2016"],
      classification: "evidence_backed",
      entailedBy: ["ev_smoking_meta_2016", "ev_air_pollution_meta_2023"],
    }],
  },
  {
    id: "guidance-not-distinguished",
    retrievedEvidenceIds: ["ev_air_pollution_meta_2023"],
    answerEvidenceIds: ["ev_air_pollution_meta_2023"],
    claims: [{
      text: "Buy a HEPA purifier today.",
      citedEvidenceIds: ["ev_air_pollution_meta_2023"],
      classification: "general_guidance",
      entailedBy: [],
    }],
  },
  {
    id: "unsupported-library-question",
    retrievedEvidenceIds: [],
    answerEvidenceIds: [],
    claims: [{
      text:
        "The reviewed library does not contain evidence for an exact folate dose.",
      citedEvidenceIds: [],
      classification: "general_guidance",
      entailedBy: [],
    }],
  },
];
