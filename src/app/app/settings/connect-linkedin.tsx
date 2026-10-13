"use client";

import { useState } from "react";
import { LINKEDIN_MESSAGES, NEXT_COOKIE } from "@/lib/linkedin-auth";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function ConnectLinkedIn({ signIn }: { signIn: boolean }) {
  const [error, setError] = useState("");

  async function connect() {
    setError("");
    // Remember to come back to Settings after LinkedIn.
    document.cookie = `${NEXT_COOKIE}=/app/settings; path=/; max-age=600; samesite=lax`;
    const options = { redirectTo: `${location.origin}/auth/callback` };
    // The LinkedIn sign-in identity may already exist (after "Remove"); then reconnecting is a normal sign-in.
    const { error } = signIn
      ? await supabaseBrowser().auth.signInWithOAuth({ provider: "linkedin_oidc", options })
      : await supabaseBrowser().auth.linkIdentity({ provider: "linkedin_oidc", options });
    if (error) setError(LINKEDIN_MESSAGES.linkedin_failed);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={connect}
        className="self-start rounded-control border border-ink bg-white px-4 py-3 font-display font-semibold text-ink"
      >
        {signIn ? "Reconnect LinkedIn" : "Connect LinkedIn"}
      </button>
      <p className="text-sm text-slate">We read your name, photo and email. We never post for you.</p>
      {error && <p role="alert" className="text-sm text-sindoor">{error}</p>}
    </div>
  );
}
