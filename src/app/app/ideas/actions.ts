"use server";

import { redirect } from "next/navigation";
import { askModel } from "@/ai/client";
import { FOCUS_MAX, IDEAS_ERROR, IDEAS_WANTED, generateIdeas } from "@/lib/ideas";
import { splitFirstLine } from "@/lib/hooks";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { DEFAULT_BANNED_PHRASES } from "@/lib/voice-profile";

const CALLS_PER_DAY = 60; // about 30 clicks; the top-up call counts too
const LIMIT_MESSAGE = "You've reached today's ideas limit. Try again tomorrow.";
const NEED_PROFILE = "Tell us your goal and niche first.";

export async function getIdeas(focus: string): Promise<{ ideas?: string[]; short?: boolean; error?: string }> {
  const f = typeof focus === "string" ? focus.trim().slice(0, FOCUS_MAX) : "";
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("goal, niche").eq("id", user.id).single();
  if (!profile?.goal || !profile?.niche) return { error: NEED_PROFILE };
  const { data: member } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).single();
  if (!member) return { error: IDEAS_ERROR };
  const workspaceId: string = member.workspace_id;

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabaseAdmin()
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("feature", "idea_generation")
    .gte("created_at", since);
  if ((count ?? 0) >= CALLS_PER_DAY) return { error: LIMIT_MESSAGE };

  const [{ data: shown }, { data: voice }, { data: recent }] = await Promise.all([
    supabase.from("ideas").select("text").eq("workspace_id", workspaceId).gte("created_at", since).order("created_at", { ascending: false }).limit(200),
    supabase.from("voice_profiles").select("banned_phrases").eq("workspace_id", workspaceId).single(),
    supabase.from("posts").select("body").eq("workspace_id", workspaceId).eq("status", "imported").order("created_at", { ascending: false }).limit(5),
  ]);

  const r = await generateIdeas({
    goal: profile.goal,
    niche: profile.niche,
    focus: f,
    recentLines: (recent ?? []).map((p) => splitFirstLine(p.body as string).hook.trim().slice(0, 120)).filter(Boolean),
    seen: (shown ?? []).map((s) => s.text as string),
    banned: voice?.banned_phrases?.length ? voice.banned_phrases : DEFAULT_BANNED_PHRASES,
    ask: (system, userMsg) =>
      askModel({
        feature: "idea_generation",
        model: process.env.ANTHROPIC_MODEL_FAST!,
        system,
        user: userMsg,
        maxTokens: 2500,
        noThinking: true,
        userId: user.id,
        workspaceId,
      }),
  });
  if ("error" in r) return { error: r.error };

  await supabase.from("ideas").insert(r.ideas.map((text) => ({ workspace_id: workspaceId, text })));
  return { ideas: r.ideas, short: r.ideas.length < IDEAS_WANTED };
}
