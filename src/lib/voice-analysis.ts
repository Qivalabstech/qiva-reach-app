import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { askModel } from "@/ai/client";
import { VOICE_ANALYSIS_SYSTEM, voiceAnalysisUser } from "@/ai/prompts/voice-analysis.v1";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MIN_POSTS, MIN_POSTS_MESSAGE } from "@/lib/voice-import";
import { DEFAULT_BANNED_PHRASES, averageLength, cleanPhrases, emojiUse, parseAnalysis } from "@/lib/voice-profile";

export const DAILY_ANALYSES = 5;

export type AnalysisResult = { ok: true; toneFailed: boolean } | { ok: false; error: string };

// Reads the user's imported posts and fills the voice profile. Length and emoji are counted;
// tone and signature phrases come from one fast-model call. If that call fails the counted fields still save.
export async function runVoiceAnalysis(supabase: SupabaseClient, userId: string): Promise<AnalysisResult> {
  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .single();
  if (!member) return { ok: false, error: "We couldn't find your workspace. Sign out, sign in and try again." };
  const workspaceId: string = member.workspace_id;

  const { data: rows } = await supabase
    .from("posts")
    .select("body")
    .eq("workspace_id", workspaceId)
    .eq("status", "imported")
    .order("created_at", { ascending: false })
    .limit(20);
  const posts = (rows ?? []).map((r) => r.body as string);
  if (posts.length < MIN_POSTS) return { ok: false, error: MIN_POSTS_MESSAGE };

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabaseAdmin()
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", "voice_analysis")
    .gte("created_at", since);
  if ((count ?? 0) >= DAILY_ANALYSES)
    return { ok: false, error: `You've learned your voice ${DAILY_ANALYSES} times today. Try again tomorrow.` };

  const { data: current } = await supabase
    .from("voice_profiles")
    .select("analyzed_at, banned_phrases")
    .eq("workspace_id", workspaceId)
    .single();

  let analysis: ReturnType<typeof parseAnalysis> = null;
  try {
    const reply = await askModel({
      feature: "voice_analysis",
      model: process.env.ANTHROPIC_MODEL_FAST!,
      system: VOICE_ANALYSIS_SYSTEM,
      user: voiceAnalysisUser(posts),
      maxTokens: 400,
      userId,
      workspaceId,
    });
    analysis = parseAnalysis(reply);
  } catch {
    analysis = null;
  }

  const banned: string[] = current?.banned_phrases ?? [];
  const firstTime = !current?.analyzed_at && banned.length === 0;
  const update: Record<string, unknown> = {
    avg_length: averageLength(posts),
    emoji_use: emojiUse(posts),
    analyzed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (firstTime) update.banned_phrases = DEFAULT_BANNED_PHRASES;
  if (analysis) {
    const bannedNow = new Set((firstTime ? DEFAULT_BANNED_PHRASES : banned).map((b) => b.toLowerCase()));
    update.tone = analysis.tone;
    update.tone_source = "ai";
    update.signature_phrases = cleanPhrases(
      analysis.signature.filter((s) => !bannedNow.has(s.toLowerCase())),
      5,
    );
  }
  const { error } = await supabase.from("voice_profiles").update(update).eq("workspace_id", workspaceId);
  if (error) return { ok: false, error: "We couldn't save your voice. Check your connection and try again." };
  return { ok: true, toneFailed: !analysis };
}
