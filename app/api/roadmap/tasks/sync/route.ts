import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { canUseRoadmap } from "@/lib/roadmap/access";
import { syncTasks } from "@/lib/roadmap/evidence";

/**
 * POST /api/roadmap/tasks/sync — đối chiếu lại bằng chứng cho việc đang mở.
 *
 * Gọi ngay sau khi học viên nộp một bài bất kỳ, kiểu "bắn rồi quên": học viên
 * quay về trang lộ trình là thấy dấu tích, không phải tải lại trang.
 *
 * Không nhận danh sách việc từ client: client không biết (và không nên biết)
 * việc nào đang mở. Quét hết việc `pending` của lộ trình đang chạy — mỗi ngày
 * nhiều nhất bốn việc nên vài truy vấn là xong.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile
    .findUnique({
      where: { id: user.id },
      select: { createdAt: true, roadmapEnabled: true },
    })
    .catch(() => null);
  // Không có quyền thì im lặng trả về 0 — đây là lời gọi nền sau khi nộp bài,
  // không có gì để báo lỗi cho học viên cả.
  if (!canUseRoadmap(profile)) {
    return NextResponse.json({ completed: 0 });
  }

  const { completed } = await syncTasks(user.id);
  return NextResponse.json({ completed: completed.length, taskIds: completed });
}
