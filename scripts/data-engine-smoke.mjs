import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const values = Object.fromEntries(
  execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
    .split("\n")
    .map((line) => line.match(/^([A-Z0-9_]+)=(?:"([^"]*)"|(.*))$/))
    .filter(Boolean)
    .map((match) => [match[1], match[2] ?? match[3]]),
);

const apiUrl = values.API_URL ?? "http://127.0.0.1:55321";
const apiKey = values.PUBLISHABLE_KEY ?? values.ANON_KEY;
const secretKey = values.SECRET_KEY ?? values.SERVICE_ROLE_KEY;
if (!apiKey) throw new Error("Local Supabase publishable key is unavailable.");

async function signIn() {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "preseed-demo@example.invalid", password: "synthetic-demo-only" }),
  });
  return { response, payload: await response.json() };
}

let login = await signIn();
if (!login.response.ok && login.response.status === 500 && secretKey) {
  const userId = "10000000-0000-4000-8000-000000000001";
  const adminHeaders = { apikey: secretKey, Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" };
  await fetch(`${apiUrl}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: adminHeaders });
  const created = await fetch(`${apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      id: userId,
      email: "preseed-demo@example.invalid",
      password: "synthetic-demo-only",
      email_confirm: true,
      user_metadata: { display_name: "Synthetic PreSeed Demo" },
    }),
  });
  if (!created.ok) throw new Error(`Synthetic Auth bootstrap failed (${created.status}).`);
  execFileSync("docker", ["exec", "-i", "supabase_db_edgecase", "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], {
    input: readFileSync(new URL("../supabase/seed.sql", import.meta.url)),
    stdio: ["pipe", "ignore", "ignore"],
  });
  login = await signIn();
}
const auth = login.payload;
if (!login.response.ok || !auth.access_token) {
  throw new Error(`Synthetic demo authentication failed (${login.response.status}, ${auth.error_code ?? auth.code ?? "unknown"}).`);
}

const base = `${apiUrl}/functions/v1/api/v1/data-engine/semen-profile`;
const results = [];
for (const run of [
  { name: "current-before-compile", path: "/current", method: "GET" },
  { name: "compile-1", path: "/compile", method: "POST" },
  { name: "compile-2", path: "/compile", method: "POST" },
]) {
  const started = performance.now();
  const response = await fetch(`${base}${run.path}`, {
    method: run.method,
    headers: { Authorization: `Bearer ${auth.access_token}`, "Content-Type": "application/json" },
  });
  const payload = await response.json();
  results.push({
    run: run.name,
    status: response.status,
    latencyMs: Math.round((performance.now() - started) * 10) / 10,
    code: payload.error?.code ?? null,
    artifactVersion: payload.data?.version ?? null,
    measurementCount: payload.data?.measurements?.length ?? null,
    evidenceCount: payload.data?.evidenceIds?.length ?? null,
    requestIdPropagated:
      response.headers.get("x-request-id") === (payload.meta?.requestId ?? payload.error?.requestId),
  });
}

console.log(JSON.stringify({ syntheticOnly: true, results }, null, 2));
