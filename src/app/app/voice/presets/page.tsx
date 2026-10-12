import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { supabaseServer } from "@/lib/supabase/server";
import { PresetCompare } from "./preset-compare";

export default async function PresetsPage() {
  const { data: profile } = await (await supabaseServer()).from("profiles").select("niche").single();
  const suggestion = profile?.niche ? `A lesson from a recent ${profile.niche} project` : "";
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-10">
      <Wordmark />
      <Link href="/app/voice" className="text-sm underline">Back to your voice</Link>
      <h1 className="text-3xl font-bold">Compare presets</h1>
      <p className="max-w-xl text-slate">See the same topic in all five styles, in your voice. Pick the one you like.</p>
      <div className="border-t-2 border-dashed border-marigold" aria-hidden />
      <PresetCompare suggestion={suggestion} />
    </main>
  );
}
