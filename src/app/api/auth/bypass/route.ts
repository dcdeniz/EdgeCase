import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const accountUrl = new URL("/start/account?error=bypass_failed", request.url);
  const onboardingUrl = new URL("/start/privacy", request.url);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.redirect(accountUrl);

  const response = NextResponse.redirect(onboardingUrl, 303);
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  const { data: existing } = await supabase.auth.getUser();
  if (existing.user) return response;
  const { data, error } = await supabase.auth.signInAnonymously({
    options: { data: { display_name: "Demo user", showcase: true } },
  });
  return error || !data.session ? NextResponse.redirect(accountUrl) : response;
}
