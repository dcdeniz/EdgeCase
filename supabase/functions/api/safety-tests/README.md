# Vector RAG guardrail and resilience harness

Scope is limited to guardrail behavior and operational resilience. It
deliberately does not score retrieval ranking or citation relevance.

The harness invokes the real Hono Fetch handler in process. Deterministic
`fetch` stubs emulate account-scoped Supabase REST/RPC calls and the OpenAI
Embeddings and Responses APIs. No production or hosted endpoint is contacted.
Test credential strings are synthetic canaries, not secrets.

Run:

```bash
deno run --allow-env --config supabase/functions/api/deno.json supabase/functions/api/safety-tests/run.ts
deno run --allow-env --config supabase/functions/api/deno.json supabase/functions/api/safety-tests/load.ts
```

The adversarial runner exits successfully after printing a machine-readable
audit report. Individual `passed` fields are the result: an expected control
that is absent remains visible as a failed case instead of preventing the
remaining stress scenarios from running.

The load runner uses 25 sequential requests and 50 requests at concurrency five
with a five-millisecond provider delay. These are smoke-test measurements for
regression comparison, not production capacity estimates. Network, gateway,
Postgres pooling, provider quotas and Edge Runtime isolate limits are
intentionally absent.

Current control expectations:

- Reject malformed and oversized requests, unexpected content types, and unknown
  request fields.
- Never trust a provider merely because its JSON matches the schema. Generated
  prose must be independently checked for prohibited diagnosis, hormone
  treatment, guarantees and sensitive-output disclosure.
- Reject citation IDs outside the retrieved set and resolve citation metadata
  server-side.
- Convert provider/database failure into stable envelopes without raw upstream
  bodies.
- Bound provider and database calls with timeouts; cancel downstream work when
  the client aborts.
- Avoid automatic retries in the synchronous request path unless they are
  bounded, jittered and budget-aware.
- Enforce an account/provider rate limit and a concurrency or backpressure
  policy before expensive calls.
- Preserve one request ID in the response header, envelope and structured server
  logs.

NEAT limitation: repository discovery was attempted against the registered
project daemon, but its REST endpoint was unreachable from the sandbox. The
suite was therefore built by inspecting the known manifest-listed knowledge
base, canonical contracts/ADRs, API implementation, migrations and existing
Fetch tests directly, without grep or ripgrep.

## Baseline observed 2026-07-25

The deterministic adversarial run passed 10 of 27 controls and failed 17. It
confirmed stable handling for an empty index/no matches, OpenAI 429/500,
malformed provider JSON, malformed and oversized request bodies, invented
evidence IDs, request-ID propagation and absence of automatic retries.

The run found that schema-valid unsafe provider prose can cross the API with a
200 response, including diagnoses, zero-count confirmation, hormone-treatment
advice, guarantees and credential-shaped canaries. Unknown request fields and
`text/plain` JSON are accepted. Supabase error objects can escape the Fetch
handler instead of becoming the standard envelope. OpenAI and Supabase calls
have no timeout, client abort is not propagated, and a 20-request burst reached
20 concurrent provider calls with no rate limiting.

Stub-load baseline:

| Mode       | Requests | Concurrency | Error rate |      p50 |      p95 |      p99 |
| ---------- | -------: | ----------: | ---------: | -------: | -------: | -------: |
| Sequential |       25 |           1 |         0% | 16.65 ms | 22.58 ms | 27.16 ms |
| Concurrent |       50 |           5 |         0% | 16.26 ms | 21.06 ms | 23.06 ms |

Recommended remediation order:

1. Add a deterministic server-side medical-output policy after schema and
   citation validation; fail closed on diagnosis, prohibited treatment,
   guarantees, unsafe escalation state and sensitive-output canaries.
2. Throw or normalize only `Error` instances and guarantee that every
   Supabase/provider failure becomes a redacted standard envelope.
3. Add request-budgeted timeouts with abort propagation to Supabase and both
   provider calls.
4. Add per-account/provider rate limits and bounded concurrency/backpressure.
5. Enforce `application/json` and reject unknown request fields before any
   account or provider work.
