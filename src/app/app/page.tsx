import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { supabaseServer } from "@/lib/supabase/server";
import { Wordmark } from "@/components/wordmark";
import { signOut } from "./actions";

export default async function AppHome() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").single();
  const { data: latest } = await supabase
    .from("posts")
    .select("id")
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { count: imported } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "imported");
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-10">
      <Wordmark />
      <div className="flex items-center gap-3">
        <Avatar url={profile?.avatar_url} name={profile?.full_name ?? user?.email} />
        <h1 className="text-3xl font-bold">Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
      </div>
      <p className="text-slate">Signed in as {user?.email}.</p>
      {imported ? (
        <p>{imported} of your posts imported. <Link href="/app/voice" className="underline">Check your voice</Link></p>
      ) : (
        <p>
          No drafts yet. Paste a few old posts and we&apos;ll learn your voice.{" "}
          <Link href="/onboarding/voice" className="underline">Add posts</Link>
        </p>
      )}
      <Link href="/app/ideas" className="underline">Post ideas</Link>
      <Link href="/app/write" className="underline">Write a post</Link>
      {latest && <Link href={`/app/write/${latest.id}`} className="underline">Continue your draft</Link>}
      <Link href="/app/voice" className="underline">Your voice</Link>
      <Link href="/app/settings" className="underline">Settings</Link>
      <form action={signOut}>
        <button className="rounded-control border border-ink px-4 py-3 font-display font-semibold">
          Sign out
        </button>
      </form>
    </main>
  );
}
