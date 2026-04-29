import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client cho phía SERVER (Server Components, API Routes, Server Actions).
 * Tự động đọc/ghi cookies từ request để duy trì session.
 *
 * Dùng: const supabase = await createClient()
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component không thể set cookies.
            // Middleware sẽ handle việc này.
          }
        },
      },
    }
  );
}
