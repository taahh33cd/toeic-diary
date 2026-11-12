// AI chấm một bản nộp của chính học viên.
//
// Học viên bấm gửi bài ở /skills → client gọi route này ngay. Chấm xong là bài
// chuyển sang "graded" và học viên xem được luôn; thầy vào tab "AI đã chấm" để
// soát lại khi rảnh, hoặc học viên bấm "xin thầy chấm lại".

import { NextResponse, after } from "next/server";
import type { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { isUsageExempt } from "@/lib/access";
import { sendPushToUser } from "@/lib/push";
import { todayIct } from "@/lib/vocab/srs";
import {
  estimateBand,
  isAiGradable,
  isBackgroundGraded,
  sanitizeFeedback,
  sanitizeItems,
  scaleFor,
  type SubmissionFeedback,
  type SubmissionItem,
} from "@/lib/submissions";
import { aiConfigured, gradeSubmission } from "@/lib/ai/grade";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Speaking phải nghe lại từng file ghi âm (tải audio → nhận dạng → chấm nội
 * dung) nên một bộ ba câu có thể mất hơn một phút. Chạy trong `after()` nên
 * giới hạn này phải đủ rộng.
 */
export const maxDuration = 300;

/** Số lượt AI chấm mỗi học viên mỗi ngày (giờ VN). */
const GRADES_PER_DAY = 5;

function startOfTodayIct(): Date {
  return new Date(`${todayIct()}T00:00:00+07:00`);
}

/** Hai bản nộp có cùng nội dung bài làm hay không — để không chấm lại bài y nguyên. */
function sameAnswers(a: SubmissionItem[], b: SubmissionItem[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (it, i) =>
      (it.text ?? "").trim() === (b[i].text ?? "").trim() && (it.audioUrl ?? "") === (b[i].audioUrl ?? ""),
  );
}

/**
 * Chấm rồi ghi kết quả. Ghi có điều kiện `status = 'submitted'` để hai lần gọi
 * song song không đè nhau, và để bài vừa được giáo viên chấm xong không bị bản
 * AI ghi lên.
 */
async function gradeAndSave(
  id: string,
  submission: { skill: string; unit: string; testKey: string },
  items: SubmissionItem[],
): Promise<SubmissionFeedback | null> {
  const feedback = await gradeSubmission({
    skill: submission.skill,
    unit: submission.unit,
    testKey: submission.testKey,
    items,
  });
  if (!feedback) return null;

  const { count } = await prisma.skillSubmission.updateMany({
    where: { id, status: "submitted" },
    data: {
      feedback: JSON.parse(JSON.stringify(feedback)) as Prisma.InputJsonValue,
      status: "graded",
      gradedAt: new Date(),
      // Mốc đếm hạn mức: chỉ đặt ở đây, nơi AI thật sự vừa chấm xong. Bản chép
      // từ bộ đệm không đặt, và "xin thầy chấm lại" không xoá.
      aiGradedAt: new Date(),
      // Chỉ bài thi thử trọn bộ mới có điểm 0-200 (xem ghi chú dưới).
      band: submission.unit === "mock" ? estimateBand(feedback, scaleFor(submission.skill, submission.unit)) : null,
    },
  });
  return count > 0 ? feedback : null;
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

  // Bài y nguyên đã chấm rồi: chép lại kết quả cũ, không gọi AI, không tính lượt.
  if (twin) {
    const feedback = sanitizeFeedback(twin.feedback);
    const updated = await prisma.skillSubmission.update({
      where: { id },
      data: {
        feedback: JSON.parse(JSON.stringify(feedback)) as Prisma.InputJsonValue,
        status: "graded",
        gradedAt: new Date(),
        band: submission.unit === "mock" ? estimateBand(feedback, max) : null,
      },
    });
    return NextResponse.json({ submission: updated, cached: true });
  }

  // Đếm theo `ai_graded_at`, không theo `graded_at`: xem ghi chú ở cột đó
  // trong schema — đếm kiểu cũ vừa tính cả bản chép từ bộ đệm, vừa bị xoá
  // trắng mỗi lần học viên xin thầy chấm lại.
  const used = await prisma.skillSubmission.count({
    where: { userId: user.id, aiGradedAt: { gte: startOfTodayIct() } },
  });
  if (used >= GRADES_PER_DAY) {
    return NextResponse.json(
      { error: `Hôm nay bạn đã dùng hết ${GRADES_PER_DAY} lượt AI chấm. Bài vẫn nằm chờ giáo viên chấm nhé.` },
      { status: 429 },
    );
  }

  /**
   * Speaking chấm nền: nghe lại 2-3 file ghi âm mất cả phút, học viên không
   * đứng đợi được. Trả lời ngay rồi chấm trong `after()`, xong thì gửi thông
   * báo. Chấm hỏng thì bài vẫn ở trạng thái đã gửi, nằm trong danh sách của
   * giáo viên — thà không chấm hơn là chấm oan.
   */
  if (isBackgroundGraded(submission.skill)) {
    const title = submission.title;
    after(async () => {
      try {
        const feedback = await gradeAndSave(id, submission, items);
        if (!feedback) {
          console.error(`[grade] bỏ qua ${id}: engine không chấm được hoặc bài đã đổi trạng thái`);
          return;
        }
        await sendPushToUser(user.id, {
          title: "AI đã chấm bài nói của bạn",
          body: `${title} — xem nhận xét trong sổ tay`,
          url: `/journal/submissions/${id}`,
        }).catch(() => {});
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[grade] lỗi khi chấm nền ${id}:`, msg.slice(0, 300));
      }
    });
    return NextResponse.json({ queued: true });
  }

  let feedback: SubmissionFeedback | null;
  try {
    feedback = await gradeAndSave(id, submission, items);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[grade] AI error:", msg.slice(0, 300));
    return NextResponse.json({ error: "AI đang quá tải, bài của bạn vẫn chờ giáo viên chấm" }, { status: 502 });
  }
  if (!feedback) {
    return NextResponse.json({ error: "Không chấm được bài này" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
