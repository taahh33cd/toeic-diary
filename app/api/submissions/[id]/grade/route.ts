// AI chấm một bản nộp của chính học viên.
//
// Học viên bấm gửi bài ở /skills → client gọi route này ngay. Chấm xong là bài
// chuyển sang "graded" và học viên xem được luôn; thầy vào tab "AI đã chấm" để
// soát lại khi rảnh, hoặc học viên bấm "xin thầy chấm lại".

import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { isUsageExempt } from "@/lib/access";
import { todayIct } from "@/lib/vocab/srs";
import {
  estimateBand,
  isAiGradable,
  sanitizeFeedback,
  sanitizeItems,
  scaleFor,
  type SubmissionFeedback,
  type SubmissionItem,
} from "@/lib/submissions";
import { aiConfigured, gradeSubmission } from "@/lib/ai/grade";

type Ctx = { params: Promise<{ id: string }> };

/** Số lượt AI chấm mỗi học viên mỗi ngày (giờ VN). */
const GRADES_PER_DAY = 5;

function startOfTodayIct(): Date {
  return new Date(`${todayIct()}T00:00:00+07:00`);
}

/** Hai bản nộp có cùng nội dung bài làm hay không — để không chấm lại bài y nguyên. */
function sameAnswers(a: SubmissionItem[], b: SubmissionItem[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((it, i) => (it.text ?? "").trim() === (b[i].text ?? "").trim());
}

export async function POST(_req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const submission = await prisma.skillSubmission.findFirst({ where: { id, userId: user.id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isAiGradable(submission.skill, submission.unit)) {
    return NextResponse.json({ error: "Part này do giáo viên chấm" }, { status: 400 });
  }
  if (submission.status !== "submitted") {
    return NextResponse.json({ error: "Bài chưa gửi hoặc đã có nhận xét" }, { status: 409 });
  }
  // Bài học viên xin thầy chấm lại cũng mang trạng thái "submitted" nhưng đã có
  // nhận xét: gọi lại route này sẽ xoá mất chỗ thầy đang chờ chấm.
  if (submission.feedback !== null) {
    return NextResponse.json({ error: "Bài này đang chờ giáo viên chấm lại" }, { status: 409 });
  }
  if (!aiConfigured()) {
    return NextResponse.json({ error: "AI chưa được cấu hình" }, { status: 503 });
  }

  // Cùng điều kiện với lúc gửi bài: chỉ học viên đã đăng ký khoá mới được chấm.
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true, studentCode: true, enrolledCourses: true },
  });
  if (!isUsageExempt(profile)) {
    return NextResponse.json({ error: "Chỉ học viên đã đăng ký khoá học mới được AI chấm" }, { status: 403 });
  }

  const items = sanitizeItems(submission.items);
  const max = scaleFor(submission.skill, submission.unit);

  // Bài y nguyên đã chấm rồi thì trả lại kết quả cũ, không gọi AI, không tính lượt.
  const previous = await prisma.skillSubmission.findMany({
    where: {
      userId: user.id,
      skill: submission.skill,
      unit: submission.unit,
      testKey: submission.testKey,
      status: "graded",
      id: { not: id },
    },
    orderBy: { gradedAt: "desc" },
    take: 10,
  });
  const twin = previous.find(
    (p) => sanitizeFeedback(p.feedback).by === "ai" && sameAnswers(items, sanitizeItems(p.items)),
  );

  let feedback: SubmissionFeedback | null = null;
  if (twin) {
    feedback = sanitizeFeedback(twin.feedback);
  } else {
    const used = await prisma.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS n FROM skill_submissions
        WHERE user_id = ${user.id}
          AND graded_at >= ${startOfTodayIct()}
          AND feedback->>'by' = 'ai'`;
    if ((used[0]?.n ?? 0) >= GRADES_PER_DAY) {
      return NextResponse.json(
        { error: `Hôm nay bạn đã dùng hết ${GRADES_PER_DAY} lượt AI chấm. Bài vẫn nằm chờ giáo viên chấm nhé.` },
        { status: 429 },
      );
    }

    try {
      feedback = await gradeSubmission({
        skill: submission.skill,
        unit: submission.unit,
        testKey: submission.testKey,
        items,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[grade] AI error:", msg.slice(0, 300));
      return NextResponse.json({ error: "AI đang quá tải, bài của bạn vẫn chờ giáo viên chấm" }, { status: 502 });
    }
  }

  if (!feedback) {
    return NextResponse.json({ error: "Không chấm được bài này" }, { status: 502 });
  }

  /**
   * Chỉ bài thi thử trọn bộ mới có điểm 0-200.
   *
   * `estimateBand` lấy trung bình rubric rồi nhân 200, nên một bộ Q6-7 hai câu
   * được 4/4 ra đúng 200/200 — con số đó vô nghĩa với học viên vì bài mới làm
   * 2 trong 8 câu của đề Writing. Bài luyện từng part hiện điểm rubric từng câu
   * là đủ, và sổ tay đã bỏ qua chip điểm khi `band` rỗng.
   */
  const band = submission.unit === "mock" ? estimateBand(feedback, max) : null;
  const updated = await prisma.skillSubmission.update({
    where: { id },
    data: {
      feedback: JSON.parse(JSON.stringify(feedback)) as Prisma.InputJsonValue,
      status: "graded",
      gradedAt: new Date(),
      band,
    },
  });

  return NextResponse.json({ submission: updated, cached: Boolean(twin) });
}
