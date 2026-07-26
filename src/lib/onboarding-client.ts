import type { OnboardingAnswers } from "@/lib/readiness";
import type { Track } from "@/lib/store";
import { edgeApiUrl, getSupabaseBrowserClient } from "@/lib/supabase-browser";

export async function persistOnboarding(track: Track, answers: OnboardingAnswers) {
  const url = edgeApiUrl("onboarding");
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!url || !token) throw new Error("Your authenticated onboarding session is unavailable.");
  const response = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      fertilityTrack: track,
      answers,
      healthDataConsent: true,
      complete: true,
    }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "Your onboarding could not be saved.");
  }
}
