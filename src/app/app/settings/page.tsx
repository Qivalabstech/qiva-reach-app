import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { GoalNicheForm } from "@/components/goal-niche-form";
import { saveSettings } from "@/app/onboarding/actions";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Settings() {
  const { data: profile } = await (await supabaseServer()).from("profiles").select("goal, niche").single();
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-10">
      <Wordmark />
      <Link href="/app" className="text-sm underline">Back to the app</Link>
      <h1 className="text-3xl font-bold">Settings</h1>
      <h2 className="font-display text-2xl font-semibold">Goal and niche</h2>
      <GoalNicheForm
        action={saveSettings}
        initialGoal={profile?.goal ?? null}
        initialNiche={profile?.niche ?? null}
        submitLabel="Save changes"
      />
    </main>
  );
}
