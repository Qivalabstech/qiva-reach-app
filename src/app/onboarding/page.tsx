import { Wordmark } from "@/components/wordmark";
import { GoalNicheForm } from "@/components/goal-niche-form";
import { supabaseServer } from "@/lib/supabase/server";
import { saveOnboarding } from "./actions";

export default async function Onboarding() {
  const { data: profile } = await (await supabaseServer()).from("profiles").select("goal, niche").single();
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-10">
      <Wordmark />
      <p className="text-sm text-slate">Step 1 of 2</p>
      <h1 className="text-3xl font-bold">Let&apos;s set up your account</h1>
      <div className="border-t-2 border-dashed border-marigold" aria-hidden />
      <GoalNicheForm
        action={saveOnboarding}
        initialGoal={profile?.goal ?? null}
        initialNiche={profile?.niche ?? null}
        submitLabel="Continue"
      />
    </main>
  );
}
