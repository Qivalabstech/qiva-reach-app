import { Wordmark } from "@/components/wordmark";
import { VoiceImport } from "./voice-import";

export default function VoiceStep() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-10">
      <Wordmark />
      <p className="text-sm text-slate">Step 2 of 2</p>
      <h1 className="text-3xl font-bold">Teach us your voice</h1>
      <div className="border-t-2 border-dashed border-marigold" aria-hidden />
      <VoiceImport />
    </main>
  );
}
