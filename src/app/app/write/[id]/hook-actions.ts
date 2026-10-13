"use server";

import { redirect } from "next/navigation";
import { askModel } from "@/ai/client";
import { generateHooks, HOOK_ERROR, type HookList } from "@/lib/hook-lab";
import { HOOK_MAX, splitFirstLine, swapFirstLine } from "@/lib/hooks";
import { MAX_BODY } from "@/lib/post-writer";
import type { Preset } from "@/lib/presets";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { DEFAULT_BANNED_PHRASES } from "@/lib/voice-profile";

const CALLS_PER_DAY = 80; // about 40 lists; the top-up call counts too
const LIMIT_MESSAGE = "You've reached today's hook limit. Try again tomorrow.";

export async function getHooks(id: string, body: string, avoid: string[]): Promise<HookList | { error: string }> {
  if (typeof body !== "string" || !body.trim() || body.length > MAX_BODY) return { error: HOOK_ERROR };
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: post } = await supabase.from("posts").select("workspace_id, style").eq("id", id).eq("status", "draft").maybeSingle();
  if (!post) return { error: HOOK_ERROR };

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabaseAdmin()
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("feature", "hook_lab")
    .gte("created_at", since);
  if ((count ?? 0) >= CALLS_PER_DAY) return { error: LIMIT_MESSAGE };

  const { data: voice } = await supabase.from("voice_profiles").select("*").eq("workspace_id", post.workspace_id).single();
  return generateHooks({
    post: body,
    preset: (post.style ?? null) as Preset | null,
    avoid: (Array.isArray(avoid) ? avoid : []).filter((a) => typeof a === "string").slice(0, 30),
    voice: {
      tone: voice?.tone ?? "",
      emoji_use: voice?.emoji_use ?? "light",
      signature_phrases: voice?.signature_phrases ?? [],
      banned_phrases: voice?.banned_phrases?.length ? voice.banned_phrases : DEFAULT_BANNED_PHRASES,
    },
    ask: (system, userMsg) =>
      askModel({
        feature: "hook_lab",
        model: process.env.ANTHROPIC_MODEL_FAST!,
        system,
        user: userMsg,
        maxTokens: 2500,
        noThinking: true,
        userId: user.id,
        workspaceId: post.workspace_id,
      }),
  });
}

// Replaces only the first line of the draft the user is looking at, and saves it.
export async function swapHook(id: string, body: string, hook: string): Promise<{ error?: string; body?: string }> {
  const h = typeof hook === "string" ? hook.trim() : "";
  if (!h || h.includes("\n") || h.length > HOOK_MAX) return { error: "That hook can't be used. Pick another." };
  if (typeof body !== "string" || !splitFirstLine(body).hook.trim() || body.length > MAX_BODY)
    return { error: "We couldn't change the first line. Try again." };
  const next = swapFirstLine(body, h);
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("posts").update({ body: next, hook: h }).eq("id", id).eq("status", "draft").select("id");
  if (error || !data?.length) return { error: "We couldn't save that. Check your connection." };
  return { body: next };
}
