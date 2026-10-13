import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { IdeasList } from "./ideas-list";

export default function IdeasPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 py-10">
      <Wordmark />
      <Link href="/app" className="text-sm underline">Back to the app</Link>
      <h1 className="text-3xl font-bold">Post ideas</h1>
      <p className="text-slate">Click for 20 ideas based on your goal and niche.</p>
      <div className="border-t-2 border-dashed border-marigold" aria-hidden />
      <IdeasList />
    </main>
  );
}
