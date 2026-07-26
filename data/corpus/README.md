# PreSeed corpus candidate dataset

This directory is the output of metadata-only corpus discovery. It is upstream
of, and deliberately separate from, the VectorRAG implementation.

## Reproduce

```sh
CORPUS_MAX_PER_TOPIC=12 npm run corpus:discover
npm run corpus:analyze
```

Discovery searches Europe PMC across ten product domains, deduplicates by
PMCID, resolves article-level reuse licences through the PMC Open Access API,
excludes retracted records and obvious animal-only titles, and prioritizes
review/guideline/trial metadata. Network calls have bounded timeouts and retry
transient failures.

## Files

- `candidates.json`: source queries, hit counts, identifiers, licences,
  publication metadata, topic assignments, review state and heuristic score.
- `profile.md`: coverage, licence and publication-type summary plus known bias.
- `fulltext-manifest.json`: hashes and provenance for locally fetched sources;
  the corresponding BioC documents and generated `review-queue.json` are
  gitignored working files.
- `approved-claims.json`: the only tracked handoff to privileged publication;
  every entry requires an explicit named human review confirmation.

## Interpretation

A high score means “review this candidate sooner,” not “scientifically true.”
Every retained record remains `candidate_needs_human_review`. Automated filters
cannot establish the participant population, endpoint relevance, methods,
effect validity or clinical applicability.

## RAG boundary

This dataset contains no article full text, extracted claims, chunks, embeddings
or Supabase rows. Moving a candidate beyond this directory requires human review
and a separately approved evidence-ingestion implementation.
