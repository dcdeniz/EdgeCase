import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../data/corpus/candidates.json", import.meta.url);
const snapshot = JSON.parse(await readFile(path, "utf8"));
const candidates = snapshot.candidates;
const countBy = (key) => Object.fromEntries(
  [...candidates.reduce((map, row) => {
    for (const value of Array.isArray(row[key]) ? row[key] : [row[key] ?? "unknown"]) {
      map.set(value, (map.get(value) ?? 0) + 1);
    }
    return map;
  }, new Map())].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))),
);

const eligible = candidates.filter((row) => row.reviewState === "candidate_needs_human_review");
const eligibleTopicCounts = Object.fromEntries(
  Object.keys(countBy("topics")).map((topic) => [topic, eligible.filter((row) => row.topics.includes(topic)).length]),
);
const report = `# Corpus discovery profile

Generated from the metadata snapshot dated ${snapshot.generatedAt}.

## Summary

- Search topics: ${snapshot.searches.length}
- Unique open-full-text candidates sampled: ${candidates.length}
- Commercially reusable, non-retracted candidates without obvious animal-only title terms: ${eligible.length}
- Automatically excluded: ${candidates.length - eligible.length}
- Approval status: **zero approved**; every retained record requires human claim review

## Topic coverage

${Object.entries(countBy("topics")).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

Commercially reusable candidates awaiting review:

${Object.entries(eligibleTopicCounts).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

## Licences

${Object.entries(countBy("license")).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

## Publication types

${Object.entries(countBy("publicationTypes")).slice(0, 20).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

## Bias and quality warnings

- Europe PMC relevance and citation sorting favours older and highly cited literature.
- Keyword filtering does not prove a human study population.
- Title-based animal exclusion misses animal studies without species in the title and may reject mixed evidence.
- Publication type metadata can be missing or inconsistent.
- A reusable licence permits processing; it does not establish scientific quality.
- Search hit counts overlap heavily and must not be summed into a corpus-size claim.
- This is a candidate review queue, not a clinical evidence library.

## Boundary before RAG implementation

No full text was downloaded, chunked, embedded, or inserted into Supabase. No retrieval or generation code was changed.
`;

await writeFile(new URL("../data/corpus/profile.md", import.meta.url), report);
console.log(`Profiled ${candidates.length} candidates across ${snapshot.searches.length} topics.`);
