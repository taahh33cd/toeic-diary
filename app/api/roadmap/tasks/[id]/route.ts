import { NextResponse } from "next/server";
import { z } from "zod";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { checkEvidence } from "@/lib/roadmap/evidence";
import { vnToday } from "@/lib/roadmap/vn-date";
import type { EvidenceSpec } from "@/lib/roadmap/types";

/**
 * PATCH /api/roadmap/tasks/[id] — học viên tự đánh dấu một việc.
 *
 * Hai hành động:
 *   skip  — "tôi làm ở ngoài rồi" / "bỏ việc này". KHÔNG tính là `done`, không
 *           cộng XP (Phase 5) và không tính vào thống kê tiến bộ: nếu tích tay
 *           cũng thành "xong" thì mọi con số của lộ trình thành vô nghĩa.
 *   undo  — bỏ đánh dấu, trả về `pending`.
 *
 * Không có hành động "đánh dấu đã xong": cái đó chỉ đến từ dữ liệu làm bài thật
 * (lib/roadmap/evidence.ts). Nếu học viên tin là mình đã làm mà hệ thống chưa
 * ghi nhận, route tự đối chiếu lại một lần trước khi cho `skip`.
 */

const BodySchema = z.object({
  action: z.enum(["skip", "undo"]),
  reason: z.string().max(200).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Lọc theo userId ngay trong truy vấn: việc của người khác phải là 404, không
  // phải 403 — không tiết lộ là id đó có tồn tại.
  const task = await prisma.studyTask.findFirst({
    where: { id, userId: user.id },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.action === "undo") {
    const updated = await prisma.studyTask.update({
      where: { id: task.id },
      // Prisma phân biệt "đặt JSON null" với "không đổi trường này", nên
      // phải dùng Prisma.JsonNull chứ không phải null trần.
      data: { status: "pending", completedAt: null, evidence: Prisma.JsonNull },
    });
    return NextResponse.json({ task: { id: updated.id, status: updated.status } });
  }

  // Trước khi chấp nhận "bỏ qua", thử đối chiếu lại một lần: có thể học viên đã
  // làm thật mà lần đồng bộ trước trượt.
  const spec = task.target as unknown as EvidenceSpec;
  const since = new Date(
    (task.rolledFromDate ?? task.date).getTime() - 7 * 60 * 60 * 1000,
  );
  const proof = spec?.source ? await checkEvidence(user.id, spec, since).catch(() => null) : null;

  const updated = await prisma.studyTask.update({
    where: { id: task.id },
    data: proof
      ? { status: "done", completedAt: new Date(proof.at), evidence: proof as unknown as object }
      : {
          status: "skipped",
          completedAt: new Date(`${vnToday()}T00:00:00Z`),
          evidence: { source: "manual", reason: parsed.data.reason ?? null } as unknown as object,
        },
  });

  return NextResponse.json({
    task: { id: updated.id, status: updated.status },
    /** true = hoá ra học viên đã làm thật, hệ thống tự tích xong thay vì bỏ qua. */
    foundEvidence: !!proof,
  });
}
