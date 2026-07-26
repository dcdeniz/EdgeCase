# Parameter contributors

- Status: Implemented in `src/lib/contributors.ts`
- Last reviewed: 2026-07-25
- Surfaces: Today (compact), marker detail, ParameterReasoning

Attribution from a user's own inputs to the semen parameters those exposures are
associated with. Extends `ParameterReasoning` — it does not replace it.

## The three rules

1. **Association, never causation.** The underlying evidence is observational.
   Copy says *associated with*. "Your smoking caused your low count" is not a
   claim this product can make and would misstate the evidence.
2. **No independent dials.** Concentration, motility, morphology and DFI share
   upstream mechanisms — chiefly oxidative stress and the HPG axis. Contributors
   are listed as shared influences and never decompose a deficit into parts.
3. **Every contributor carries a real, allow-listed citation.** `evidenceId`
   must resolve in the evidence library. Cards that are not `internal_review`
   render as candidates and are excluded from recommendations.

No citation in this table was generated. Each is already carried in
[the evidence landscape](../research/male-fertility-evidence-landscape.md).

## Mapping

| Contributor | Trigger | Parameters | Mechanism | Evidence | Strength |
| --- | --- | --- | --- | --- | --- |
| Cigarette smoking | `smoking` = under10 \| over10 | Concentration, count, motility, morphology, DFI | Oxidative stress | `smoking-umbrella` | Consistent |
| Alcohol | `alcoholUnits` = 8to14 \| over14 | Core semen parameters | Oxidative stress; Sertoli/Leydig function | `alcohol-umbrella` | Probable |
| Air pollution | `exposures` ∋ air_quality | Core semen parameters | Oxidative stress, inflammatory load | `air-pollution-sr` | Consistent |
| Pesticides | `exposures` ∋ pesticides | Concentration, motility, morphology | Endocrine disruption | `pesticide-sr` | Probable |
| Metals and chemicals | `exposures` ∋ chemicals | Core semen parameters | Endocrine disruption | `lead-ma` | Consistent |
| Microplastics | `exposures` ∋ plastics | Concentration, motility | Endocrine disruption | `microplastics-sr` | **Emerging** |
| Scrotal heat | `heatExposure` non-empty | Concentration, count, progressive motility | Thermoregulation | `heat-umbrella` | Probable |
| Short sleep | Wearable 14-night mean < 6.5h | Concentration, count | HPG axis; context only | `sleep-circadian-sr` | Probable |
| Western diet pattern | Food-log day score < 50 | Core semen parameters | Oxidative stress | `diet-pattern-sr` | Probable |

## Sources

Carried from the research base, not introduced here:

- Smoking umbrella review — <https://pmc.ncbi.nlm.nih.gov/articles/PMC13258348/>
- Alcohol umbrella review — <https://pmc.ncbi.nlm.nih.gov/articles/PMC13258348/>
- Outdoor air pollution SR/MA — <https://pubmed.ncbi.nlm.nih.gov/40082868/>
- Human pesticide systematic review — <https://pmc.ncbi.nlm.nih.gov/articles/PMC9541307/>
- Lead and semen quality meta-analysis — <https://pubmed.ncbi.nlm.nih.gov/41370422/>
- Microplastic reproductive outcomes SR — <https://pubmed.ncbi.nlm.nih.gov/38287142/>
- Plastic tableware and seminal microplastics — <https://pmc.ncbi.nlm.nih.gov/articles/PMC12512996/>
- Sleep and circadian SR/MA — <https://pmc.ncbi.nlm.nih.gov/articles/PMC9326175/>

## Deliberately excluded

- **Numeric attribution.** No contributor states how many points of a parameter
  it accounts for. The evidence does not support it at individual level.
- **Ranking by effect size.** Contributors sort by evidence strength, not by
  estimated impact on this user.
- **Microplastics as an actionable driver.** Real literature, but small samples,
  difficult source attribution and no intervention evidence. Surfaced so the
  user is not kept in the dark; marked so it cannot drive a recommendation.
- **WBC as a lifestyle target.** Raised peroxidase-positive leukocytes route to
  a clinician. No contributor attaches to it.
