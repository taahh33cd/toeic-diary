/**
 * scripts/roadmap/verify-phase3.ts — kiểm chứng vòng lặp hằng ngày.
 *
 *   npm run roadmap:verify3 -- --attempt <id>
 *
 * Dựng một lộ trình thật, rồi GIẢ LÀM BÀI đúng như client vẫn ghi (chèn thẳng
 * vào subskill_attempts/grammar_attempts) và kiểm xem việc có tự tích xanh
 * không. Sau đó đẩy lịch lùi lại một ngày để thử nhánh dồn ngày bỏ lỡ.
 *
 * Mọi thứ script tạo ra đều bị xoá ở cuối — nó chạy trên DB thật.
 */

import "../env";

import { prisma } from "../../lib/db/prisma";
import { syncTasks } from "../../lib/roadmap/evidence";
import { generatePlan } from "../../lib/roadmap/persist";
import { runRollover } from "../../lib/roadmap/rollover";
import { vnToday } from "../../lib/roadmap/vn-date";
import type { EvidenceSpec } from "../../lib/roadmap/types";

const args = process.argv.slice(2);
const attemptId = args[args.indexOf("--attempt") + 1];
if (!args.includes("--attempt") || !attemptId) {
  console.error("Thiếu --attempt <id>");
  process.exit(1);
}

// Giả lập bài làm nên không gọi AI: lần này kiểm vòng lặp, không kiểm câu chữ.
delete process.env.GEMINI_API_KEY;

