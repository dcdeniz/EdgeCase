# UCI Fertility data profile

## Shape and target

- Rows: 100
- Unique rows: 100
- Exact duplicate rows: 0
- Normal target: 88 (88.0%)
- Altered target: 12 (12.0%)
- Majority-class accuracy baseline: 88.0%

## Feature profile

| Feature | Min | Max | Overall mean | Normal mean | Altered mean |
|---|---:|---:|---:|---:|---:|
| season | -1 | 1 | -0.079 | -0.135 | 0.334 |
| age_normalized | 0.5 | 1 | 0.669 | 0.664 | 0.707 |
| childhood_diseases | 0 | 1 | 0.870 | 0.875 | 0.833 |
| accident | 0 | 1 | 0.440 | 0.466 | 0.250 |
| surgery | 0 | 1 | 0.510 | 0.500 | 0.583 |
| high_fevers | -1 | 1 | 0.190 | 0.216 | 0.000 |
| alcohol | 0.2 | 1 | 0.832 | 0.841 | 0.767 |
| smoking | -1 | 1 | -0.350 | -0.364 | -0.250 |
| sitting_normalized | 0.06 | 1 | 0.407 | 0.405 | 0.418 |

## Data-science interpretation

- The 88:12 target imbalance makes raw accuracy misleading; any future tutorial evaluation must use stratification and report balanced accuracy, recall, precision and calibration.
- One hundred observations are inadequate for a clinically generalizable model or stable subgroup estimates.
- Features are pre-normalized and use ordinal encodings whose distances are not necessarily clinically meaningful.
- The target is normal/altered seminal quality, not azoospermia, endocrine disease, conception or live birth.
- This dataset is retained as an ingestion and evaluation fixture only; no predictive model is fitted here.
