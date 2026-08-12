import { createClient } from "@/lib/supabase/server";

/**
 * Chỉ giáo viên/admin mới chấm bài được. Role lấy từ app_metadata của Supabase
 * Auth (giống các route admin khác) nên client không tự nâng quyền được.
 */
export async function requireGrader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, status: 401, user: null };

  const role = (user.app_metadata?.role as string) ?? "student";
  if (role !== "admin" && role !== "teacher") {
    return { error: "Forbidden" as const, status: 403, user: null };
  }
  return { error: null, status: 200, user };
}
