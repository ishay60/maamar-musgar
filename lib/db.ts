import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Server-side Supabase client (service role, bypasses RLS). Null when not configured. */
export function db(env = process.env): SupabaseClient | null {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
    // Next.js caches fetch() responses by default; puzzle reads must always be live.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
