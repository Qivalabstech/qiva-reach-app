"use client";

import { useActionState, useState } from "react";
import { GOALS, NICHES } from "@/lib/goal-niche";
import type { FormState } from "@/app/onboarding/actions";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initialGoal: string | null;
  initialNiche: string | null;
  submitLabel: string;
};

export function GoalNicheForm({ action, initialGoal, initialNiche, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [goal, setGoal] = useState(initialGoal ?? "");
  const [niche, setNiche] = useState(initialNiche ?? "");
  const isChip = (NICHES as readonly string[]).includes(niche);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-display text-xl font-semibold">What do you want from LinkedIn?</legend>
        {GOALS.map((g) => (
          <label
            key={g.value}
            className="flex cursor-pointer items-center gap-3 rounded-card border border-line bg-white p-4 has-[:checked]:border-2 has-[:checked]:border-ink has-[:focus-visible]:outline-4 has-[:focus-visible]:outline-marigold-soft"
          >
            <input
              type="radio"
              name="goal"
              value={g.value}
              checked={goal === g.value}
              onChange={() => setGoal(g.value)}
              className="size-5 accent-ink"
            />
            <span>{g.label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-display text-xl font-semibold">What do you write about?</legend>
        <div className="flex flex-wrap gap-2">
          {NICHES.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={niche === n}
              onClick={() => setNiche(n)}
              className={`rounded-control border px-3 py-2 text-base ${
                niche === n ? "border-ink bg-ink text-white" : "border-line bg-white"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <label htmlFor="niche-text" className="mt-2 text-sm font-semibold">
          Something else
        </label>
        <input
          id="niche-text"
          type="text"
          maxLength={80}
          value={isChip ? "" : niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="For example: sustainable packaging"
          className="w-full rounded-control border border-line bg-white px-4 py-3 text-base"
        />
        <input type="hidden" name="niche" value={niche} />
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm text-sindoor">
          {state.error}
        </p>
      )}
      {state.saved && (
        <p role="status" className="text-sm text-peacock">
          Saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !goal || !niche.trim()}
        className="rounded-control bg-marigold px-4 py-3 font-display font-semibold text-ink disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
