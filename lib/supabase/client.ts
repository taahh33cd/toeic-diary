import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client cho phía BROWSER (Client Components).
 * Gọi trong useEffect, event handlers, client-side logic.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
