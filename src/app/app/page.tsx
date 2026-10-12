import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { Wordmark } from "@/components/wordmark";
import { signOut } from "./actions";

export default async function AppHome() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").single();
  const { count: imported } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "imported");
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-10">
      <Wordmark />
      <h1 className="text-3xl font-bold">Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
      <p className="text-slate">Signed in as {user?.email}.</p>
      {imported ? (
        <p>{imported} of your posts imported. Your voice profile comes next.</p>
      ) : (
        <p>
          No drafts yet. Paste a few old posts and we&apos;ll learn your voice.{" "}
          <Link href="/onboarding/voice" className="underline">Add posts</Link>
        </p>
      )}
      <Link href="/app/settings" className="underline">Settings</Link>
      <form action={signOut}>
        <button className="rounded-control border border-ink px-4 py-3 font-display font-semibold">
          Sign out
        </button>
      </form>
    </main>
  );
}
