"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { inventedNumbers } from "@/lib/banned";
import { MAX_BODY, countWords } from "@/lib/post-writer";
import { rewriteDraft, saveDraft } from "../actions";

export function DraftEditor({ id, initialBody, notes }: { id: string; initialBody: string; notes: string }) {
  const [body, setBody] = useState(initialBody);
  const [generated, setGenerated] = useState(initialBody); // last text the model wrote, to spot user edits
  const [saved, setSaved] = useState<"saved" | "saving" | "error">("saved");
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const lastSaved = useRef(initialBody);

  useEffect(() => {
    if (body === lastSaved.current) return;
    setSaved("saving");
    const t = setTimeout(async () => {
      const r = await saveDraft(id, body);
      if (r.error) return setSaved("error");
      lastSaved.current = body;
      setSaved("saved");
    }, 800);
    return () => clearTimeout(t);
  }, [body, id]);

  const invented = inventedNumbers(body, notes);

  const copy = async () => {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const again = () => {
    setConfirming(false);
    setError("");
    startTransition(async () => {
      const r = await rewriteDraft(id);
      if (r.error || !r.body) return setError(r.error ?? "We couldn't write a clean draft. Try again.");
      lastSaved.current = r.body;
      setBody(r.body);
      setGenerated(r.body);
      setSaved("saved");
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor="draft" className="sr-only">Your post</label>
      <textarea
        id="draft"
        rows={16}
        maxLength={MAX_BODY}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full rounded-card border border-line bg-white px-4 py-3 text-base leading-relaxed"
      />
      <div className="flex justify-between text-sm text-slate">
        <span>{countWords(body)} words</span>
        <span role="status">
          {saved === "saving" ? "Saving…" : saved === "error" ? "We couldn't save. Check your connection." : "Saved"}
        </span>
      </div>

      {invented.length > 0 && (
        <p role="status" className="rounded-control bg-marigold-soft p-3 text-sm">
          This draft has numbers you didn&apos;t give us ({invented.join(", ")}). Check them before you post.
        </p>
      )}
      {error && <p role="alert" className="text-sm text-sindoor">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button onClick={copy} className="rounded-control bg-ink px-4 py-3 font-display font-semibold text-white">
          {copied ? "Copied" : "Copy post"}
        </button>
        <button
          onClick={() => (body !== generated ? setConfirming(true) : again())}
          disabled={pending}
          className="rounded-control border border-ink px-4 py-3 font-display font-semibold disabled:opacity-50"
        >
          {pending ? "Writing…" : "Write again"}
        </button>
      </div>

      {confirming && (
        <div role="group" aria-label="Confirm writing again" className="rounded-card border border-line bg-white p-4">
          <p>This replaces your edits.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={again} className="rounded-control bg-ink px-4 py-2 font-display font-semibold text-white">Replace</button>
            <button onClick={() => setConfirming(false)} className="rounded-control border border-ink px-4 py-2 font-display font-semibold">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
