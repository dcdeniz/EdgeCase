import { createClient } from "@supabase/supabase-js";
import { verifyGoogleHealthState } from "../api/google_health.ts";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const html = (message: string, status = 200) =>
  new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });

Deno.serve(async (request) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const clientId = Deno.env.get("GOOGLE_HEALTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_HEALTH_CLIENT_SECRET");
  const redirectUri = Deno.env.get("GOOGLE_HEALTH_REDIRECT_URI");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const verified = clientSecret && state
    ? await verifyGoogleHealthState(state, clientSecret)
    : null;
  if (
    request.method !== "GET" || !code || !clientId || !clientSecret ||
    !redirectUri || !supabaseUrl || !serviceKey || !verified ||
    !uuidPattern.test(verified.userId)
  ) {
    return html(
      "Google Health could not be connected. Return to PreSeed and try again.",
      400,
    );
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) {
    return html(
      "Google Health could not be connected. Return to PreSeed and try again.",
      502,
    );
  }
  const tokens = await tokenResponse.json();
  if (typeof tokens.access_token !== "string") {
    return html(
      "Google Health could not be connected. Return to PreSeed and try again.",
      502,
    );
  }
  const identityResponse = await fetch(
    "https://health.googleapis.com/v4/users/me/identity",
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/json",
      },
    },
  );
  if (!identityResponse.ok) {
    return html(
      "Google Health could not be connected. Return to PreSeed and try again.",
      502,
    );
  }
  const identity = await identityResponse.json();
  const providerUserId = String(identity.healthUserId ?? "");
  if (!providerUserId) {
    return html(
      "Google Health could not be connected. Return to PreSeed and try again.",
      502,
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: existing } = await admin.from("wearable_connections")
    .select("refresh_token").eq("user_id", verified.userId).maybeSingle();
  const refreshToken = typeof tokens.refresh_token === "string"
    ? tokens.refresh_token
    : existing?.refresh_token;
  if (!refreshToken) {
    return html(
      "Google Health did not provide offline access. Remove PreSeed from your Google permissions and try again.",
      422,
    );
  }
  const { error } = await admin.from("wearable_connections").upsert({
    user_id: verified.userId,
    provider: "google_health",
    provider_user_id: providerUserId,
    access_token: tokens.access_token,
    refresh_token: refreshToken,
    expires_at: new Date(Date.now() + Number(tokens.expires_in ?? 3600) * 1000)
      .toISOString(),
    scopes: typeof tokens.scope === "string" ? tokens.scope.split(" ") : [],
    updated_at: new Date().toISOString(),
  });
  if (error) {
    return html(
      "Google Health could not be saved. Return to PreSeed and try again.",
      500,
    );
  }
  return html(
    "Google Health connected. You can return to PreSeed and sync your wearable data.",
  );
});
