"use client";

import { useMemo, useState, useTransition } from "react";
import { unzipSync } from "fflate";
import {
  MAX_POSTS, MIN_POSTS, MIN_POSTS_MESSAGE, RECOMMENDED_POSTS, TOO_LONG_MESSAGE,
  postsFromSharesCsv, selectPosts, splitPasted,
} from "@/lib/voice-import";
import { importVoicePosts, skipVoiceImport } from "./actions";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // read in the browser; only post text is sent to the server

async function postsFromFile(file: File): Promise<string[]> {
  if (/\.zip$/i.test(file.name)) {
    const files = unzipSync(new Uint8Array(await file.arrayBuffer()), {
      filter: (f) => /(^|\/)Shares\.csv$/i.test(f.name),
    });
    const csv = Object.values(files)[0];
    if (!csv) throw new Error("no-shares");
    return postsFromSharesCsv(new TextDecoder().decode(csv));
  }
  return postsFromSharesCsv(await file.text());
}

export function VoiceImport() {
  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const [text, setText] = useState("");
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [serverError, setServerError] = useState("");
  const [pending, startTransition] = useTransition();

  const raw = useMemo(() => (tab === "paste" ? splitPasted(text) : uploaded), [tab, text, uploaded]);
  const sel = useMemo(() => selectPosts(raw), [raw]);
  const count = sel.posts.length;
  const error = serverError || (sel.tooLong ? TOO_LONG_MESSAGE : "");

  async function onFile(file: File | undefined) {
    setUploaded([]);
    setUploadError("");
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) return setUploadError("That file is too large. Upload only Shares.csv from your export.");
    try {
      const posts = await postsFromFile(file);
      if (!posts.length) return setUploadError("We couldn't find posts in that file. Upload Shares.csv, or the zip that contains it.");
      setUploaded(posts);
    } catch {
      setUploadError("We couldn't read that file. Upload Shares.csv, or the zip that contains it.");
    }
  }

  function submit() {
    setServerError("");
    startTransition(async () => {
      const result = await importVoicePosts(sel.posts);
      if (result?.error) setServerError(result.error);
    });
  }

  const tabClass = (on: boolean) =>
    `rounded-control px-4 py-2 font-display font-semibold ${on ? "bg-ink text-white" : "border border-line bg-white"}`;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="How to add your posts" className="flex gap-2">
        <button role="tab" aria-selected={tab === "paste"} className={tabClass(tab === "paste")} onClick={() => setTab("paste")}>
          Paste posts
        </button>
        <button role="tab" aria-selected={tab === "upload"} className={tabClass(tab === "upload")} onClick={() => setTab("upload")}>
          Upload LinkedIn export
        </button>
      </div>

      {tab === "paste" ? (
        <div role="tabpanel" className="flex flex-col gap-2">
          <label htmlFor="posts" className="text-sm font-semibold">
            Paste your past posts. Put a line with only three dashes (<code className="font-mono">---</code>) between posts.
          </label>
          <textarea
            id="posts"
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-control border border-line bg-white px-4 py-3 text-base"
          />
        </div>
      ) : (
        <div role="tabpanel" className="flex flex-col gap-2">
          <label htmlFor="export" className="text-sm font-semibold">
            Upload Shares.csv, or the zip that contains it
          </label>
          <input
            id="export"
            type="file"
            accept=".csv,.zip"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="w-full rounded-control border border-line bg-white px-4 py-3 text-base"
          />
          <p className="text-sm text-slate">
            On LinkedIn: Settings, Data privacy, Get a copy of your data, pick Posts. The file is read in your browser;
            only the post text is saved.
          </p>
          {uploadError && <p role="alert" className="text-sm text-sindoor">{uploadError}</p>}
        </div>
      )}

      <p role="status" className="text-sm text-slate">
        {count} {count === 1 ? "post" : "posts"} found
        {sel.truncated && ` · using the first ${MAX_POSTS}`}
        {count >= MIN_POSTS && count < RECOMMENDED_POSTS && ` · ${RECOMMENDED_POSTS} or more posts give a closer match`}
      </p>
      {count < MIN_POSTS && <p className="text-sm text-sindoor">{MIN_POSTS_MESSAGE}</p>}
      {error && <p role="alert" className="text-sm text-sindoor">{error}</p>}

      <button
        onClick={submit}
        disabled={pending || count < MIN_POSTS || sel.tooLong}
        className="rounded-control bg-marigold px-4 py-3 font-display font-semibold text-ink disabled:opacity-50"
      >
        {pending ? "Learning your voice…" : "Learn my voice"}
      </button>
      <form action={skipVoiceImport}>
        <button className="text-sm underline">I&apos;ll do this later</button>
      </form>
    </div>
  );
}
