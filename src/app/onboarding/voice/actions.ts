"use server";

import { redirect } from "next/navigation";
import { MIN_POSTS, MIN_POSTS_MESSAGE, TOO_LONG_MESSAGE, duplicateKey, selectPosts } from "@/lib/voice-import";
import { supabaseServer } from "@/lib/supabase/server";

async function finishOnboarding() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return { supabase, user };
}

export async function importVoicePosts(raw: string[]): Promise<{ error: string }> {
  const input = Array.isArray(raw) ? raw.filter((p) => typeof p === "string").slice(0, 100) : [];
  const { posts, tooLong } = selectPosts(input);
  if (tooLong) return { error: TOO_LONG_MESSAGE };
  if (posts.length < MIN_POSTS) return { error: MIN_POSTS_MESSAGE };

  const { supabase, user } = await finishOnboarding();
  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (!member) return { error: "We couldn't find your workspace. Sign out, sign in and try again." };

  const { data: existing } = await supabase
    .from("posts")
    .select("body")
    .eq("workspace_id", member.workspace_id)
    .eq("status", "imported");
  const have = new Set((existing ?? []).map((p) => duplicateKey(p.body)));
  const fresh = posts.filter((p) => !have.has(duplicateKey(p)));

  if (fresh.length) {
    const { error } = await supabase.from("posts").insert(
      fresh.map((body) => ({ workspace_id: member.workspace_id, author_id: user.id, body, status: "imported" })),
    );
    if (error) return { error: "We couldn't save your posts. Check your connection and try again." };
  }
  await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", user.id);
  redirect("/app");
}

export async function skipVoiceImport() {
  const { supabase, user } = await finishOnboarding();
  await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", user.id);
  redirect("/app");
}
