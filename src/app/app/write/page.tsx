import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { presetLabel } from "@/lib/presets";
import { MAX_NOTES } from "@/lib/post-writer";
import { supabaseServer } from "@/lib/supabase/server";
import { WriteForm } from "./write-form";

export default async function WritePage({ searchParams }: PageProps<"/app/write">) {
  const { topic } = await searchParams;
  const { data: voice } = await (await supabaseServer()).from("voice_profiles").select("preset").single();
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-10">
      <Wordmark />
      <Link href="/app" className="text-sm underline">Back to the app</Link>
      <h1 className="text-3xl font-bold">Write a post</h1>
      <div className="border-t-2 border-dashed border-marigold" aria-hidden />
      <WriteForm
        defaultLabel={voice?.preset ? presetLabel(voice.preset) : "just my voice"}
        initialNotes={typeof topic === "string" ? topic.slice(0, MAX_NOTES) : ""}
      />
    </main>
  );
}
