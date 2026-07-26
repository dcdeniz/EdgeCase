import { readFile, writeFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../data/corpus/fulltext-manifest.json", import.meta.url), "utf8"));
const output = [];
const excludedSections = new Set(["REF", "REFERENCES", "ACK_FUND", "AUTH_CONT"]);

function normalize(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function passagesFor(payload) {
  const collection = Array.isArray(payload) ? payload[0] : payload;
  return collection?.documents?.flatMap((document) => document.passages ?? []) ?? [];
}

for (const source of manifest.sources) {
  const payload = JSON.parse(await readFile(new URL(`../data/corpus/fulltext/${source.pmcid}.json`, import.meta.url), "utf8"));
  const passages = passagesFor(payload)
    .map((passage) => ({
      text: normalize(passage.text),
      section: normalize(passage.infons?.section_type || passage.infons?.type || "UNKNOWN").toUpperCase(),
      offset: Number(passage.offset ?? 0),
    }))
    .filter((passage) => passage.text.length >= 80 && !excludedSections.has(passage.section));

  let chunk = null;
  let index = 0;
  const flush = () => {
    if (!chunk || chunk.text.length < 200) {
      chunk = null;
      return;
    }
    output.push({
      candidateId: `candidate_${source.pmcid.toLowerCase()}_${String(index++).padStart(3, "0")}`,
      pmcid: source.pmcid,
      pmid: source.pmid,
      doi: source.doi,
      title: source.title,
      sourceUrl: source.sourceUrl,
      sourceLicense: source.license,
      topics: source.topics,
      sourceLocator: `BioC ${chunk.section}; offsets ${chunk.startOffset}-${chunk.endOffset}`,
      content: chunk.text,
      reviewStatus: "candidate",
      humanReviewConfirmed: false,
      reviewer: null,
      evidenceLevel: null,
      limitations: [],
      productAction: null,
    });
    chunk = null;
  };

  for (const passage of passages) {
    if (!chunk) {
      chunk = { section: passage.section, text: passage.text, startOffset: passage.offset, endOffset: passage.offset + passage.text.length };
      continue;
    }
    if (chunk.section !== passage.section || chunk.text.length + passage.text.length > 2400) flush();
    if (!chunk) {
      chunk = { section: passage.section, text: passage.text, startOffset: passage.offset, endOffset: passage.offset + passage.text.length };
    } else {
      chunk.text += ` ${passage.text}`;
      chunk.endOffset = passage.offset + passage.text.length;
    }
  }
  flush();
}

await writeFile(new URL("../data/corpus/review-queue.json", import.meta.url), `${JSON.stringify({ schemaVersion: 1, warning: "Unreviewed source passages. Never ingest directly.", candidates: output }, null, 2)}\n`);
console.log(`Prepared ${output.length} unapproved passages for human review.`);
