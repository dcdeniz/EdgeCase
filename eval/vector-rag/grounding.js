const numericPattern =
  /\b\d+(?:\.\d+)?(?:\s?%|\s?(?:week|weeks|year|years|participants|trials))?\b/gi;

function numbers(value) {
  return value.match(numericPattern)?.map((item) =>
    item.toLowerCase().replace(/\s+/g, " ")
  ) ?? [];
}

export function scoreGenerationCase(test, corpus) {
  const retrieved = new Set(test.retrievedEvidenceIds);
  const cited = new Set(test.answerEvidenceIds);
  const corpusById = new Map(corpus.map((item) => [item.id, item]));
  const material = test.claims.filter((claim) =>
    claim.classification === "evidence_backed"
  );
  const supported = material.filter((claim) =>
    claim.entailedBy.some((id) =>
      claim.citedEvidenceIds.includes(id) && retrieved.has(id)
    )
  );
  const claimsWithCompleteCitations = material.filter((claim) =>
    claim.entailedBy.length > 0 &&
    claim.entailedBy.every((id) => claim.citedEvidenceIds.includes(id))
  );
  const usefulCitations = [...cited].filter((id) =>
    material.some((claim) => claim.entailedBy.includes(id))
  );

  const incorrectNumericalClaims = material.filter((claim) => {
    const claimNumbers = numbers(claim.text);
    if (claimNumbers.length === 0) return false;
    const citedText = claim.citedEvidenceIds.map((id) =>
      corpusById.get(id)?.content ?? ""
    ).join(" ");
    const passageNumbers = new Set(numbers(citedText));
    return claimNumbers.some((number) => !passageNumbers.has(number));
  }).map((claim) => claim.text);

  return {
    caseId: test.id,
    citedEvidenceIds: test.answerEvidenceIds,
    citationIdsOutsideContext: test.answerEvidenceIds.filter((id) =>
      !retrieved.has(id)
    ),
    unsupportedClaims: material.filter((claim) => !supported.includes(claim))
      .map((claim) => claim.text),
    incorrectNumericalClaims,
    citationPrecision: cited.size === 0
      ? (material.length === 0 ? 1 : 0)
      : usefulCitations.length / cited.size,
    citationCompleteness: material.length === 0
      ? 1
      : claimsWithCompleteCitations.length / material.length,
    guidanceClearlyDistinguished: test.claims.every((claim) =>
      claim.classification === "evidence_backed" ||
      claim.citedEvidenceIds.length === 0
    ),
  };
}

export function aggregateGeneration(results) {
  return {
    cases: results.length,
    unsupportedClaimCount: results.reduce(
      (sum, result) => sum + result.unsupportedClaims.length,
      0,
    ),
    incorrectNumericalClaimCount: results.reduce(
      (sum, result) => sum + result.incorrectNumericalClaims.length,
      0,
    ),
    citationIdsOutsideContextCount: results.reduce(
      (sum, result) => sum + result.citationIdsOutsideContext.length,
      0,
    ),
    citationPrecision:
      results.reduce((sum, result) => sum + result.citationPrecision, 0) /
      results.length,
    citationCompleteness:
      results.reduce((sum, result) => sum + result.citationCompleteness, 0) /
      results.length,
    guidanceDistinctionRate:
      results.filter((result) => result.guidanceClearlyDistinguished).length /
      results.length,
  };
}
