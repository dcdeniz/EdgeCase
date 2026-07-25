# Research

This directory contains the evidence base used to shape EdgeCase product hypotheses. Research documents inform product design but are not canonical implementation contracts and do not replace clinical guidelines or professional medical advice.

## Documents

- [Male fertility evidence landscape](male-fertility-evidence-landscape.md): evidence tiers, candidate inputs, datasets, modelling boundaries, and primary sources for a male reproductive-health readiness product.
- [Male fertility evidence supplement](male-fertility-evidence-supplement.md): effect sizes, intervention protocols, verified references, and gaps that still need verification.
- [Evidence registry v0.1.0](evidence-registry.v0.1.0.json): machine-readable,
  allow-listed sources referenced by the first deterministic readiness rules.
- [PreSeed ML workspace](../../ml/README.md): reproducible VISEM progressive-motility
  baseline plus the UCI normal/altered screening experiment, source-data boundaries,
  promotion gates, and model-card workflow.

## Evidence conventions

Each product claim should identify:

1. the measured outcome, such as sperm concentration, motility, morphology, DNA fragmentation, time to pregnancy, or live birth;
2. the study design and population;
3. whether the result is causal, observational, mechanistic, or predictive;
4. an evidence-confidence label;
5. the source and date last reviewed; and
6. whether the finding supports coaching, risk estimation, a measurement adjustment, or clinical escalation.

Use these working evidence labels:

- **Established clinical determinant**: suitable for a prominent warning or clinician-directed pathway.
- **Supported modifiable factor**: consistent human evidence, sometimes including intervention studies.
- **Emerging association**: plausible human evidence that remains limited, heterogeneous, or observational.
- **Insufficient for scoring**: conflicting, preclinical, or inadequately measured evidence.
- **Measurement modifier**: affects semen collection, analysis, or interpretation rather than necessarily changing underlying reproductive health.

The labels are product-research shorthand, not formal GRADE ratings. Scores and recommendations must expose uncertainty and must not convert an association into an individualized causal effect.

## Maintenance

- Prefer guidelines, systematic reviews, meta-analyses, randomized trials, and prospective cohorts.
- Record the endpoint studied; do not use `fertility` as a substitute for a specific endpoint.
- Keep clinical measurements separate from predicted risk and behaviour-readiness scores.
- Date material reviews and re-review fast-moving topics such as microplastics, endocrine-disrupting chemicals, peptides, and wearable-derived biomarkers.
- Require clinical review before a research claim becomes a user-facing medical recommendation.
