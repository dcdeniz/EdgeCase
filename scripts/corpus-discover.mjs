import { mkdir, writeFile } from "node:fs/promises";

const api = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";
const oaApi = "https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi";
const perTopic = Number.parseInt(process.env.CORPUS_MAX_PER_TOPIC ?? "12", 10);

if (!Number.isInteger(perTopic) || perTopic < 1 || perTopic > 100) {
  throw new Error("CORPUS_MAX_PER_TOPIC must be an integer from 1 to 100.");
}

const topics = {
  measurement: '"semen analysis" AND (variability OR abstinence OR WHO)',
  supplements: '(antioxidant OR carnitine OR coenzyme Q10 OR omega-3) AND (sperm OR semen)',
  smoking_alcohol: '(smoking OR alcohol OR cannabis) AND (sperm OR semen)',
  weight_diet: '(obesity OR weight loss OR mediterranean diet) AND (sperm OR semen)',
  exercise_sleep_heat: '(exercise OR sleep OR heat exposure) AND (sperm OR semen)',
  environment: '(air pollution OR pesticide OR lead OR phthalate) AND (sperm OR semen)',
  endocrine_medication: '(testosterone OR endocrine OR medication) AND male infertility',
  dna_fragmentation: '"sperm DNA fragmentation"',
  vasectomy_reversal: '"vasectomy reversal"',
  oncofertility: '(oncofertility OR fertility preservation) AND (male OR sperm)',
};

const commercialLicenses = new Set(["CC0", "CC BY", "CC BY-SA", "CC BY-ND"]);
const animalOnly = /\b(mouse|mice|rat|rats|bull|boar|stallion|rooster|rabbit|livestock|bovine|porcine)\b/i;

async function fetchWithRetry(url) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "PreSeed corpus research prototype" },
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status} for ${url}`);
      if (response.status < 500 && response.status !== 429) throw lastError;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
  }
  throw lastError;
}

async function search(topic, expression) {
  const query = `OPEN_ACCESS:Y AND HAS_FT:Y AND SRC:MED AND (${expression})`;
  const url = new URL(api);
  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("resultType", "core");
  url.searchParams.set("pageSize", String(perTopic));
  url.searchParams.set("sort", "CITED desc");
  const response = await fetchWithRetry(url);
  const body = await response.json();
  return { query, hitCount: body.hitCount, rows: body.resultList?.result ?? [] };
}

async function resolveLicense(pmcid) {
  const url = new URL(oaApi);
  url.searchParams.set("id", pmcid);
  const response = await fetchWithRetry(url);
  const xml = await response.text();
  const record = xml.match(/<record\b([^>]*)>/)?.[1] ?? "";
  return {
    license: record.match(/\blicense="([^"]+)"/)?.[1] ?? null,
    retracted: record.match(/\bretracted="([^"]+)"/)?.[1] ?? null,
  };
}

function publicationTypes(row) {
  return row.pubTypeList?.pubType ?? [];
}

function score(row, license, excludedAnimal) {
  const types = publicationTypes(row).join(" ").toLowerCase();
  let value = 0;
  if (/systematic review|meta-analysis/.test(types)) value += 6;
  else if (/guideline|practice guideline/.test(types)) value += 6;
  else if (/randomized controlled trial|clinical trial/.test(types)) value += 5;
  else if (/review/.test(types)) value += 3;
  else value += 1;
  if (commercialLicenses.has(license)) value += 3;
  const citedBy = Number(row.citedByCount ?? 0);
  if (citedBy >= 100) value += 2;
  else if (citedBy >= 25) value += 1;
  if (excludedAnimal) value -= 10;
  return value;
}

const discovered = [];
const searches = [];
for (const [topic, expression] of Object.entries(topics)) {
  const result = await search(topic, expression);
  searches.push({ topic, query: result.query, hitCount: result.hitCount });
  for (const row of result.rows) {
    if (!row.pmcid) continue;
    discovered.push({ topic, row });
  }
}

const unique = new Map();
for (const item of discovered) {
  const current = unique.get(item.row.pmcid);
  if (current) current.topics.add(item.topic);
  else unique.set(item.row.pmcid, { row: item.row, topics: new Set([item.topic]) });
}

const candidates = [];
for (const [pmcid, { row, topics: matchedTopics }] of unique) {
  const rights = await resolveLicense(pmcid);
  const excludedAnimal = animalOnly.test(`${row.title ?? ""} ${row.authorString ?? ""}`);
  const eligibleLicense = commercialLicenses.has(rights.license);
  candidates.push({
    pmcid,
    pmid: row.pmid ?? null,
    doi: row.doi ?? null,
    title: row.title ?? null,
    authors: row.authorString ?? null,
    journal: row.journalTitle ?? null,
    publicationYear: row.pubYear ? Number(row.pubYear) : null,
    publicationTypes: publicationTypes(row),
    citedByCount: row.citedByCount ? Number(row.citedByCount) : null,
    topics: [...matchedTopics].sort(),
    license: rights.license,
    retracted: rights.retracted,
    fullTextUrl: `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`,
    excludedAnimalKeyword: excludedAnimal,
    commerciallyReusable: eligibleLicense,
    reviewState: eligibleLicense && rights.retracted !== "yes" && !excludedAnimal
      ? "candidate_needs_human_review"
      : "excluded_automatically",
    priorityScore: score(row, rights.license, excludedAnimal),
  });
}

candidates.sort((a, b) => b.priorityScore - a.priorityScore || a.pmcid.localeCompare(b.pmcid));
const snapshot = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceApis: [api, oaApi],
  licensePolicy: [...commercialLicenses],
  warning: "Discovery metadata only. No candidate is approved evidence until human claim review.",
  searches,
  candidates,
};

await mkdir(new URL("../data/corpus/", import.meta.url), { recursive: true });
await writeFile(new URL("../data/corpus/candidates.json", import.meta.url), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${candidates.length} unique candidates; ${candidates.filter((row) => row.reviewState.startsWith("candidate")).length} await review.`);
