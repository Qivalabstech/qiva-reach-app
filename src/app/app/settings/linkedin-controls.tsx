"use client";

import { useState, useTransition } from "react";
import { HEADLINE_MAX } from "@/lib/linkedin-auth";
import { removeLinkedIn, saveLinkedInHeadline } from "./linkedin-actions";

export function LinkedInControls({ headline }: { headline: string }) {
  const [value, setValue] = useState(headline);
  const [msg, setMsg] = useState<{ error?: string; saved?: boolean }>({});
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const save = () => startTransition(async () => setMsg(await saveLinkedInHeadline(value)));
  const remove = () => {
    setConfirming(false);
    startTransition(async () => setMsg(await removeLinkedIn()));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="headline" className="text-sm font-semibold">Your headline (optional)</label>
        <p className="text-sm text-slate">
          LinkedIn doesn&apos;t share your headline with apps like ours. Type it here if you&apos;d like to keep it with your profile.
        </p>
        <input
          id="headline"
          value={value}
          maxLength={HEADLINE_MAX}
          onChange={(e) => { setMsg({}); setValue(e.target.value); }}
          className="w-full rounded-control border border-line bg-white px-4 py-3 text-base"
        />
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={pending} className="rounded-control bg-ink px-4 py-2 font-display font-semibold text-white disabled:opacity-50">
            Save headline
          </button>
          {msg.saved && <p role="status" className="text-sm text-peacock">Saved.</p>}
        </div>
        {msg.error && <p role="alert" className="text-sm text-sindoor">{msg.error}</p>}
      </div>

      {confirming ? (
        <div role="group" aria-label="Confirm removing LinkedIn access" className="rounded-card border border-line bg-white p-4">
          <p>This deletes the LinkedIn access saved by Qiva Reach. You can connect again any time.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={remove} className="rounded-control bg-sindoor px-4 py-2 font-display font-semibold text-white">Remove</button>
            <button onClick={() => setConfirming(false)} className="rounded-control border border-ink px-4 py-2 font-display font-semibold">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} disabled={pending} className="self-start rounded-control border border-ink px-4 py-2 font-display font-semibold disabled:opacity-50">
          Remove LinkedIn access
        </button>
      )}
      <p className="text-sm text-slate">
        To also remove Qiva Reach on LinkedIn itself: LinkedIn, Settings, Data privacy, Permitted services.
      </p>
    </div>
  );
}
