import { assertEquals } from "@std/assert";
import { createApp, markerMatchesTest } from "./app.ts";
import {
  extractResponseText,
  safetyIdentifier,
  validateGroundedAnswer,
} from "./rag.ts";

Deno.test("health uses the standard envelope", async () => {
  const response = await createApp().request("http://localhost/api/health");
  const body = await response.json();
  assertEquals(response.status, 200);
  assertEquals(body.data.ok, true);
  assertEquals(body.meta.contractVersion, "1");
});

Deno.test("protected operations reject missing authentication", async () => {
  const response = await createApp().request("http://localhost/api/v1/me");
  const body = await response.json();
  assertEquals(response.status, 401);
  assertEquals(body.error.code, "UNAUTHORIZED");
});

Deno.test("CORS preflight does not require authentication", async () => {
  const response = await createApp().request("http://localhost/api/v1/me", {
    method: "OPTIONS",
  });
  assertEquals(response.status, 204);
  assertEquals(
    response.headers.get("Access-Control-Allow-Methods"),
    corsMethods,
  );
});

Deno.test("CORS reflects only an allowed origin", async () => {
  const allowed = await createApp().request("http://localhost/api/health", {
    headers: { Origin: "http://localhost:3000" },
  });
  const denied = await createApp().request("http://localhost/api/health", {
    headers: { Origin: "https://attacker.example" },
  });
  assertEquals(
    allowed.headers.get("Access-Control-Allow-Origin"),
    "http://localhost:3000",
  );
  assertEquals(denied.headers.get("Access-Control-Allow-Origin"), null);
});

Deno.test("protected operations reject an untrusted browser origin", async () => {
  const response = await createApp().request("http://localhost/api/v1/me", {
    headers: { Origin: "https://attacker.example" },
  });
  const body = await response.json();
  assertEquals(response.status, 403);
  assertEquals(body.error.code, "ORIGIN_FORBIDDEN");
});

Deno.test("invalid caller request IDs are replaced", async () => {
  const response = await createApp().request("http://localhost/api/health", {
    headers: { "x-request-id": "log-forgery" },
  });
  assertEquals(response.headers.get("x-request-id") === "log-forgery", false);
});

Deno.test("oversized protected payloads are rejected before parsing", async () => {
  const response = await createApp().request(
    "http://localhost/api/v1/onboarding",
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "content-length": "140000",
      },
      body: JSON.stringify({ data: "x".repeat(140000) }),
    },
  );
  assertEquals(response.status, 413);
});

Deno.test("marker metadata cannot cross clinical test boundaries", () => {
  assertEquals(markerMatchesTest("volume_ml", "mL", "semen_analysis"), true);
  assertEquals(markerMatchesTest("fsh_iu_l", "IU/L", "semen_analysis"), false);
  assertEquals(
    markerMatchesTest("volume_ml", "litres", "semen_analysis"),
    false,
  );
});

Deno.test("RAG output accepts only retrieved evidence IDs", () => {
  const answer = {
    answer: "The evidence supports discussing this result with a clinician.",
    evidenceIds: ["ev_allowed"],
    limitations: ["This does not establish a diagnosis."],
    clinicalEscalation: true,
  };
  assertEquals(validateGroundedAnswer(answer, new Set(["ev_allowed"])), true);
  assertEquals(
    validateGroundedAnswer(
      { ...answer, evidenceIds: ["ev_invented"] },
      new Set(["ev_allowed"]),
    ),
    false,
  );
});

Deno.test("Responses API output text is extracted from message content", () => {
  assertEquals(
    extractResponseText({
      output: [{ content: [{ type: "output_text", text: '{"answer":"ok"}' }] }],
    }),
    '{"answer":"ok"}',
  );
});

Deno.test("provider safety identifiers do not disclose account UUIDs", async () => {
  const userId = "00000000-0000-4000-8000-000000000001";
  const identifier = await safetyIdentifier(userId);
  assertEquals(identifier.startsWith("preseed_"), true);
  assertEquals(identifier.includes(userId), false);
});

Deno.test("public demo mode labels responses and permits untrusted origins", async () => {
  Deno.env.set("PUBLIC_DEMO_MODE", "true");
  try {
    const response = await createApp().request("http://localhost/api/health", {
      headers: { Origin: "https://hackathon.example" },
    });
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("X-PreSeed-Demo"), "public-shared-data");
  } finally {
    Deno.env.delete("PUBLIC_DEMO_MODE");
  }
});

const corsMethods = "GET, POST, PUT, OPTIONS";