let failures = 0;
function check(label: string, ok: boolean, detail?: string) {
  console.log(`   ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

/** Ghi một lượt làm bài y như client vẫn ghi, để đối chiếu bằng chứng ăn vào. */
async function fakeAttempt(userId: string, spec: EvidenceSpec): Promise<string[]> {
  const ids: string[] = [];
  if (spec.source === "subskill") {
    for (let i = 0; i < spec.minExercises; i++) {
      const r = await prisma.subskillAttempt.create({
        data: {
          userId,
          part: spec.part,
          questionWord: spec.questionWord,
          exerciseIndex: spec.exerciseIndex ?? i,
          score: spec.minScore,
          passed: true,
        },
      });
      ids.push(`subskill:${r.id}`);
    }
  } else if (spec.source === "grammar") {
    for (let i = 0; i < spec.minQuestions; i++) {
      const r = await prisma.grammarAttempt.create({
        data: {
          userId,
          questionId: `verify3-${i}`,
          topicSlug: spec.topicSlug,
          isCorrect: true,
          userAnswer: "A",
        },
      });
      ids.push(`grammar:${r.id}`);
    }
  } else if (spec.source === "ipa") {
    for (let i = 0; i < spec.minExercises; i++) {
      const r = await prisma.ipaAttempt.create({
        data: {
          userId,
          section: spec.section,
          difficulty: spec.difficulty,
          exerciseIndex: i,
          score: spec.minScore,
          passed: true,
        },
      });
      ids.push(`ipa:${r.id}`);
    }
  }
  return ids;
}

async function cleanup(fake: string[]) {
  for (const key of fake) {
    const [kind, id] = key.split(":");
    try {
      if (kind === "subskill") await prisma.subskillAttempt.delete({ where: { id } });
      if (kind === "grammar") await prisma.grammarAttempt.delete({ where: { id } });
      if (kind === "ipa") await prisma.ipaAttempt.delete({ where: { id } });
    } catch {
      /* đã xoá rồi thì thôi */
    }
  }
}

async function main() {
  const attempt = await prisma.fullTestAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) {
    console.error(`Không tìm thấy lượt thi ${attemptId}`);
    process.exit(1);
  }
  const userId = attempt.userId;
  const fake: string[] = [];
  let planId: string | null = null;

  const previouslyActive = await prisma.studyPlan.findFirst({
    where: { userId, status: "active" },
    select: { id: true },
  });

  try {
    console.log(`\n━━ Vòng lặp hằng ngày · user ${userId.slice(0, 8)}… ━━`);

    const gen = await generatePlan({
      userId,
      intake: { minutesPerDay: 45, daysPerWeek: 5, startDate: vnToday() },
      targetScore: 750,
      attemptId,
    });
    if (!gen.ok) {
      console.error(`   ✗ không dựng được lộ trình: ${gen.error}`);
      process.exit(1);
    }
    planId = gen.planId;

    const tasks = await prisma.studyTask.findMany({
      where: { planId },
      orderBy: [{ date: "asc" }, { order: "asc" }],
    });
    check("lộ trình có việc", tasks.length > 0, `${tasks.length} việc`);

    // ── 1. Chưa làm gì thì không việc nào được tích ──────────────────────
    const first = await syncTasks(userId);
    check("chưa làm bài thì không tự tích", first.completed.length === 0,
      `${first.completed.length} việc bị tích oan`);

    // ── 2. Giả làm xong một việc → phải tự tích ──────────────────────────
    const target = tasks.find((t) => {
      const s = t.target as unknown as EvidenceSpec;
      return s.source === "subskill" || s.source === "grammar" || s.source === "ipa";
    });
    check("có việc đối chiếu được bằng dữ liệu làm bài", !!target);

    if (target) {
      const spec = target.target as unknown as EvidenceSpec;
      fake.push(...(await fakeAttempt(userId, spec)));

      const second = await syncTasks(userId);
      check(
        "làm xong bài thì việc tự tích xanh",
        second.completed.includes(target.id),
        `${target.title}`,
      );

      const after = await prisma.studyTask.findUnique({ where: { id: target.id } });
      check("trạng thái lưu là done", after?.status === "done", after?.status);
      check("có ghi bằng chứng", !!after?.evidence);
      check(
        "bằng chứng trỏ đúng nguồn",
        (after?.evidence as { source?: string } | null)?.source === spec.source,
      );

      // Chạy lại lần nữa không được tích thêm gì — hàm phải lặp lại được.
      const third = await syncTasks(userId);
      check("chạy lại không tích trùng", !third.completed.includes(target.id));
    }

    // ── 3. Dồn ngày: đẩy việc còn treo về hôm qua rồi chạy rollover ──────
    const pending = await prisma.studyTask.findMany({
      where: { planId, status: "pending" },
      orderBy: { order: "asc" },
      take: 4,
    });
    if (pending.length >= 2) {
      const yesterday = new Date(`${vnToday()}T00:00:00Z`);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      await prisma.studyTask.updateMany({
        where: { id: { in: pending.map((t) => t.id) } },
        data: { date: yesterday, priority: "core" },
      });

      const r = await runRollover(userId);
      check("dồn tối đa 2 việc", r.rolled <= 2, `dồn ${r.rolled}`);
      check("phần còn lại đánh dấu lỡ", r.missed === pending.length - r.rolled,
        `lỡ ${r.missed}/${pending.length - r.rolled}`);

      const rolled = await prisma.studyTask.findMany({
        where: { id: { in: pending.map((t) => t.id) } },
      });
      check(
        "việc dồn sang hôm nay giữ ngày giao gốc",
        rolled.filter((t) => t.status === "pending").every((t) => t.rolledFromDate !== null),
      );
      check(
        "không việc nào của ngày cũ còn treo",
        rolled.every((t) => t.status !== "pending" || t.date.getTime() >= yesterday.getTime() + 86_400_000),
      );

      // Chạy lại rollover không được dồn thêm lần nữa.
      const r2 = await runRollover(userId);
      check("rollover chạy lại không đổi gì", r2.rolled === 0 && r2.missed === 0,
        `${r2.rolled}/${r2.missed}`);
    } else {
      console.log("   (bỏ qua phần dồn ngày — không đủ việc treo để thử)");
    }
  } finally {
    if (planId) await prisma.studyPlan.delete({ where: { id: planId } }).catch(() => {});
    await cleanup(fake);
    if (previouslyActive) {
      await prisma.studyPlan
        .update({ where: { id: previouslyActive.id }, data: { status: "active" } })
        .catch(() => {});
    }
    console.log("\n   (đã xoá lộ trình thử và các lượt làm bài giả)");
  }

  console.log("");
  if (failures) {
    console.error(`✗ ${failures} khẳng định sai.`);
    process.exit(1);
  }
  console.log("✓ Mọi khẳng định đều đúng.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
