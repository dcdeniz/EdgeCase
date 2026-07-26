# Vector RAG retrieval and grounding evaluation

This isolated harness stress-tests retrieval quality and grounded generation. It
does not test concurrency, load, authentication, or medical policy behavior. It
does not modify production prompts, thresholds, evidence, or API code.

## Run

```bash
deno test --config supabase/functions/api/deno.json eval/vector-rag/eval_test.js
deno run eval/vector-rag/run.js
```

The runner prints per-case records and aggregate JSON. Keep the full case output
as an evaluation artifact when comparing retrieval or model versions.

## Evaluation boundary

Retrieval and generation are evaluated separately:

- Retrieval cases record the ranked top-k evidence IDs, deterministic similarity
  scores, expected IDs, hit@k, reciprocal rank, false positives, forbidden
  distractor/contradiction retrievals, and unsupported-query empty behavior.
- Generation cases record cited IDs, IDs outside retrieved context, claim-level
  entailment annotations, incorrect numerical claims, citation
  precision/completeness, and whether general guidance is visibly uncited.

The checked-in baseline uses a deterministic lexical retriever over a copy of
the six reviewed seed passages. Two synthetic passages test distractor and
contradiction behavior and are marked `eval_*`; they must never be ingested. The
baseline is stable and needs no API key or generated embeddings, but it is not a
measurement of production pgvector recall. To evaluate a live retriever,
preserve the case definitions and pass its ranked IDs and cosine scores to
`scoreRetrievalCase`.

Generation scoring is deterministic because every material claim is explicitly
annotated with the passages that entail it. This avoids using another language
model as an unreviewed judge. Real provider answers require claim segmentation
and human entailment annotation before scoring; the harness must not infer that
a claim is supported merely because its citation ID was retrieved.

## Current weaknesses exposed

1. Production retrieval always requests six matches and `match_evidence` has no
   minimum similarity threshold. With six embedded seed rows, every
   question—including unsupported questions—can return the entire library. Empty
   retrieval is therefore effectively unavailable once all seeds are indexed.
2. The reviewed corpus has no DNA-fragmentation-specific chunk. A
   DNA-fragmentation question cannot have a correct positive retrieval under the
   present library.
3. Concentration, motility, and morphology share broad evidence chunks.
   Parameter differentiation is ambiguous and false-positive retrievals are
   expected.
4. The production output schema constrains citation IDs to retrieved IDs, but it
   does not represent claim-to-citation links or evidence-backed versus
   general-guidance classification. Server validation therefore cannot establish
   that every material claim is entailed.
5. Numeric and bibliographic fabrication are not checked by the production
   validator. The deterministic generation fixtures demonstrate that
   schema-valid, allow-listed output can still contain an unsupported figure,
   author, paper, or conclusion.

## Recommendations (do not apply as test-tuning)

1. Add a post-retrieval abstention policy based on a separately calibrated
   similarity threshold and/or relevance reranker. Evaluate it on supported and
   unsupported questions before changing production.
2. Expand reviewed evidence with parameter-specific chunks, especially DNA
   fragmentation, and include explicit contradictory/limitation passages where
   the literature differs.
3. Extend the response contract to return atomic claims with per-claim evidence
   IDs and an explicit `evidence_backed` or `general_guidance` classification.
4. Add a deterministic server-side verification pass for numerical tokens and
   citation metadata; require every evidence-backed number and bibliographic
   assertion to appear in its cited passage metadata.
5. Add a human-reviewed entailment set from real provider outputs and report
   results by question category rather than relying only on aggregate scores.

## Assumptions and limitations

- The migration seed text is the canonical evidence corpus as of 2026-07-25.
- Synthetic fixtures contain no real health data and make no publication-ready
  medical claims.
- No live embeddings or provider calls are made, because generated embeddings
  must not be committed and the repository records that provider/index
  configuration is incomplete.
- NEAT discovery snapshot identified the RAG files, but the registered daemon
  query endpoint was unreachable during this evaluation.
