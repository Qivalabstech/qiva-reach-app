"use client";

import { useState, useTransition } from "react";
import { PhraseList } from "@/components/phrase-list";
import { BANNED_MAX, EMOJI_USES, LENGTH_MAX, LENGTH_MIN, SIGNATURE_MAX, TONE_MAX, type EmojiUse } from "@/lib/voice-profile";
import { learnAgain, saveVoice, type VoiceResult } from "./actions";

export type VoiceValues = {
  tone: string;
  avg_length: number;
  emoji_use: EmojiUse;
  signature_phrases: string[];
  banned_phrases: string[];
};

const EMOJI_LABEL: Record<EmojiUse, string> = { none: "None", light: "Light", frequent: "Frequent" };

export function VoiceForm({ initial, analyzed }: { initial: VoiceValues; analyzed: boolean }) {
  const [v, setV] = useState(initial);
  const [result, setResult] = useState<VoiceResult>(
    analyzed && !initial.tone ? { notice: "We couldn't read your tone. Write it yourself or try again." } : {},
  );
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof VoiceValues>(k: K, val: VoiceValues[K]) => {
    setResult({});
    setV((p) => ({ ...p, [k]: val }));
  };

  const save = () => startTransition(async () => setResult(await saveVoice(v)));
  const relearn = () => {
    setConfirming(false);
    startTransition(async () => setResult(await learnAgain()));
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <label htmlFor="tone" className="text-sm font-semibold">Tone</label>
        <p className="text-sm text-slate">How you sound. For example: direct, warm, short sentences.</p>
        <textarea
          id="tone"
          rows={3}
          maxLength={TONE_MAX}
          value={v.tone}
          onChange={(e) => set("tone", e.target.value)}
          className="w-full rounded-control border border-line bg-white px-4 py-3 text-base"
        />
        <p className="text-sm text-slate">{v.tone.length} of {TONE_MAX}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="length" className="text-sm font-semibold">Average length (words)</label>
        <p className="text-sm text-slate">How long your posts usually are.</p>
        <input
          id="length"
          type="number"
          min={LENGTH_MIN}
          max={LENGTH_MAX}
          step={10}
          value={v.avg_length || ""}
          onChange={(e) => set("avg_length", Number(e.target.value))}
          className="w-32 rounded-control border border-line bg-white px-4 py-3 text-base"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">Emoji use</legend>
        <div className="flex gap-2">
          {EMOJI_USES.map((e) => (
            <label
              key={e}
              className="flex cursor-pointer items-center gap-2 rounded-control border border-line bg-white px-4 py-3 has-[:checked]:border-2 has-[:checked]:border-ink has-[:focus-visible]:outline-4 has-[:focus-visible]:outline-marigold-soft"
            >
              <input type="radio" name="emoji" checked={v.emoji_use === e} onChange={() => set("emoji_use", e)} className="accent-ink" />
              {EMOJI_LABEL[e]}
            </label>
          ))}
        </div>
      </fieldset>

      <PhraseList
        id="signature"
        label="Signature phrases"
        hint="Words or openers you often use. We will use them in your drafts."
        value={v.signature_phrases}
        max={SIGNATURE_MAX}
        onChange={(x) => set("signature_phrases", x)}
      />
      <PhraseList
        id="banned"
        label="Banned phrases"
        hint="Words you never want in a draft. The list starts with common AI clichés."
        value={v.banned_phrases}
        max={BANNED_MAX}
        onChange={(x) => set("banned_phrases", x)}
      />

      {result.error && <p role="alert" className="text-sm text-sindoor">{result.error}</p>}
      {result.notice && <p role="status" className="rounded-control bg-marigold-soft p-3 text-sm">{result.notice}</p>}
      {result.saved && <p role="status" className="text-sm text-peacock">Saved.</p>}

      <button
        onClick={save}
        disabled={pending}
        className="rounded-control bg-marigold px-4 py-3 font-display font-semibold text-ink disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save voice profile"}
      </button>

      {confirming ? (
        <div role="group" aria-label="Confirm learning again" className="rounded-card border border-line bg-white p-4">
          <p>This replaces your tone, length, emoji use and signature phrases. Your banned phrases stay.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={relearn} className="rounded-control bg-ink px-4 py-2 font-display font-semibold text-white">Replace</button>
            <button onClick={() => setConfirming(false)} className="rounded-control border border-ink px-4 py-2 font-display font-semibold">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          disabled={pending}
          className="rounded-control border border-ink px-4 py-3 font-display font-semibold disabled:opacity-50"
        >
          Learn again from my posts
        </button>
      )}
      <p className="text-sm text-slate">
        We use an AI model to read your posts. Your posts are never shown to other users.
      </p>
    </div>
  );
}
