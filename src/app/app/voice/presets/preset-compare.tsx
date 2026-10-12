"use client";

import { useState, useTransition } from "react";
import { PRESETS, type Preset } from "@/lib/presets";
import { SAMPLE_ERROR, type SampleResult } from "@/lib/preset-sample";
import { choosePreset, comparePresets, previewOne } from "./actions";

export function PresetCompare({ suggestion }: { suggestion: string }) {
  const [topic, setTopic] = useState(suggestion);
  const [facts, setFacts] = useState("");
  const [results, setResults] = useState<SampleResult[] | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [retrying, setRetrying] = useState<Preset | null>(null);

  const show = () => {
    setError("");
    startTransition(async () => {
      const r = await comparePresets(topic, facts);
      if (r.error) return setError(r.error);
      setResults(r.results ?? null);
    });
  };

  const retry = async (preset: Preset) => {
    setError("");
    setRetrying(preset);
    const r = await previewOne(preset, topic, facts);
    setRetrying(null);
    if (r.error) return setError(r.error);
    const fresh = r.results?.[0];
    if (fresh) setResults((cur) => cur?.map((x) => (x.preset === preset ? fresh : x)) ?? null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex max-w-xl flex-col gap-2">
        <label htmlFor="topic" className="text-sm font-semibold">What is the post about?</label>
        <input
          id="topic"
          value={topic}
          maxLength={300}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full rounded-control border border-line bg-white px-4 py-3 text-base"
        />
        <label htmlFor="facts" className="mt-2 text-sm font-semibold">Facts or numbers to use (optional)</label>
        <textarea
          id="facts"
          rows={2}
          maxLength={600}
          value={facts}
          onChange={(e) => setFacts(e.target.value)}
          className="w-full rounded-control border border-line bg-white px-4 py-3 text-base"
        />
        <p className="text-sm text-slate">Data-driven posts use only the numbers you type here.</p>
        {error && <p role="alert" className="text-sm text-sindoor">{error}</p>}
        <button
          onClick={show}
          disabled={pending}
          className="mt-2 rounded-control bg-marigold px-4 py-3 font-display font-semibold text-ink disabled:opacity-50"
        >
          {pending ? "Writing five samples…" : "Show all five"}
        </button>
      </div>

      <div aria-live="polite" className="sr-only">{pending ? "Writing five samples" : results ? "Five samples ready" : ""}</div>

      {results && (
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {results.map((r) => {
            const meta = PRESETS.find((p) => p.value === r.preset)!;
            return (
              <li key={r.preset} className="flex flex-col gap-3 rounded-card border border-line bg-white p-4">
                <h2 className="font-display text-xl font-semibold">{meta.label}</h2>
                {r.text ? (
                  <>
                    <p className="whitespace-pre-line text-base">{r.text}</p>
                    <form action={() => choosePreset(r.preset)} className="mt-auto">
                      <button className="w-full rounded-control bg-ink px-4 py-2 font-display font-semibold text-white">
                        Use this preset
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <p role="status" className="text-sm text-sindoor">{r.error ?? SAMPLE_ERROR}</p>
                    <button
                      onClick={() => retry(r.preset)}
                      disabled={retrying === r.preset}
                      className="mt-auto rounded-control border border-ink px-4 py-2 font-display font-semibold disabled:opacity-50"
                    >
                      {retrying === r.preset ? "Trying…" : "Try again"}
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
