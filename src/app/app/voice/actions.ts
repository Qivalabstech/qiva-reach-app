"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runVoiceAnalysis } from "@/lib/voice-analysis";
import { supabaseServer } from "@/lib/supabase/server";
import { validateVoice } from "@/lib/voice-profile";

export type VoiceResult = { error?: string; notice?: string; saved?: boolean };

async function context() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return { supabase, user };
}

export async function learnAgain(): Promise<VoiceResult> {
  const { supabase, user } = await context();
  const r = await runVoiceAnalysis(supabase, user.id);
  if (!r.ok) return { error: r.error };
  revalidatePath("/app/voice");
  return r.toneFailed ? { notice: "We couldn't read your tone. Write it yourself or try again." } : { saved: true };
}

export async function saveVoice(input: unknown): Promise<VoiceResult> {
  const parsed = validateVoice(input);
  if (!parsed.ok) return { error: parsed.error };
  const { supabase, user } = await context();

  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (!member) return { error: "We couldn't find your workspace. Sign out, sign in and try again." };

  const { data: current } = await supabase
    .from("voice_profiles")
    .select("tone")
    .eq("workspace_id", member.workspace_id)
    .single();
  const v = parsed.value;
  const { data, error } = await supabase
    .from("voice_profiles")
    .update({
      ...v,
      tone: v.tone || null,
      ...(v.tone !== (current?.tone ?? "") ? { tone_source: v.tone ? "user" : null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", member.workspace_id)
    .select("workspace_id");
  if (error || !data?.length) return { error: "We couldn't save that. Check your connection and try again." };
  revalidatePath("/app/voice");
  return { saved: true };
}
