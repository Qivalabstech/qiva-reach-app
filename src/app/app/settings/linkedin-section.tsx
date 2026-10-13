import { Avatar } from "@/components/avatar";
import { LINKEDIN_MESSAGES, type LinkedInError } from "@/lib/linkedin-auth";
import { supabaseServer } from "@/lib/supabase/server";
import { ConnectLinkedIn } from "./connect-linkedin";
import { LinkedInControls } from "./linkedin-controls";

export async function LinkedInSection({ notice }: { notice?: string }) {
  // Only the profile columns are readable from here; the token columns are not.
  const supabase = await supabaseServer();
  const { data: li } = await supabase.from("linkedin_profiles").select("name, picture_url, headline, created_at").limit(1).maybeSingle();
  const { data: { user } } = await supabase.auth.getUser();
  // After "Remove LinkedIn access" the sign-in identity stays, so reconnecting is a normal LinkedIn sign-in.
  const hasIdentity = !!user?.identities?.some((i) => i.provider === "linkedin_oidc");
  const message = notice ? LINKEDIN_MESSAGES[`linkedin_${notice}` as LinkedInError] : undefined;

  return (
    <section aria-labelledby="li-heading" className="flex flex-col gap-3">
      <h2 id="li-heading" className="font-display text-2xl font-semibold">LinkedIn</h2>
      {message && <p role="alert" className="text-sm text-sindoor">{message}</p>}
      {li ? (
        <>
          <div className="flex items-center gap-3 rounded-card border border-line bg-white p-4">
            <Avatar url={li.picture_url} name={li.name} />
            <div>
              <p className="font-semibold">{li.name ?? "LinkedIn member"}</p>
              <p className="text-sm text-slate">
                Connected on {new Date(li.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
          <LinkedInControls headline={li.headline ?? ""} />
        </>
      ) : (
        <>
          {hasIdentity && <p className="text-sm text-slate">LinkedIn isn&apos;t connected right now.</p>}
          <ConnectLinkedIn signIn={hasIdentity} />
        </>
      )}
    </section>
  );
}
