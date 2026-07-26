import { evidenceFixtures } from "./fixtures.js";
import { generationCases } from "./generation-cases.js";
import { aggregateGeneration, scoreGenerationCase } from "./grounding.js";
import { retrievalCases } from "./retrieval-cases.js";
import {
  aggregateRetrieval,
  retrieveDeterministically,
  scoreRetrievalCase,
} from "./retrieval.js";

const retrieval = retrievalCases.map((test) =>
  scoreRetrievalCase(
    test,
    retrieveDeterministically(test.question, evidenceFixtures),
  )
);
const generation = generationCases.map((test) =>
  scoreGenerationCase(test, evidenceFixtures)
);

console.log(JSON.stringify(
  {
    fixtureMode: "deterministic-lexical-baseline",
    warning:
      "These are evaluation-fixture metrics, not live pgvector or provider quality claims.",
    retrieval: { metrics: aggregateRetrieval(retrieval), cases: retrieval },
    generation: { metrics: aggregateGeneration(generation), cases: generation },
  },
  null,
  2,
));
