import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Server-side Supabase client (service role, bypasses RLS). Null when not configured. */
export function db(env = process.env): SupabaseClient | null {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
