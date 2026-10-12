import { createClient } from "@supabase/supabase-js";

export const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

// Generates a real magic link without sending an email.
export async function magicLink(email: string) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  return { tokenHash: data.properties.hashed_token, path: `/auth/callback?token_hash=${data.properties.hashed_token}&type=email` };
}

export async function userIdFor(email: string) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  return data.users.find((u) => u.email === email)!.id;
}
