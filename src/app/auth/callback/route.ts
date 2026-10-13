import { NextResponse, type NextRequest } from "next/server";
import { NEXT_COOKIE, linkedInFromSession, oauthErrorKind, safeNext } from "@/lib/linkedin-auth";
import { saveLinkedInConnection } from "@/lib/linkedin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

// Handles every sign-in return: email link (`token_hash` any browser, or PKCE `code` same browser) and LinkedIn (`code`).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const toSignIn = (error: string) => NextResponse.redirect(`${origin}/sign-in?error=${error}`);

  const oauthError = oauthErrorKind(searchParams);
  if (oauthError) {
    // A signed-in user who was connecting LinkedIn goes back to Settings; everyone else back to sign-in.
    const back = safeNext(request.cookies.get(NEXT_COOKIE)?.value);
    const res = back ? NextResponse.redirect(`${origin}${back}?linkedin=${oauthError.replace("linkedin_", "")}`) : toSignIn(oauthError);
    res.cookies.delete(NEXT_COOKIE);
    return res;
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const supabase = await supabaseServer();

  let session = null;
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ type: "email", token_hash: tokenHash });
    if (error) return toSignIn("link");
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return toSignIn(request.cookies.get(NEXT_COOKIE) ? "linkedin_failed" : "link");
    session = data.session;
  } else {
    return toSignIn("link");
  }

  const { data: { user } } = await supabase.auth.getUser();

  // LinkedIn gives its token only now. Save it encrypted; it never goes to the browser.
  const linkedin = linkedInFromSession(session);
  let linkedinResult: string | null = null;
  if (linkedin && user) {
    linkedinResult = await saveLinkedInConnection({
      admin: supabaseAdmin(),
      userId: user.id,
      connection: linkedin,
      keyB64: process.env.TOKEN_ENCRYPTION_KEY!,
    });
    if (linkedinResult !== "ok") console.error(`LinkedIn connection not saved: ${linkedinResult}`);
    if (linkedinResult === "ok") {
      const update: Record<string, string> = {};
      if (linkedin.name) update.full_name = linkedin.name;
      if (linkedin.picture) update.avatar_url = linkedin.picture;
      if (Object.keys(update).length) await supabase.from("profiles").update(update).eq("id", user.id);
    }
  }

  const next = safeNext(request.cookies.get(NEXT_COOKIE)?.value);
  const { data: profile } = await supabase.from("profiles").select("onboarded_at").eq("id", user!.id).single();
  const dest =
    next && linkedinResult === "ok"
      ? next
      : next && linkedinResult
        ? `${next}?linkedin=${linkedinResult === "already_connected" ? "already" : "failed"}`
        : linkedinResult && linkedinResult !== "ok"
          ? `/sign-in?error=${linkedinResult === "already_connected" ? "linkedin_already" : "linkedin_failed"}`
          : profile?.onboarded_at ? "/app" : "/onboarding";
  const res = NextResponse.redirect(`${origin}${dest}`);
  res.cookies.delete(NEXT_COOKIE);
  return res;
}
