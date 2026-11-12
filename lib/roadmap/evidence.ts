/**
 * lib/roadmap/evidence.ts — "đã làm xong chưa" suy từ dữ liệu làm bài thật.
 *
 * ★ Lộ trình KHÔNG có trạng thái học tập của riêng nó. `StudyTask.status` chỉ là
 *   bản chụp lại kết quả đối chiếu ở đây. Có hai nguồn chân lý là sớm muộn gì
 *   cũng lệch nhau — bài học từ chỗ BTVN từng tra sai khoá RTDB khiến dashboard
 *   và badge nói hai kiểu.
 *
 * Mỗi `EvidenceSpec` trỏ vào đúng một bảng, với đúng bộ khoá mà client ghi
 * xuống khi học viên làm bài (xem scripts/roadmap/catalog-source.ts).
 *
 * CỬA SỔ THỜI GIAN: chỉ tính bài làm TỪ ngày việc được giao trở đi. Việc đã dồn
 * sang hôm sau thì tính từ ngày giao gốc (`rolledFromDate`), nếu không học viên
 * làm bài tối hôm trước lại mất công.
 */

import { prisma } from "@/lib/db/prisma";

import type { EvidenceSpec } from "./types";

/** Bằng chứng ghi vào `StudyTask.evidence` khi việc được tích xong. */
export type EvidenceProof = {
  source: EvidenceSpec["source"];
  /** id bản ghi làm bài, nếu nguồn có một bản ghi cụ thể. */
  refId?: string;
  /** Điểm/độ chính xác đạt được, để hiện "bạn đã đúng 85%". */
  score?: number;
  /** ISO — lúc học viên làm xong. */
  at: string;
};

type TaskLike = {
  id: string;
  userId: string;
  date: Date;
  rolledFromDate: Date | null;
  target: unknown;
};

/** Mốc bắt đầu tính: ngày giao gốc nếu việc từng bị dồn. */
function windowStart(task: TaskLike): Date {
  const d = task.rolledFromDate ?? task.date;
  // Cột là DATE nên Prisma trả về lúc 00:00 UTC. Ngày VN bắt đầu sớm hơn UTC
  // 7 tiếng, nên lùi lại 7 tiếng mới đúng 00:00 giờ VN của ngày đó.
  return new Date(d.getTime() - 7 * 60 * 60 * 1000);
}

/**
 * Kiểm một việc. Trả bằng chứng nếu đã xong, null nếu chưa.
 *
 * Cố ý nhận `spec` rời thay vì đọc từ task: hàm này còn được script kiểm chứng
 * gọi thẳng với spec dựng tay.
 */
