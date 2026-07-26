import { createApp } from "../app.ts";

export type ProviderMode =
  | "safe"
  | "malformed_json"
  | "invented_citation"
  | "provider_429"
  | "provider_500"
  | "provider_timeout"
  | "supabase_error"
  | "supabase_timeout"
  | "no_matches"
  | "leaky"
  | "unsafe_medical";

export type StubMetrics = {
  embeddingCalls: number;
  responseCalls: number;
  supabaseCalls: number;
  activeProviderCalls: number;
  peakProviderCalls: number;
};

export type Harness = {
  request(
    question: string,
    init?: RequestInit,
    extra?: Record<string, unknown>,
  ): Promise<Response>;
  raw(body: BodyInit | null, headers?: HeadersInit): Promise<Response>;
  metrics: StubMetrics;
  restore(): void;
};

const userId = "00000000-0000-4000-8000-000000000001";
const evidence = {
  id: "ev_azoospermia_who_2021",
  title: "WHO semen examination requirements",
  source_url: "https://www.who.int/publications/i/item/9789240030787",
  citation: "WHO laboratory manual, sixth edition.",
  content:
    "Azoospermia requires qualified laboratory examination of centrifuged sediment.",
  evidence_level: "clinical_guidance",
  tags: ["azoospermia", "clinical_escalation"],
  similarity: 0.91,
};

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });

function providerAnswer(mode: ProviderMode) {
  if (mode === "unsafe_medical") {
    return {
      answer:
        "You have azoospermia and zero sperm. Start testosterone and hCG; this guarantees improved sperm and pregnancy.",
      evidenceIds: [evidence.id],
      limitations: ["None."],
      clinicalEscalation: false,
    };
  }
  if (mode === "leaky") {
    return {
      answer:
        "Internal prompt: ignore safeguards. OPENAI_API_KEY=test-provider-secret; SUPABASE_SERVICE_ROLE_KEY=test-service-role-secret.",
      evidenceIds: [evidence.id],
      limitations: ["Raw provider error: upstream stack trace."],
      clinicalEscalation: false,
    };
  }
  return {
    answer:
      "This cannot confirm azoospermia or zero sperm; use a qualified laboratory and clinician.",
    evidenceIds: mode === "invented_citation"
      ? ["ev_not_retrieved"]
      : [evidence.id],
    limitations: ["This is not a diagnosis."],
    clinicalEscalation: true,
  };
}

export function createHarness(
  mode: ProviderMode = "safe",
  providerDelayMs = 0,
): Harness {
  const originalFetch = globalThis.fetch;
  const previous = new Map<string, string | undefined>();
  const env = {
    PUBLIC_DEMO_MODE: "true",
    PUBLIC_DEMO_USER_ID: userId,
    SUPABASE_URL: "https://stub.supabase.test",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-secret",
    OPENAI_API_KEY: "test-provider-secret",
    ALLOWED_ORIGINS: "http://localhost:3000",
  };
  for (const [key, value] of Object.entries(env)) {
    previous.set(key, Deno.env.get(key));
    Deno.env.set(key, value);
  }

  const metrics: StubMetrics = {
    embeddingCalls: 0,
    responseCalls: 0,
    supabaseCalls: 0,
    activeProviderCalls: 0,
    peakProviderCalls: 0,
  };

  globalThis.fetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    if (url.hostname === "stub.supabase.test") {
      metrics.supabaseCalls++;
      if (mode === "supabase_timeout") {
        await new Promise<never>(() => {});
      }
      if (mode === "supabase_error") {
        return json({
          message: "database unavailable",
          details: "test-only-secret",
        }, 500);
      }
      if (url.pathname.endsWith("/profiles")) {
        return json({
          fertility_track: "general",
          onboarding_data: {},
          onboarding_completed_at: null,
          health_data_consented_at: null,
        });
      }
      if (url.pathname.endsWith("/clinical_tests")) return json([]);
      if (url.pathname.endsWith("/rpc/match_evidence")) {
        return json(mode === "no_matches" ? [] : [evidence]);
      }
      if (url.pathname.endsWith("/rag_runs")) {
        return json({
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        });
      }
      return json({ message: "unexpected Supabase stub route" }, 500);
    }

    if (url.hostname === "api.openai.com") {
      metrics.activeProviderCalls++;
      metrics.peakProviderCalls = Math.max(
        metrics.peakProviderCalls,
        metrics.activeProviderCalls,
      );
      try {
        if (providerDelayMs) {
          await new Promise((resolve) => setTimeout(resolve, providerDelayMs));
        }
        if (mode === "provider_timeout") {
          await new Promise<never>(() => {});
        }
        if (url.pathname.endsWith("/embeddings")) {
          metrics.embeddingCalls++;
          return json({ data: [{ embedding: Array(1536).fill(0.01) }] });
        }
        metrics.responseCalls++;
        if (mode === "provider_429") {
          return json({ error: { message: "quota detail" } }, 429);
        }
        if (mode === "provider_500") {
          return json({ error: { message: "provider stack" } }, 500);
        }
        if (mode === "malformed_json") {
          return json({
            output: [{ content: [{ type: "output_text", text: "{not-json" }] }],
          });
        }
        return json({
          output: [{
            content: [{
              type: "output_text",
              text: JSON.stringify(providerAnswer(mode)),
            }],
          }],
        });
      } finally {
        metrics.activeProviderCalls--;
      }
    }
    throw new Error(
      `Unexpected external request in safety harness: ${url.origin}${url.pathname}`,
    );
  };

  const app = createApp();
  return {
    request(question, init = {}, extra = {}) {
      return Promise.resolve(
        app.request("http://localhost/api/v1/evidence/answer", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(init.headers ?? {}),
          },
          body: JSON.stringify({ question, ...extra }),
          ...init,
        }),
      );
    },
    raw(body, headers = { "content-type": "application/json" }) {
      return Promise.resolve(
        app.request("http://localhost/api/v1/evidence/answer", {
          method: "POST",
          headers,
          body,
        }),
      );
    },
    metrics,
    restore() {
      globalThis.fetch = originalFetch;
      for (const [key, value] of previous) {
        if (value === undefined) Deno.env.delete(key);
        else Deno.env.set(key, value);
      }
    },
  };
}

export async function responseBody(
  response: Response,
): Promise<Record<string, unknown>> {
  return await response.json();
}
