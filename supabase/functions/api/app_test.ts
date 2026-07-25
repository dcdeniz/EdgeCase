import { assertEquals } from "@std/assert";
import { createApp } from "./app.ts";

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

const corsMethods = "GET, POST, PUT, OPTIONS";
