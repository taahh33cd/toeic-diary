import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { canUseRoadmap } from "@/lib/roadmap/access";
import { DAYS_PER_WEEK_OPTIONS, MINUTES_PER_DAY_OPTIONS } from "@/lib/roadmap/config";
import { generatePlan } from "@/lib/roadmap/persist";
import { vnToday } from "@/lib/roadmap/vn-date";

/**
 * POST /api/roadmap/generate — sinh lộ trình từ bài test đầu vào.
 *
 * Nhận thông tin form onboarding, tìm lượt thi làm baseline, chẩn đoán, xếp lịch
 * tuần 1 rồi ghi xuống DB. Gọi lại khi đã có lộ trình dựng trên cùng lượt thi
 * thì trả lại bản cũ chứ không tạo bản thứ hai.
 */

const BodySchema = z.object({
  minutesPerDay: z.number().int().refine((v) => MINUTES_PER_DAY_OPTIONS.includes(v as never)),
  daysPerWeek: z.number().int().refine((v) => DAYS_PER_WEEK_OPTIONS.includes(v as never)),
  targetScore: z.number().int().min(10).max(990).nullable().optional(),
  /** "YYYY-MM-DD" */
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  preferredParts: z.array(z.number().int().min(1).max(7)).max(3).optional(),
  attemptId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
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
  if (!canUseRoadmap(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", detail: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }
  const body = parsed.data;

  // Ngày thi đã qua thì coi như chưa đặt — vẽ lộ trình lùi về quá khứ chỉ làm
  // mọi phép tính tuần ra số âm.
  const today = vnToday();
  const deadline = body.deadline && body.deadline > today ? body.deadline : null;

  const result = await generatePlan({
    userId: user.id,
    intake: {
      minutesPerDay: body.minutesPerDay,
      daysPerWeek: body.daysPerWeek,
      startDate: today,
      preferredParts: body.preferredParts as never,
    },
    targetScore: body.targetScore ?? null,
    deadline,
    attemptId: body.attemptId,
  });

  if (!result.ok) {
    const status = result.error === "no_baseline" ? 409 : 422;
    return NextResponse.json({ error: result.error }, { status });
  }

  // `aiReason` cố ý không trả về cho học viên: họ không cần biết Gemini hỏng vì
  // sao, và lộ trình rule vẫn đầy đủ. Lý do nằm trong PlanEvent để còn dò.
  return NextResponse.json({
    planId: result.planId,
    reused: result.reused,
    aiUsed: result.aiUsed,
    report: result.report,
    week: result.week,
    months: result.months,
  });
}
