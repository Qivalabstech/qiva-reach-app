"use client";

import { useState, useTransition } from "react";
import { HOOK_TYPE_LABEL, splitFirstLine, type Hook } from "@/lib/hooks";
import { getHooks, swapHook } from "./hook-actions";

type Original = { text: string; score: number | null; reason: string };

const NOTE = "Scores are our estimate of how strong an opening is. They don't predict views.";

export function HookPanel({ id, body, onSwap }: { id: string; body: string; onSwap: (body: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [original, setOriginal] = useState<Original | null>(null);
  const [shown, setShown] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const active = splitFirstLine(body).hook.trim();

  const load = (more: boolean) => {
    setError("");
    setOpen(true);
    startTransition(async () => {
      const r = await getHooks(id, body, more ? shown : []);
      if ("error" in r) return setError(r.error);
      setHooks(r.hooks);
      if (!more || !original) setOriginal(r.current);
      setShown((s) => (more ? [...s, ...r.hooks.map((h) => h.text)] : r.hooks.map((h) => h.text)));
    });
  };

  const use = (text: string) => {
    setError("");
    startTransition(async () => {
      const r = await swapHook(id, body, text);
      if (r.error || !r.body) return setError(r.error ?? "We couldn't change the first line. Try again.");
      onSwap(r.body);
    });
  };

  const row = (text: string, score: number | null, reason: string, label: string, i?: number, type?: Hook["type"]) => {
    const isActive = text === active;
    return (
      <li
        key={`${label}-${text}`}
        aria-label={i ? `Hook ${i} of ${hooks.length}, score ${score} out of 10` : "Your current first line"}
        className="flex flex-col gap-2 rounded-card border border-line bg-white p-4"
      >
        <p className="text-sm text-slate">
          {label}
          {type ? ` · ${HOOK_TYPE_LABEL[type]}` : ""}
        </p>
        <p className="text-base">{text}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate">
            {score != null && <strong className="text-ink">{score} / 10</strong>}
            {reason && ` · ${reason}`}
          </p>
          {isActive ? (
            <span className="rounded-control bg-peacock-soft px-3 py-1 text-sm text-peacock">In your post</span>
          ) : (
            <button
              onClick={() => use(text)}
              disabled={pending}
              className="rounded-control bg-ink px-4 py-2 font-display font-semibold text-white disabled:opacity-50"
            >
              Use this hook
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {!open && (
        <button
          onClick={() => load(false)}
          disabled={pending || !active}
          className="self-start rounded-control border border-ink px-4 py-3 font-display font-semibold disabled:opacity-50"
        >
          {pending ? "Finding hooks…" : "Improve the hook"}
        </button>
      )}

      {open && (
        <section aria-label="Hook options" className="flex flex-col gap-3">
          <h2 className="font-display text-2xl font-semibold">Hooks for your post</h2>
          {pending && <p role="status" className="text-sm text-slate">Finding hooks…</p>}
          {error && <p role="alert" className="text-sm text-sindoor">{error}</p>}
          {original && (
            <ol className="flex flex-col gap-3">
              {row(original.text, original.score, original.reason, "Your current first line")}
              {hooks.map((h, i) => row(h.text, h.score, h.reason, `Option ${i + 1}`, i + 1, h.type))}
            </ol>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => load(true)}
              disabled={pending}
              className="rounded-control border border-ink px-4 py-3 font-display font-semibold disabled:opacity-50"
            >
              Show 10 more
            </button>
          </div>
          <p className="text-sm text-slate">{NOTE}</p>
        </section>
      )}
    </div>
  );
}
