import { Wordmark } from "@/components/wordmark";

export default function Onboarding() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-10">
      <Wordmark />
      <h1 className="text-3xl font-bold">Let&apos;s set up your account</h1>
      <p className="text-slate">Goal and niche setup comes next.</p>
    </main>
  );
}