export async function checkEvidence(
  userId: string,
  spec: EvidenceSpec,
  since: Date,
): Promise<EvidenceProof | null> {
  switch (spec.source) {
    case "subskill": {
      const rows = await prisma.subskillAttempt.findMany({
        where: {
          userId,
          part: spec.part,
          questionWord: spec.questionWord,
          ...(spec.exerciseIndex !== undefined
            ? { exerciseIndex: spec.exerciseIndex }
            : {}),
          score: { gte: spec.minScore },
          completedAt: { gte: since },
        },
        select: { id: true, exerciseIndex: true, score: true, completedAt: true },
        orderBy: { completedAt: "desc" },
      });
      // `minExercises` đếm số BÀI CON khác nhau đã đạt, không phải số lượt làm:
      // làm lại bài 1 năm lần không thay cho việc làm bài 2.
      const distinct = new Set(rows.map((r) => r.exerciseIndex));
      if (distinct.size < spec.minExercises) return null;
      const best = rows.reduce((a, b) => (b.score > a.score ? b : a));
      return {
        source: "subskill",
        refId: best.id,
        score: best.score,
        at: best.completedAt.toISOString(),
      };
    }

    case "ipa": {
      const rows = await prisma.ipaAttempt.findMany({
        where: {
          userId,
          section: spec.section,
          difficulty: spec.difficulty,
          score: { gte: spec.minScore },
          completedAt: { gte: since },
        },
        select: { id: true, exerciseIndex: true, score: true, completedAt: true },
        orderBy: { completedAt: "desc" },
      });
      const distinct = new Set(rows.map((r) => r.exerciseIndex));
      if (distinct.size < spec.minExercises) return null;
      const best = rows.reduce((a, b) => (b.score > a.score ? b : a));
      return {
        source: "ipa",
        refId: best.id,
        score: best.score,
        at: best.completedAt.toISOString(),
      };
    }

    case "grammar": {
      // Bảng grammar_attempts ghi TỪNG CÂU, không ghi lượt làm, nên điều kiện
      // phải nói theo câu: làm đủ bấy nhiêu câu của thẻ này, đúng từ bấy nhiêu
      // phần trăm trở lên.
      const rows = await prisma.grammarAttempt.findMany({
        where: { userId, topicSlug: spec.topicSlug, createdAt: { gte: since } },
        select: { isCorrect: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
      if (rows.length < spec.minQuestions) return null;
      const correct = rows.filter((r) => r.isCorrect).length;
      const accuracy = correct / rows.length;
      if (accuracy < spec.minAccuracy) return null;
      return {
        source: "grammar",
        score: Math.round(accuracy * 100),
        at: rows[0].createdAt.toISOString(),
      };
    }

    case "part_practice": {
      const rows = await prisma.partPracticeAttempt.findMany({
        where: {
          userId,
          skill: spec.skill,
          part: spec.part,
          testSlug: spec.testSlug,
          status: "done",
          completedAt: { gte: since },
        },
        select: { id: true, correct: true, gradable: true, completedAt: true },
        orderBy: { completedAt: "desc" },
      });
      for (const r of rows) {
        if (!r.gradable || r.correct === null) continue;
        const acc = r.correct / r.gradable;
        if (acc >= spec.minAccuracy) {
          return {
            source: "part_practice",
            refId: r.id,
            score: Math.round(acc * 100),
            at: (r.completedAt ?? new Date()).toISOString(),
          };
        }
      }
      return null;
    }

    case "full_test": {
      // Mốc kiểm tra chỉ cần LÀM XONG, không đặt ngưỡng điểm: đây là bài để đo,
      // không phải bài để đạt. Đặt ngưỡng thì học viên trượt mốc lại thấy mình
      // "chưa hoàn thành" đúng lúc cần nhìn thẳng vào điểm.
      const r = await prisma.fullTestAttempt.findFirst({
        where: {
          userId,
          examSlug: spec.examSlug,
          testSlug: spec.testSlug,
          status: "done",
          completedAt: { gte: since },
        },
        select: { id: true, total: true, completedAt: true },
        orderBy: { completedAt: "desc" },
      });
      if (!r) return null;
      return {
        source: "full_test",
        refId: r.id,
        score: r.total ?? undefined,
        at: (r.completedAt ?? new Date()).toISOString(),
      };
    }
  }
}

/**
 * Đối chiếu các việc đang mở của một học viên, tích xong việc nào đã đạt.
 *
 * `taskIds` bỏ trống thì quét mọi việc `pending` của lộ trình đang chạy —
 * dùng khi mở trang. Có truyền thì chỉ quét bấy nhiêu — dùng cho lời gọi ngay
 * sau khi nộp bài.
 *
 * Trả về số việc vừa chuyển sang xong.
 */
export async function syncTasks(
  userId: string,
  taskIds?: string[],
): Promise<{ completed: string[]; checked: number }> {
  const tasks = await prisma.studyTask.findMany({
    where: {
      userId,
      status: "pending",
      ...(taskIds?.length ? { id: { in: taskIds } } : {}),
      plan: { status: "active" },
    },
    select: {
      id: true,
      userId: true,
      date: true,
      rolledFromDate: true,
      target: true,
    },
  });

  const completed: string[] = [];

  for (const task of tasks) {
    const spec = task.target as unknown as EvidenceSpec;
    if (!spec?.source) continue;

    let proof: EvidenceProof | null = null;
    try {
      proof = await checkEvidence(userId, spec, windowStart(task));
    } catch {
      // Một việc tra lỗi không được làm hỏng cả lần đồng bộ — học viên thà
      // thấy thiếu một dấu tích còn hơn thấy trang trắng.
      continue;
    }
    if (!proof) continue;

    await prisma.studyTask.update({
      where: { id: task.id },
      data: {
        status: "done",
        completedAt: new Date(proof.at),
        evidence: proof as unknown as object,
      },
    });
    completed.push(task.id);
  }

  return { completed, checked: tasks.length };
}
