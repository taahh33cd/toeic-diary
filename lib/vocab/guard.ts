import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Cờ `ok` là literal true/false để TypeScript hẹp được kiểu sau `if (!gate.ok)`.
 * Phân biệt bằng `error` không đủ: `error: string` có thể là chuỗi rỗng nên
 * truthiness check không loại được nhánh từ chối.
 */
export type VocabGate =
  | { ok: false; error: string; status: number }
  | { ok: true; userId: string; studentCode: string | null; role: string };

/**
 * Cổng quyền cho khu bộ thẻ. Giống /api/vocab/access: học viên phải có
 * studentCode (tức đã vào lớp), giáo viên/admin luôn qua.
 *
 * Trả userId để các route dùng làm chủ sở hữu bộ thẻ, nên không route nào
 * được nhận ownerId từ body của client.
 */
export async function requireVocabUser(): Promise<VocabGate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Chưa đăng nhập", status: 401 };

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true, studentCode: true },
  });
  if (!profile) return { ok: false, error: "Không tìm thấy hồ sơ", status: 403 };

  const privileged = profile.role === "teacher" || profile.role === "admin";
  if (!privileged && !profile.studentCode) {
    return { ok: false, error: "Tính năng này dành cho học viên đã vào lớp", status: 403 };
  }

  return {
    ok: true,
    userId: user.id,
    studentCode: profile.studentCode,
    role: profile.role,
  };
}
