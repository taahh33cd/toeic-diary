import { createClient } from "@supabase/supabase-js";

/** Supabase Admin client — dùng Service Role Key, chỉ dùng server-side. */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
