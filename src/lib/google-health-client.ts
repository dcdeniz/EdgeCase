import { edgeApiUrl, getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { GoogleHealthDailySummary } from "@/lib/wearable-source";

export type { GoogleHealthDailySummary } from "@/lib/wearable-source";

type Envelope<T> = { data: T };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = edgeApiUrl(path);
  if (!url) throw new Error("Google Health is not configured in this environment.");
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  const accessToken = session?.data.session?.access_token;
  if (!accessToken) throw new Error("Sign in before connecting Google Health.");
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...init?.headers },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Google Health could not complete the request.");
  }
  return (payload as Envelope<T>).data;
}

export const getGoogleHealthStatus = () =>
  request<{
    connected: boolean;
    provider: string | null;
    connectedAt: string | null;
    lastTokenUpdateAt: string | null;
    scopes: string[];
  }>("integrations/google-health/status");

export const beginGoogleHealthConnection = async () => {
  const result = await request<{ authorizationUrl: string }>(
    "integrations/google-health/connect",
  );
  window.location.assign(result.authorizationUrl);
};

export const syncGoogleHealth = () =>
  request<{ syncedDays: number; from: string; through: string }>(
    "integrations/google-health/sync",
    { method: "POST" },
  );

export const getGoogleHealthDailySummaries = () =>
  request<GoogleHealthDailySummary[]>("wearable/daily-summaries");
