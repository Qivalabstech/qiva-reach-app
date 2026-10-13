"use server";

import { redirect } from "next/navigation";
import { askModel } from "@/ai/client";
import { inventedNumbers } from "@/lib/banned";
import { DRAFT_ERROR, MAX_BODY, MAX_NOTES, generateDraft } from "@/lib/post-writer";
import { isPreset, type Preset } from "@/lib/presets";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { DEFAULT_BANNED_PHRASES } from "@/lib/voice-profile";

const CALLS_PER_DAY = 60; // about 30 drafts; every model call, including rewrites, counts
const LIMIT_MESSAGE = "You've reached today's writing limit. Try again tomorrow.";

export type WriteResult = { error?: string };

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
  const workspaceId: string = member.workspace_id;
  const [{ data: voice }, { data: examples }] = await Promise.all([
    supabase.from("voice_profiles").select("*").eq("workspace_id", workspaceId).single(),
    supabase
      .from("posts")
      .select("body")
      .eq("workspace_id", workspaceId)
      .eq("status", "imported")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);
  return {
    supabase,
    userId: user.id,
    workspaceId,
    defaultPreset: (voice?.preset ?? null) as Preset | null,
    voice: {
      tone: voice?.tone ?? "",
      emoji_use: voice?.emoji_use ?? "light",
      signature_phrases: voice?.signature_phrases ?? [],
      banned_phrases: voice?.banned_phrases?.length ? voice.banned_phrases : DEFAULT_BANNED_PHRASES,
      avg_length: voice?.avg_length ?? 0,
    },
    examples: (examples ?? []).map((e) => e.body as string),
  };
}

type Ctx = Awaited<ReturnType<typeof context>>;

async function underLimit(userId: string) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabaseAdmin()
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", "post_write")
    .gte("created_at", since);
  return (count ?? 0) < CALLS_PER_DAY;
}

async function draftFor(c: Ctx, notes: string, preset: Preset | null) {
  if (!(await underLimit(c.userId))) return { error: LIMIT_MESSAGE };
  return generateDraft({
    notes,
    preset,
    voice: c.voice,
    examples: c.examples,
    ask: (system, user) =>
      askModel({
        feature: "post_write",
        model: process.env.ANTHROPIC_MODEL_WRITER!,
        system,
        user,
        maxTokens: 700,
        userId: c.userId,
        workspaceId: c.workspaceId,
      }),
  });
}

export async function writeDraft(notes: string, style: string): Promise<WriteResult> {
  const n = typeof notes === "string" ? notes.trim() : "";
  if (!n) return { error: "Add a topic or some notes first." };
  if (n.length > MAX_NOTES) return { error: `Keep your notes under ${MAX_NOTES} characters.` };
  const c = await context();
  const preset = style === "default" ? c.defaultPreset : isPreset(style) ? style : null;

  const r = await draftFor(c, n, preset);
  if ("error" in r) return { error: r.error };
  const { data, error } = await c.supabase
    .from("posts")
    .insert({ workspace_id: c.workspaceId, author_id: c.userId, body: r.text, status: "draft", notes: n, style: preset })
    .select("id")
    .single();
  if (error || !data) return { error: "We couldn't save your draft. Check your connection and try again." };
  redirect(`/app/write/${data.id}`);
}

export async function saveDraft(id: string, body: string): Promise<WriteResult> {
  if (typeof body !== "string" || !body.trim() || body.length > MAX_BODY)
    return { error: `A post needs some text and can be at most ${MAX_BODY} characters.` };
  const { supabase } = await context();
  const { data, error } = await supabase.from("posts").update({ body }).eq("id", id).eq("status", "draft").select("id");
  return error || !data?.length ? { error: "We couldn't save that. Check your connection." } : {};
}

export async function rewriteDraft(id: string): Promise<WriteResult & { body?: string; invented?: string[] }> {
  const c = await context();
  const { data: post } = await c.supabase.from("posts").select("notes, style").eq("id", id).eq("status", "draft").single();
  if (!post?.notes) return { error: "We can't find the notes for this draft. Write a new post instead." };
  const r = await draftFor(c, post.notes, (post.style ?? null) as Preset | null);
  if ("error" in r) return { error: r.error };
  const { error } = await c.supabase.from("posts").update({ body: r.text }).eq("id", id);
  if (error) return { error: DRAFT_ERROR };
  return { body: r.text, invented: inventedNumbers(r.text, post.notes) };
}
