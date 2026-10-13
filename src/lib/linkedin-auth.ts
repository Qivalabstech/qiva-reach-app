// Pure helpers for the LinkedIn sign-in return. No secrets and no database here.

export type LinkedInError = "linkedin_cancelled" | "linkedin_already" | "linkedin_no_email" | "linkedin_failed";

export const LINKEDIN_MESSAGES: Record<LinkedInError, string> = {
  linkedin_cancelled: "You cancelled the LinkedIn sign-in. Try again, or use your email.",
  linkedin_failed: "LinkedIn sign-in didn't work. Try again, or use your email.",
  linkedin_no_email: "LinkedIn didn't share your email. Use the email link, then connect LinkedIn in Settings.",
  linkedin_already: "This LinkedIn account is already connected to another Qiva Reach account.",
};

// Reads the error that Supabase or LinkedIn puts in the return URL.
export function oauthErrorKind(params: URLSearchParams): LinkedInError | null {
  const error = params.get("error");
  const code = params.get("error_code") ?? "";
  if (!error && !code) return null;
  const desc = (params.get("error_description") ?? "").toLowerCase();
  if (error === "access_denied" || desc.includes("user_cancelled") || desc.includes("cancel")) return "linkedin_cancelled";
  if (code === "identity_already_exists" || desc.includes("already linked") || desc.includes("already exists")) return "linkedin_already";
  if (desc.includes("email")) return "linkedin_no_email";
  return "linkedin_failed";
}

type Identity = { provider: string; identity_data?: Record<string, unknown> };
type SessionLike = {
  provider_token?: string | null;
  user: { identities?: Identity[] | null };
};

export type LinkedInConnection = { sub: string; name: string | null; picture: string | null; token: string };

// LinkedIn gives the token only once, right after sign-in. This picks it and the profile out of the session.
export function linkedInFromSession(session: SessionLike | null | undefined): LinkedInConnection | null {
  const identity = session?.user.identities?.find((i) => i.provider === "linkedin_oidc");
  const token = session?.provider_token;
  const d = identity?.identity_data;
  const sub = typeof d?.sub === "string" ? d.sub : typeof d?.provider_id === "string" ? d.provider_id : "";
  if (!identity || !token || !sub) return null;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return {
    sub,
    name: str(d?.name) ?? str(d?.full_name),
    picture: str(d?.picture) ?? str(d?.avatar_url),
    token,
  };
}

export const TOKEN_LIFETIME_DAYS = 60; // LinkedIn issues every access token for 60 days

export const NEXT_COOKIE = "qr_next";
const ALLOWED_NEXT = ["/app/settings"];
export const safeNext = (v: string | undefined | null) => (v && ALLOWED_NEXT.includes(v) ? v : null);

export const HEADLINE_MAX = 220; // LinkedIn's own headline limit

// An optional headline. Empty clears it.
export function validateHeadline(input: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  const v = typeof input === "string" ? input.trim() : "";
  if (v.length > HEADLINE_MAX) return { ok: false, error: `Keep your headline under ${HEADLINE_MAX} characters.` };
  if (v.includes("\n")) return { ok: false, error: "A headline is one line." };
  return { ok: true, value: v || null };
}
