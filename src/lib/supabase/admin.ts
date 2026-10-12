import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client. Server only: bypasses row-level security, so use it for logging and counting, never for user data reads.
export const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
