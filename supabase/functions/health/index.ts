const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
Deno.serve((request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "GET") return Response.json({ error: "method_not_allowed" }, { status: 405, headers: cors });
  return Response.json({ ok: true, service: "edgecase-api", timestamp: new Date().toISOString() }, { headers: { ...cors, "Cache-Control": "no-store" } });
});
