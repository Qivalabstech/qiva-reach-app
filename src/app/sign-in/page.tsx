import { Suspense } from "react";
import { Wordmark } from "@/components/wordmark";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <Wordmark />
      <h1 className="text-3xl font-bold">Sign in to Qiva Reach</h1>
      <div className="border-t-2 border-dashed border-marigold" aria-hidden />
      <Suspense>
        <SignInForm />
      </Suspense>
      <p className="text-sm text-slate">
        No password needed. You approve every word; nothing is automated on your LinkedIn account.
      </p>
    </main>
  );
}
