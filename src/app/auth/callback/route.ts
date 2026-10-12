import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Handles the magic-link return: PKCE `code` (same browser) or `token_hash` (any browser).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const supabase = await supabaseServer();

  const { error } = tokenHash
    ? await supabase.auth.verifyOtp({ type: "email", token_hash: tokenHash })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("no code") };
  if (error) return NextResponse.redirect(`${origin}/sign-in?error=link`);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user!.id)
    .single();
  return NextResponse.redirect(`${origin}${profile?.onboarded_at ? "/app" : "/onboarding"}`);
}
