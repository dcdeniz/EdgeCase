import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "unauthorized" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } }, auth: { persistSession: false },
  });
  const token = authorization.replace(/^Bearer\s+/i, "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: "unauthorized" }, 401);
  const id = new URL(request.url).searchParams.get("id");

  try {
    if (request.method === "GET") {
      let query = supabase.from("notes").select("id,title,body,created_at,updated_at").order("updated_at", { ascending: false }).limit(100);
      if (id) query = query.eq("id", id);
      const { data, error } = await query;
      if (error) throw error;
      return json({ data: id ? data?.[0] ?? null : data });
    }
    if (request.method === "POST") {
      const input = await request.json() as { title?: unknown; body?: unknown };
      if (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 200) return json({ error: "invalid_title" }, 400);
      if (input.body !== undefined && typeof input.body !== "string") return json({ error: "invalid_body" }, 400);
      const { data, error } = await supabase.from("notes").insert({ user_id: user.id, title: input.title.trim(), body: input.body ?? "" }).select("id,title,body,created_at,updated_at").single();
      if (error) throw error;
      return json({ data }, 201);
    }
    if (request.method === "PATCH") {
      if (!id) return json({ error: "missing_id" }, 400);
      const input = await request.json() as { title?: unknown; body?: unknown };
      const updates: { title?: string; body?: string } = {};
      if (input.title !== undefined) {
        if (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 200) return json({ error: "invalid_title" }, 400);
        updates.title = input.title.trim();
      }
      if (input.body !== undefined) {
        if (typeof input.body !== "string") return json({ error: "invalid_body" }, 400);
        updates.body = input.body;
      }
      if (!Object.keys(updates).length) return json({ error: "no_changes" }, 400);
      const { data, error } = await supabase.from("notes").update(updates).eq("id", id).select("id,title,body,created_at,updated_at").maybeSingle();
      if (error) throw error;
      return data ? json({ data }) : json({ error: "not_found" }, 404);
    }
    if (request.method === "DELETE") {
      if (!id) return json({ error: "missing_id" }, 400);
      const { data, error } = await supabase.from("notes").delete().eq("id", id).select("id").maybeSingle();
      if (error) throw error;
      return data ? new Response(null, { status: 204, headers: cors }) : json({ error: "not_found" }, 404);
    }
    return json({ error: "method_not_allowed" }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: "internal_error" }, 500);
  }
});
