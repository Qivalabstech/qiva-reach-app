"use client";

import { useState } from "react";

// LinkedIn photo links can expire, so fall back to the person's initials.
export function Avatar({ url, name, size = 48 }: { url?: string | null; name?: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  const initials = (name ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
  const style = { width: size, height: size };
  if (url && !broken)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} style={style} className="rounded-full object-cover" />
    );
  return (
    <span style={style} aria-hidden className="grid place-items-center rounded-full bg-ink font-display font-semibold text-white">
      {initials}
    </span>
  );
}
