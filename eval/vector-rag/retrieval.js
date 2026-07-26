const aliases = {
  swimmers: "motility",
  swimming: "motility",
  moving: "motility",
  movement: "motility",
  shape: "morphology",
  shapes: "morphology",
  amount: "concentration",
  density: "concentration",
  fragmented: "fragmentation",
  damaged: "fragmentation",
  dna: "fragmentation",
  cigs: "smoking",
  cigarettes: "smoking",
  smoke: "smoking",
  pollution: "pollution",
  mitochondria: "motility",
};

function words(value) {
  return value.toLowerCase().replace(/[^a-z0-9.]+/g, " ").trim().split(/\s+/)
    .filter(Boolean);
}

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const old = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = old;
    }
  }
  return row[b.length];
}

function canonicalTokens(value) {
  return new Set(words(value).map((token) => aliases[token] ?? token));
}

/** Deterministic lexical baseline, not a replacement for production embeddings. */
export function retrieveDeterministically(
  question,
  corpus,
  topK = 6,
  minimumSimilarity = 0.08,
) {
  const query = canonicalTokens(question);
  return corpus.map((item) => {
    const tagTokens = canonicalTokens(item.tags.join(" "));
    const bodyTokens = canonicalTokens(`${item.title} ${item.content}`);
    let tagHits = 0;
    let bodyHits = 0;
    for (const queryToken of query) {
      const fuzzyTag = [...tagTokens].some((token) =>
        queryToken.length >= 5 && editDistance(queryToken, token) <= 2
      );
      const fuzzyBody = [...bodyTokens].some((token) =>
        queryToken.length >= 5 && editDistance(queryToken, token) <= 1
      );
      if (tagTokens.has(queryToken) || fuzzyTag) tagHits += 1;
      else if (bodyTokens.has(queryToken) || fuzzyBody) bodyHits += 1;
    }
    const similarity = query.size === 0
      ? 0
      : (tagHits * 1.5 + bodyHits * 0.5) / query.size;
    return { id: item.id, similarity: Number(similarity.toFixed(4)) };
  }).filter((item) => item.similarity >= minimumSimilarity)
    .sort((a, b) => b.similarity - a.similarity || a.id.localeCompare(b.id))
    .slice(0, topK);
}

export function scoreRetrievalCase(test, ranked) {
  const ids = ranked.map((item) => item.id);
  const expected = new Set(test.expectedEvidenceIds);
  const firstRelevant = ids.findIndex((id) => expected.has(id));
  return {
    caseId: test.id,
    category: test.category,
    topK: ranked,
    expectedEvidenceIds: test.expectedEvidenceIds,
    hitAtK: test.expectedEvidenceIds.length === 0
      ? 0
      : Number(ids.some((id) => expected.has(id))),
    reciprocalRank: firstRelevant < 0 ? 0 : 1 / (firstRelevant + 1),
    falsePositiveRetrievals: ids.filter((id) => !expected.has(id)),
    forbiddenRetrievals: ids.filter((id) =>
      test.forbiddenEvidenceIds?.includes(id)
    ),
    emptyBehaviorCorrect: test.expectEmpty ? ranked.length === 0 : true,
  };
}

export function aggregateRetrieval(results) {
  const supported = results.filter((result) =>
    result.expectedEvidenceIds.length > 0
  );
  const empty = results.filter((result) =>
    result.expectedEvidenceIds.length === 0
  );
  return {
    cases: results.length,
    hitAtK: supported.length
      ? supported.reduce((sum, result) => sum + result.hitAtK, 0) /
        supported.length
      : 0,
    meanReciprocalRank: supported.length
      ? supported.reduce((sum, result) => sum + result.reciprocalRank, 0) /
        supported.length
      : 0,
    falsePositiveCount: results.reduce(
      (sum, result) => sum + result.falsePositiveRetrievals.length,
      0,
    ),
    forbiddenRetrievalCount: results.reduce(
      (sum, result) => sum + result.forbiddenRetrievals.length,
      0,
    ),
    emptyAccuracy: empty.length
      ? empty.filter((result) => result.emptyBehaviorCorrect).length /
        empty.length
      : 1,
  };
}
