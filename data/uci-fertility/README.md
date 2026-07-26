# UCI Fertility benchmark fixture

This directory contains the UCI Machine Learning Repository Fertility dataset,
downloaded from:

<https://archive.ics.uci.edu/dataset/244/fertility>

- DOI: <https://doi.org/10.24432/C5Z01Z>
- Citation: Gil, D. & Girela, J. (2012). *Fertility* [Dataset]. UCI Machine
  Learning Repository.
- License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Retrieved: 2026-07-25
- Upstream file: `fertility_Diagnosis.txt`
- Instances: 100
- Features: 9
- Missing values: none, according to UCI

## Intended use in PreSeed

This is a tutorial-scale, highly imbalanced benchmark fixture for exercising
tabular ingestion, validation, evaluation splits, and safety messaging. It is
not a clinical training corpus, a VectorRAG evidence source, or a basis for an
individual fertility prediction.

The ten comma-separated columns are:

1. season
2. normalized age
3. childhood diseases
4. accident or serious trauma
5. surgical intervention
6. high fevers
7. alcohol consumption
8. smoking habit
9. normalized daily sitting time
10. diagnosis (`N` normal, `O` altered)

Refer to the upstream dataset page for the category encodings. Preserve the raw
values in this file; decoding belongs in a versioned loader.

## Restrictions

- Never present `diagnosis` as azoospermia or an endocrine diagnosis.
- Never use this fixture to claim clinical validity.
- Never blend these rows into the medical-evidence vector index.
- Preserve attribution in derivatives and reports.

