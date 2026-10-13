"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateHeadline } from "@/lib/linkedin-auth";
import { removeLinkedInConnection, saveHeadline } from "@/lib/linkedin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

async function userId() {
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  if (!user) redirect("/sign-in");
  return user.id;
}

export async function saveLinkedInHeadline(input: string): Promise<{ error?: string; saved?: boolean }> {
  const v = validateHeadline(input);
  if (!v.ok) return { error: v.error };
  const ok = await saveHeadline({ admin: supabaseAdmin(), userId: await userId(), headline: v.value });
  if (!ok) return { error: "We couldn't save that. Check your connection and try again." };
  revalidatePath("/app/settings");
  return { saved: true };
}

export async function removeLinkedIn(): Promise<{ error?: string }> {
  const ok = await removeLinkedInConnection({ admin: supabaseAdmin(), userId: await userId() });
  if (!ok) return { error: "We couldn't remove it. Check your connection and try again." };
  revalidatePath("/app/settings");
  return {};
}
