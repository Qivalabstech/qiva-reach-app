"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { askModel } from "@/ai/client";
import { generateSample, type SampleResult } from "@/lib/preset-sample";
import { PRESETS, isPreset, type Preset } from "@/lib/presets";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { DEFAULT_BANNED_PHRASES } from "@/lib/voice-profile";

const PREVIEW_CALLS_PER_DAY = 50; // 10 comparisons of 5 samples

export type CompareResult = { error?: string; results?: SampleResult[] };

async function context() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (!member) redirect("/sign-in");
  const { data: voice } = await supabase
    .from("voice_profiles")
    .select("tone, emoji_use, signature_phrases, banned_phrases")
    .eq("workspace_id", member.workspace_id)
    .single();
  return {
    supabase,
    userId: user.id,
    workspaceId: member.workspace_id as string,
    voice: {
      tone: voice?.tone ?? "",
      emoji_use: voice?.emoji_use ?? "light",
      signature_phrases: voice?.signature_phrases ?? [],
      banned_phrases: voice?.banned_phrases?.length ? voice.banned_phrases : DEFAULT_BANNED_PHRASES,
    },
  };
}

function clean(topic: unknown, facts: unknown) {
  const t = typeof topic === "string" ? topic.trim() : "";
  const f = typeof facts === "string" ? facts.trim() : "";
  if (!t) return { error: "Add a topic first." };
  if (t.length > 300 || f.length > 600) return { error: "Shorten the topic or the facts and try again." };
  return { topic: t, facts: f };
}

async function withinLimit(userId: string, calls: number) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabaseAdmin()
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", "preset_preview")
    .gte("created_at", since);
  return (count ?? 0) + calls <= PREVIEW_CALLS_PER_DAY;
}

const LIMIT_MESSAGE = "You've compared presets 10 times today. Try again tomorrow.";

async function one(c: Awaited<ReturnType<typeof context>>, preset: Preset, topic: string, facts: string) {
  return generateSample({
    preset,
    topic,
    facts,
    voice: c.voice,
    ask: (system, user) =>
      askModel({
        feature: "preset_preview",
        model: process.env.ANTHROPIC_MODEL_FAST!,
        system,
        user,
        maxTokens: 1000,
        noThinking: true,
        userId: c.userId,
        workspaceId: c.workspaceId,
      }),
  });
}

export async function comparePresets(topic: string, facts: string): Promise<CompareResult> {
  const input = clean(topic, facts);
  if ("error" in input) return { error: input.error };
  const c = await context();
  if (!(await withinLimit(c.userId, PRESETS.length))) return { error: LIMIT_MESSAGE };
  return { results: await Promise.all(PRESETS.map((p) => one(c, p.value, input.topic, input.facts))) };
}

export async function previewOne(preset: string, topic: string, facts: string): Promise<CompareResult> {
  const input = clean(topic, facts);
  if ("error" in input) return { error: input.error };
  if (!isPreset(preset)) return { error: "Pick one of the five presets." };
  const c = await context();
  if (!(await withinLimit(c.userId, 1))) return { error: LIMIT_MESSAGE };
  return { results: [await one(c, preset, input.topic, input.facts)] };
}

export async function choosePreset(preset: string) {
  if (!isPreset(preset)) return;
  const c = await context();
  await c.supabase.from("voice_profiles").update({ preset, updated_at: new Date().toISOString() }).eq("workspace_id", c.workspaceId);
  revalidatePath("/app/voice");
  redirect("/app/voice");
}
