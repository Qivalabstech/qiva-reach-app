import Link from "next/link";
import { notFound } from "next/navigation";
import { Wordmark } from "@/components/wordmark";
import { supabaseServer } from "@/lib/supabase/server";
import { DraftEditor } from "./draft-editor";

export default async function DraftPage({ params }: PageProps<"/app/write/[id]">) {
  const { id } = await params;
  const { data: post } = await (await supabaseServer())
    .from("posts")
    .select("id, body, notes")
    .eq("id", id)
    .eq("status", "draft")
    .maybeSingle();
  if (!post) notFound();
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-10">
      <Wordmark />
      <Link href="/app" className="text-sm underline">Back to the app</Link>
      <h1 className="text-3xl font-bold">Your draft</h1>
      <div className="border-t-2 border-dashed border-marigold" aria-hidden />
      <DraftEditor id={post.id} initialBody={post.body} notes={post.notes ?? ""} />
      <Link href="/app/write" className="text-sm underline">Write another post</Link>
    </main>
  );
}
