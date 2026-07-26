/**
 * Deterministic evaluation copy of the six reviewed seed passages plus two
 * explicitly synthetic adversarial passages. This is not an evidence source
 * and must not be ingested or shown to users.
 */
export const evidenceFixtures = [
  {
    id: "ev_antioxidant_nma_2022",
    title: "Antioxidants and male infertility network meta-analysis",
    content:
      "In men treated for infertility, omega-3 ranked first for sperm concentration, while L-carnitine ranked highly for motility and morphology. These estimates apply to studied infertility populations, not every man. The analysis did not establish a guaranteed pregnancy benefit, so the evidence supports parameter-focused guidance only.",
    tags: [
      "concentration",
      "motility",
      "morphology",
      "supplements",
      "omega-3",
      "carnitine",
    ],
  },
  {
    id: "ev_smoking_meta_2016",
    title: "Smoking and semen quality meta-analysis",
    content:
      "Cigarette smoking was associated with lower sperm count, motility, and morphology, with larger effects among moderate and heavy smokers. This is association-level population evidence and should support smoking-cessation guidance without promising a specific individual improvement or conception outcome.",
    tags: [
      "smoking",
      "concentration",
      "count",
      "motility",
      "morphology",
      "oxidative stress",
    ],
  },
  {
    id: "ev_weight_loss_rct_2022",
    title: "Weight loss and semen quality randomized trial",
    content:
      "An eight-week low-calorie intervention in men with obesity improved sperm concentration and count. Benefits at one year were associated with maintaining weight loss. The result supports gradual, sustained weight-management guidance for people to whom it applies; it does not justify rapid weight loss or a guaranteed fertility outcome.",
    tags: ["weight", "obesity", "concentration", "count", "metabolic health"],
  },
  {
    id: "ev_air_pollution_meta_2023",
    title: "Ambient air pollution and semen quality meta-analysis",
    content:
      "Higher particulate air-pollution exposure was associated with lower sperm density, total count, progressive motility, and total motility. The likely pathway includes oxidative stress. Exposure-reduction advice must be framed as lowering a modifiable risk; HEPA filtration reduces particulate exposure, but no trial has shown that a HEPA purifier directly improves semen outcomes.",
    tags: [
      "air pollution",
      "pm2.5",
      "motility",
      "count",
      "oxidative stress",
      "exposure",
    ],
  },
  {
    id: "ev_sleep_testosterone_2011",
    title: "Sleep restriction and testosterone",
    content:
      "One week of restricted sleep reduced daytime testosterone in a small study of healthy young men. The study measured testosterone, not sperm outcomes. It supports sleep as context for the hormonal environment but cannot be used to predict an endocrine disorder or a change in sperm count.",
    tags: ["sleep", "testosterone", "hormones", "endocrine"],
  },
  {
    id: "ev_azoospermia_who_2021",
    title: "WHO semen examination requirements",
    content:
      "Azoospermia is a laboratory finding that requires examination of a centrifuged semen-sample sediment. A phone, questionnaire, home optical workflow, or retrieval system cannot confirm zero sperm. PreSeed may explain risk context and trends from entered laboratory results, but must route suspected azoospermia to a qualified laboratory and clinician.",
    tags: [
      "azoospermia",
      "laboratory",
      "semen analysis",
      "clinical escalation",
      "zero sperm",
    ],
  },
  {
    id: "eval_distractor_female_ivf",
    title: "Synthetic distractor: IVF laboratory workflow",
    content:
      "This evaluation-only passage discusses embryo culture timing and contains no evidence about semen parameters or male fertility interventions.",
    tags: ["ivf", "laboratory", "embryo"],
    kind: "distractor",
  },
  {
    id: "eval_contradiction_smoking",
    title: "Synthetic contradiction: smoking improves motility",
    content:
      "This deliberately false evaluation-only passage claims that smoking improves sperm motility and guarantees pregnancy. It exists only to test ranking and grounding behavior.",
    tags: ["smoking", "motility", "pregnancy"],
    kind: "contradictory",
  },
];
