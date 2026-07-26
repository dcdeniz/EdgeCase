import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

const allowedLevels = new Set(["systematic_review", "randomized_trial", "observational", "mechanistic", "clinical_guidance"]);
const allowedReuse = new Set(["curated_summary", "open_license", "permission", "public_domain"]);
const document = JSON.parse(await readFile(new URL("../data/corpus/approved-claims.json", import.meta.url), "utf8"));
if (document.schemaVersion !== 1 || !Array.isArray(document.claims)) throw new Error("Unsupported approved-claims schema.");

const rows = document.claims.map((claim, index) => {
  const fail = (message) => { throw new Error(`Approved claim ${index + 1}: ${message}`); };
  if (!claim.humanReviewConfirmed) fail("humanReviewConfirmed must be true");
  if (!/^ev_[a-z0-9_]+$/.test(claim.id ?? "")) fail("invalid evidence ID");
  if (!claim.reviewedBy || /^(ai|agent|model|llm)$/i.test(claim.reviewedBy)) fail("a named human reviewer is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(claim.reviewedAt ?? "")) fail("reviewedAt must be YYYY-MM-DD");
  if (!allowedLevels.has(claim.evidenceLevel)) fail("unsupported evidence level");
  if (!allowedReuse.has(claim.reuseBasis)) fail("unsupported reuse basis");
  if (!Array.isArray(claim.tags) || claim.tags.some((tag) => typeof tag !== "string")) fail("tags must be strings");
  for (const field of ["title", "sourceUrl", "citation", "content", "sourceLocator"]) {
    if (typeof claim[field] !== "string" || !claim[field].trim()) fail(`${field} is required`);
  }
  if (!claim.sourceUrl.startsWith("https://")) fail("sourceUrl must use HTTPS");
  return {
    id: claim.id,
    title: claim.title.trim(),
    source_url: claim.sourceUrl,
    citation: claim.citation.trim(),
    content: claim.content.trim(),
    evidence_level: claim.evidenceLevel,
    tags: [...new Set(claim.tags)].sort(),
    review_status: "approved",
    reviewed_at: claim.reviewedAt,
    reviewed_by: claim.reviewedBy.trim(),
    source_locator: claim.sourceLocator.trim(),
    source_license: claim.sourceLicense ?? null,
    source_pmcid: claim.sourcePmcid ?? null,
    source_doi: claim.sourceDoi ?? null,
    reuse_basis: claim.reuseBasis,
    content_version: claim.contentVersion ?? 1,
    is_retracted: false,
  };
});

if (process.env.CORPUS_PUBLISH_APPLY !== "true") {
  console.log(`Validated ${rows.length} approved claims. Dry run only; set CORPUS_PUBLISH_APPLY=true to publish.`);
  process.exit(0);
}
const required = (name) => process.env[name] || (() => { throw new Error(`${name} is required`); })();
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url) throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required");
const supabase = createClient(url, required("SUPABASE_SECRET_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });

for (const row of rows) {
  const { data: existing, error: readError } = await supabase.from("evidence_chunks").select("content,content_version").eq("id", row.id).maybeSingle();
  if (readError) throw readError;
  const changed = existing && (existing.content !== row.content || existing.content_version !== row.content_version);
  const { error } = await supabase.from("evidence_chunks").upsert({ ...row, embedding: changed ? null : undefined, embedding_model: changed ? null : undefined });
  if (error) throw error;
}
console.log(`Published ${rows.length} human-approved claims without creating embeddings.`);
