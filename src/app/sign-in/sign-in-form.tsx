"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInForm() {
  const linkError = useSearchParams().get("error") === "link";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState(
    linkError ? "That sign-in link has expired or was already used. Request a new one." : "",
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setError("That email address doesn't look right. Check it and try again.");
      return;
    }
    setError("");
    setState("sending");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setState("idle");
      setError(
        error.status === 429
          ? "Too many sign-in emails were requested. Wait a few minutes and try again."
          : "We couldn't send the link. Check your connection and try again.",
      );
      return;
    }
    setEmail(value);
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-card border border-line bg-white p-6">
        <h2 className="text-xl font-semibold">Check your inbox</h2>
        <p className="mt-2 text-slate">
          We sent a sign-in link to <strong className="text-ink">{email}</strong>. It works for 1 hour.
          You can open it on any device.
        </p>
        <button className="mt-4 text-sm underline" onClick={() => setState("idle")}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-card border border-line bg-white p-6">
      <label htmlFor="email" className="block text-sm font-semibold">
        Email address
      </label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? "email-error" : undefined}
        className="mt-2 w-full rounded-control border border-line bg-white px-4 py-3 text-base"
        placeholder="you@company.com"
      />
      {error && (
        <p id="email-error" role="alert" className="mt-2 text-sm text-sindoor">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-4 w-full rounded-control bg-marigold px-4 py-3 font-display font-semibold text-ink transition-opacity disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
