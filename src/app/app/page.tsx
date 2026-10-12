import { supabaseServer } from "@/lib/supabase/server";
import { Wordmark } from "@/components/wordmark";
import { signOut } from "./actions";

export default async function AppHome() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").single();
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-10">
      <Wordmark />
      <h1 className="text-3xl font-bold">Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
      <p className="text-slate">Signed in as {user?.email}. Your drafts will appear here.</p>
      <form action={signOut}>
        <button className="rounded-control border border-ink px-4 py-3 font-display font-semibold">
          Sign out
        </button>
      </form>
    </main>
  );
}
