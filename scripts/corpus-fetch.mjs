import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const candidatesPath = new URL("../data/corpus/candidates.json", import.meta.url);
const outputDirectory = new URL("../data/corpus/fulltext/", import.meta.url);
const manifestPath = new URL("../data/corpus/fulltext-manifest.json", import.meta.url);
const limit = Number.parseInt(process.env.CORPUS_FETCH_LIMIT ?? "50", 10);
if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
  throw new Error("CORPUS_FETCH_LIMIT must be an integer from 1 to 500.");
}

const snapshot = JSON.parse(await readFile(candidatesPath, "utf8"));
const candidates = snapshot.candidates
  .filter((row) => row.reviewState === "candidate_needs_human_review")
  .slice(0, limit);

async function fetchWithRetry(url) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "PreSeed evidence curation prototype" },
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status} for ${url}`);
      if (response.status < 500 && response.status !== 429) throw lastError;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
  }
  throw lastError;
}

await mkdir(outputDirectory, { recursive: true });
const sources = [];
for (const candidate of candidates) {
  const url = `https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_json/${candidate.pmcid}/unicode`;
  const response = await fetchWithRetry(url);
  const text = await response.text();
  const payload = JSON.parse(text);
  const collection = Array.isArray(payload) ? payload[0] : payload;
  const document = collection?.documents?.[0];
  if (!document || document.id !== candidate.pmcid) {
    throw new Error(`BioC document identity mismatch for ${candidate.pmcid}`);
  }
  const contentHash = createHash("sha256").update(text).digest("hex");
  await writeFile(new URL(`${candidate.pmcid}.json`, outputDirectory), `${JSON.stringify(payload)}\n`, { flag: "w" });
  sources.push({
    pmcid: candidate.pmcid,
    pmid: candidate.pmid,
    doi: candidate.doi,
    title: candidate.title,
    license: candidate.license,
    topics: candidate.topics,
    sourceUrl: candidate.fullTextUrl,
    retrievalUrl: url,
    contentSha256: contentHash,
    bytes: Buffer.byteLength(text),
    fetchedAt: new Date().toISOString(),
  });
}

await writeFile(manifestPath, `${JSON.stringify({ schemaVersion: 1, sources }, null, 2)}\n`);
console.log(`Fetched ${sources.length} licensed BioC documents; full text remains gitignored.`);
