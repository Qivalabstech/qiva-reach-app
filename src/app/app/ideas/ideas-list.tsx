"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FOCUS_MAX, IDEAS_WANTED } from "@/lib/ideas";
import { getIdeas } from "./actions";

export function IdeasList() {
  const [focus, setFocus] = useState("");
  const [ideas, setIdeas] = useState<string[]>([]);
  const [short, setShort] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const click = () => {
    setError("");
    startTransition(async () => {
      const r = await getIdeas(focus);
      if (r.error || !r.ideas) return setError(r.error ?? "We couldn't get ideas. Try again.");
      setIdeas(r.ideas);
      setShort(!!r.short);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex max-w-xl flex-col gap-2">
        <label htmlFor="focus" className="text-sm font-semibold">Focus on (optional)</label>
        <input
          id="focus"
          value={focus}
          maxLength={FOCUS_MAX}
          onChange={(e) => setFocus(e.target.value)}
          placeholder="For example: lessons from client work"
          className="w-full rounded-control border border-line bg-white px-4 py-3 text-base"
        />
        {error && (
          <p role="alert" className="text-sm text-sindoor">
            {error}
            {error.startsWith("Tell us your goal") && (
              <>
                {" "}
                <Link href="/app/settings" className="underline">Open settings</Link>
              </>
            )}
          </p>
        )}
        <button
          onClick={click}
          disabled={pending}
          className="mt-2 rounded-control bg-marigold px-4 py-3 font-display font-semibold text-ink disabled:opacity-50"
        >
          {pending ? "Finding ideas…" : `Get ${IDEAS_WANTED} ideas`}
        </button>
      </div>

      {short && <p role="status" className="text-sm text-slate">We could only find {ideas.length} fresh ideas this time. Try again, or change the focus.</p>}

      {ideas.length > 0 && (
        <ol aria-label="Post ideas" className="flex flex-col gap-3">
          {ideas.map((idea, i) => (
            <li key={idea} className="flex flex-col gap-2 rounded-card border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base"><span className="sr-only">Idea {i + 1}: </span>{idea}</p>
              <Link
                href={`/app/write?topic=${encodeURIComponent(idea)}`}
                className="shrink-0 rounded-control bg-ink px-4 py-2 text-center font-display font-semibold text-white"
              >
                Write this post
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
