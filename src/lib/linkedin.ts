import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TOKEN_LIFETIME_DAYS, type LinkedInConnection } from "@/lib/linkedin-auth";
import { encryptToken } from "@/lib/token-crypto";

export type ConnectResult = "ok" | "already_connected" | "failed";

// Saves the LinkedIn profile and the encrypted token. `admin` bypasses row-level security, which is the
// only way these rows are written; the browser can read the profile columns but never the token columns.
export async function saveLinkedInConnection(args: {
  admin: SupabaseClient;
  userId: string;
  connection: LinkedInConnection;
  keyB64: string;
}): Promise<ConnectResult> {
  const { admin, userId, connection: c, keyB64 } = args;

  // Encrypt first: a missing or wrong key must not break sign-in or leave a half-saved row.
  let encrypted: string;
  try {
    encrypted = encryptToken(c.token, keyB64);
  } catch {
    return "failed";
  }

  const { data: member } = await admin.from("workspace_members").select("workspace_id").eq("user_id", userId).limit(1).single();
  if (!member) return "failed";

  const { data: existing } = await admin.from("linkedin_profiles").select("id, user_id").eq("linkedin_sub", c.sub).maybeSingle();
  if (existing && existing.user_id !== userId) return "already_connected";

  // One LinkedIn account per Qiva Reach user in Phase 1.
  await admin.from("linkedin_profiles").delete().eq("user_id", userId).neq("linkedin_sub", c.sub);

  const { data: row, error } = await admin
    .from("linkedin_profiles")
    .upsert(
      {
        workspace_id: member.workspace_id,
        user_id: userId,
        linkedin_sub: c.sub,
        name: c.name,
        picture_url: c.picture,
        access_token_enc: encrypted,
        token_expires_at: new Date(Date.now() + TOKEN_LIFETIME_DAYS * 24 * 3600 * 1000).toISOString(),
      },
      { onConflict: "linkedin_sub" },
    )
    .select("id")
    .single();
  if (error?.code === "23505") return "already_connected";
  if (error || !row) return "failed";

  await admin.from("audit_log").insert({ actor_id: userId, action: "linkedin_connected", target: row.id });
  return "ok";
}

// Saves the headline the user typed (LinkedIn does not share it). Keeps both copies in step.
export async function saveHeadline(args: { admin: SupabaseClient; userId: string; headline: string | null }): Promise<boolean> {
  const { admin, userId, headline } = args;
  const a = await admin.from("profiles").update({ headline }).eq("id", userId);
  const b = await admin.from("linkedin_profiles").update({ headline }).eq("user_id", userId);
  return !a.error && !b.error;
}

// Deletes the saved LinkedIn access (profile row and encrypted token) and records it. The sign-in identity stays,
// so the user can sign in with LinkedIn again. LinkedIn's own grant can be removed in LinkedIn's settings.
export async function removeLinkedInConnection(args: { admin: SupabaseClient; userId: string }): Promise<boolean> {
  const { admin, userId } = args;
  const { data: rows, error } = await admin.from("linkedin_profiles").delete().eq("user_id", userId).select("id");
  if (error) return false;
  if (rows?.length) await admin.from("audit_log").insert({ actor_id: userId, action: "linkedin_removed", target: rows[0].id });
  return true;
}
