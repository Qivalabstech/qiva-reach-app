"use server";

import { redirect } from "next/navigation";
import { parseGoalNiche } from "@/lib/goal-niche";
import { supabaseServer } from "@/lib/supabase/server";

export type FormState = { error?: string; saved?: boolean };

async function save(formData: FormData): Promise<FormState> {
  const parsed = parseGoalNiche(formData.get("goal"), formData.get("niche"));
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data, error } = await supabase
    .from("profiles")
    .update({ goal: parsed.goal, niche: parsed.niche })
    .eq("id", user.id)
    .select("id");
  if (error || !data?.length) return { error: "We couldn't save that. Check your connection and try again." };
  return { saved: true };
}

export async function saveOnboarding(_: FormState, formData: FormData): Promise<FormState> {
  const result = await save(formData);
  if (result.saved) redirect("/onboarding/voice");
  return result;
}

export async function saveSettings(_: FormState, formData: FormData): Promise<FormState> {
  return save(formData);
}
