"use client";

import { useState } from "react";
import { PHRASE_MAX_CHARS } from "@/lib/voice-profile";

type Props = { id: string; label: string; hint: string; value: string[]; max: number; onChange: (v: string[]) => void };

export function PhraseList({ id, label, hint, value, max, onChange }: Props) {
  const [draft, setDraft] = useState("");

  function add() {
    const p = draft.trim().slice(0, PHRASE_MAX_CHARS);
    if (!p || value.length >= max || value.some((v) => v.toLowerCase() === p.toLowerCase())) return setDraft("");
    onChange([...value, p]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <p className="text-sm text-slate">{hint}</p>
      <ul className="flex flex-wrap gap-2">
        {value.map((p) => (
          <li key={p} className="flex items-center gap-1 rounded-control border border-line bg-white py-1 pl-3 pr-1">
            <span>{p}</span>
            <button
              type="button"
              aria-label={`Remove ${p}`}
              onClick={() => onChange(value.filter((v) => v !== p))}
              className="grid size-7 place-items-center rounded-control text-slate"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          maxLength={PHRASE_MAX_CHARS}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); add(); }
          }}
          disabled={value.length >= max}
          className="min-w-0 flex-1 rounded-control border border-line bg-white px-4 py-3 text-base disabled:opacity-50"
        />
        <button
          type="button"
          onClick={add}
          disabled={value.length >= max}
          className="rounded-control border border-ink px-4 py-3 font-display font-semibold disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <p className="text-sm text-slate">{value.length} of {max}</p>
    </div>
  );
}
