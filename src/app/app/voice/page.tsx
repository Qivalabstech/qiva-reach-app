import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { supabaseServer } from "@/lib/supabase/server";
import { MIN_POSTS } from "@/lib/voice-import";
import { VoiceForm } from "./voice-form";

export default async function VoicePage() {
  const supabase = await supabaseServer();
  const [{ data: voice }, { count }] = await Promise.all([
    supabase.from("voice_profiles").select("*").single(),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "imported"),
  ]);
  const hasPosts = (count ?? 0) >= MIN_POSTS;

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-10">
      <Wordmark />
      <Link href="/app" className="text-sm underline">Back to the app</Link>
      <h1 className="text-3xl font-bold">Your voice</h1>
      <p className="text-slate">Check this. Every draft follows it.</p>
      <div className="border-t-2 border-dashed border-marigold" aria-hidden />
      {!hasPosts && !voice?.analyzed_at ? (
        <p>
          No posts yet. Paste a few old posts and we&apos;ll learn your voice.{" "}
          <Link href="/onboarding/voice" className="underline">Add posts</Link>
        </p>
      ) : (
        <VoiceForm
          key={voice?.analyzed_at ?? "new"}
          analyzed={!!voice?.analyzed_at}
          initial={{
            tone: voice?.tone ?? "",
            avg_length: voice?.avg_length ?? 0,
            emoji_use: voice?.emoji_use ?? "light",
            signature_phrases: voice?.signature_phrases ?? [],
            banned_phrases: voice?.banned_phrases ?? [],
            preset: voice?.preset ?? null,
          }}
        />
      )}
    </main>
  );
}
