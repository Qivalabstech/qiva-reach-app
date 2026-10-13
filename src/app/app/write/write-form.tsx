"use client";

import { useState, useTransition } from "react";
import { PRESETS } from "@/lib/presets";
import { MAX_NOTES } from "@/lib/post-writer";
import { writeDraft } from "./actions";

export function WriteForm({ defaultLabel, initialNotes }: { defaultLabel: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [style, setStyle] = useState("default");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const r = await writeDraft(notes, style);
      if (r?.error) setError(r.error);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className="text-sm font-semibold">Topic or notes</label>
        <p className="text-sm text-slate">A topic is enough. Notes, facts and numbers make it more yours.</p>
        <textarea
          id="notes"
          rows={8}
          maxLength={MAX_NOTES}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-control border border-line bg-white px-4 py-3 text-base"
        />
        <p className="text-sm text-slate">{notes.length} of {MAX_NOTES}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="style" className="text-sm font-semibold">Style</label>
        <select
          id="style"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="w-full rounded-control border border-line bg-white px-4 py-3 text-base"
        >
          <option value="default">My default ({defaultLabel})</option>
          <option value="none">Just my voice</option>
          {PRESETS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <p className="text-sm text-slate">This applies to this draft only.</p>
      </div>

      {error && <p role="alert" className="text-sm text-sindoor">{error}</p>}
      <button
        onClick={submit}
        disabled={pending}
        className="rounded-control bg-marigold px-4 py-3 font-display font-semibold text-ink disabled:opacity-50"
      >
        {pending ? "Writing in your voice…" : "Write my post"}
      </button>
    </div>
  );
}
