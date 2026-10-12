import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export default function VoiceStep() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-10">
      <Wordmark />
      <p className="text-sm text-slate">Step 2 of 2</p>
      <h1 className="text-3xl font-bold">Teach us your voice</h1>
      <p className="text-slate">Pasting your past posts comes next. For now, your goal and niche are saved.</p>
      <Link href="/app" className="underline">Go to the app</Link>
    </main>
  );
}
