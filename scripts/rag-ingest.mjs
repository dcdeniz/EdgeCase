import { createClient } from "@supabase/supabase-js";

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required");
const supabase = createClient(supabaseUrl, required("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const openAiKey = required("OPENAI_API_KEY");
const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

const { data: chunks, error } = await supabase
  .from("evidence_chunks")
  .select("id,title,citation,content")
  .is("embedding", null)
  .order("id");
if (error) throw error;
if (!chunks?.length) {
  console.log("Evidence index is already up to date.");
  process.exit(0);
}

const inputs = chunks.map((chunk) =>
  `${chunk.title}\n${chunk.citation}\n${chunk.content}`
);
const response = await fetch("https://api.openai.com/v1/embeddings", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${openAiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: embeddingModel,
    input: inputs,
    dimensions: 1536,
    encoding_format: "float",
  }),
});
if (!response.ok) {
  throw new Error(`Embedding request failed with HTTP ${response.status}`);
}
const payload = await response.json();
if (!Array.isArray(payload.data) || payload.data.length !== chunks.length) {
  throw new Error("Embedding response count does not match evidence chunk count");
}

for (const [index, chunk] of chunks.entries()) {
  const embedding = payload.data[index]?.embedding;
  if (!Array.isArray(embedding) || embedding.length !== 1536) {
    throw new Error(`Invalid embedding for ${chunk.id}`);
  }
  const { error: updateError } = await supabase
    .from("evidence_chunks")
    .update({ embedding, embedding_model: embeddingModel })
    .eq("id", chunk.id)
    .is("embedding", null);
  if (updateError) throw updateError;
}

console.log(`Indexed ${chunks.length} approved evidence chunks with ${embeddingModel}.`);
