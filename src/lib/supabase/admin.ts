import { createClient } from "@supabase/supabase-js";

/**
 * Admin client — bypasses RLS, uses the service role key.
 * Use ONLY in server-side code that has already verified the caller's
 * permissions, never in code that runs on the client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
