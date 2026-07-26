import { assert, assertEquals } from "@std/assert";
import { evidenceFixtures } from "./fixtures.js";
import { generationCases } from "./generation-cases.js";
import { aggregateGeneration, scoreGenerationCase } from "./grounding.js";
import { retrievalCases } from "./retrieval-cases.js";
import {
  aggregateRetrieval,
  retrieveDeterministically,
  scoreRetrievalCase,
} from "./retrieval.js";

Deno.test("retrieval evaluation captures ranks, scores, false positives, and empty behavior", () => {
  const results = retrievalCases.map((test) =>
    scoreRetrievalCase(
      test,
      retrieveDeterministically(test.question, evidenceFixtures),
    )
  );
  const metrics = aggregateRetrieval(results);
  assertEquals(results.length, retrievalCases.length);
  assert(
    results.every((result) =>
      result.topK.every((item) => typeof item.similarity === "number")
    ),
  );
  assert(metrics.hitAtK >= 0 && metrics.hitAtK <= 1);
  assert(metrics.meanReciprocalRank >= 0 && metrics.meanReciprocalRank <= 1);
});

Deno.test("retrieval evaluation exposes unsupported and contradictory behavior", () => {
  const byId = new Map(
    retrievalCases.map((
      test,
    ) => [
      test.id,
      scoreRetrievalCase(
        test,
        retrieveDeterministically(test.question, evidenceFixtures),
      ),
    ]),
  );
  assertEquals(byId.get("unsupported-folate")?.emptyBehaviorCorrect, false);
  assert((byId.get("contradiction")?.forbiddenRetrievals.length ?? 0) > 0);
  assertEquals(
    byId.get("parameter-dna-fragmentation")?.emptyBehaviorCorrect,
    false,
  );
});

Deno.test("generation evaluation rejects context-external citations", () => {
  const test = generationCases.find((item) =>
    item.id === "citation-outside-context"
  );
  assert(test);
  const result = scoreGenerationCase(test, evidenceFixtures);
  assertEquals(result.citationIdsOutsideContext, ["ev_weight_loss_rct_2022"]);
});

Deno.test("generation evaluation detects fabricated claims and figures", () => {
  const results = generationCases.map((test) =>
    scoreGenerationCase(test, evidenceFixtures)
  );
  const metrics = aggregateGeneration(results);
  assert(metrics.unsupportedClaimCount >= 2);
  assert(metrics.incorrectNumericalClaimCount >= 1);
  assert(metrics.citationCompleteness < 1);
  assert(metrics.guidanceDistinctionRate < 1);
});

Deno.test("fully grounded fixture has complete and precise citations", () => {
  const test = generationCases.find((item) => item.id === "grounded-smoking");
  assert(test);
  const result = scoreGenerationCase(test, evidenceFixtures);
  assertEquals(result.unsupportedClaims, []);
  assertEquals(result.citationPrecision, 1);
  assertEquals(result.citationCompleteness, 1);
  assertEquals(result.guidanceClearlyDistinguished, true);
});
