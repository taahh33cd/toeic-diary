/**
 * scripts/roadmap/verify-phase5.ts — kiểm chứng phần nối với hệ thống.
 *
 *   npm run roadmap:verify5 -- --attempt <id>
 *
 * Kiểm đúng hai thứ dễ sai nhất:
 *   1. XP chỉ cộng cho việc TỰ TÍCH, không cộng cho việc học viên tự bỏ qua.
 *   2. Thưởng "xong cả ngày" chỉ cộng một lần, và chỉ khi xong hết việc chính.
 *
 * Phần push và trang GV không kiểm ở đây: push cần thiết bị thật đăng ký, còn
 * trang GV là giao diện — xem bằng mắt.
 *
 * Mọi thứ script tạo ra đều bị xoá ở cuối.
 */

import "../env";

import { prisma } from "../../lib/db/prisma";
import { syncTasks } from "../../lib/roadmap/evidence";
import { generatePlan } from "../../lib/roadmap/persist";
import { vnDateKey, vnToday } from "../../lib/roadmap/vn-date";
import type { EvidenceSpec } from "../../lib/roadmap/types";

const args = process.argv.slice(2);
const attemptId = args[args.indexOf("--attempt") + 1];
if (!args.includes("--attempt") || !attemptId) {
  console.error("Thiếu --attempt <id>");
  process.exit(1);
}
delete process.env.GEMINI_API_KEY;

let failures = 0;
function check(label: string, ok: boolean, detail?: string) {
  console.log(`   ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

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
          questionId: `verify5-${i}-${Math.random().toString(36).slice(2, 8)}`,
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

async function main() {
  const attempt = await prisma.fullTestAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) {
    console.error(`Không tìm thấy lượt thi ${attemptId}`);
    process.exit(1);
  }
  const userId = attempt.userId;
  const fake: string[] = [];
  let planId: string | null = null;
  const startedAt = new Date();

  const previouslyActive = await prisma.studyPlan.findFirst({
    where: { userId, status: "active" },
    select: { id: true },
  });

  try {
    console.log(`\n━━ XP của lộ trình · user ${userId.slice(0, 8)}… ━━`);

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

    const today = vnToday();
    const todayTasks = await prisma.studyTask.findMany({
      where: { planId, date: new Date(`${today}T00:00:00Z`), priority: "core" },
      orderBy: { order: "asc" },
    });
    check("hôm nay có việc để thử", todayTasks.length >= 2, `${todayTasks.length} việc`);
    if (todayTasks.length < 2) return;

    const xpOf = (source: string) =>
      prisma.xpEvent.count({
        where: { userId, source, createdAt: { gte: startedAt } },
      });

    // ── 1. Tự bỏ qua một việc → KHÔNG được cộng XP ────────────────────────
    await prisma.studyTask.update({
      where: { id: todayTasks[0].id },
      data: {
        status: "skipped",
        completedAt: new Date(),
        evidence: { source: "manual", reason: null },
      },
    });
    await syncTasks(userId);
    check("tự bỏ qua không được cộng XP", (await xpOf("roadmap_task")) === 0);

    // ── 2. Làm thật một việc → cộng đúng 1 lần ────────────────────────────
    const target = todayTasks[1];
    fake.push(...(await fakeAttempt(userId, target.target as unknown as EvidenceSpec)));
    await syncTasks(userId);

    const after = await prisma.studyTask.findUnique({ where: { id: target.id } });
    check("việc tự tích xong", after?.status === "done", after?.status);
    check("được cộng XP cho việc", (await xpOf("roadmap_task")) === 1);

    await syncTasks(userId);
    check("đồng bộ lại không cộng XP lần hai", (await xpOf("roadmap_task")) === 1);

    // ── 3. Chưa xong hết việc chính thì chưa có thưởng ngày ───────────────
    const restCount = await prisma.studyTask.count({
      where: { planId, date: new Date(`${today}T00:00:00Z`), priority: "core", status: "pending" },
    });
    if (restCount > 0) {
      check("chưa xong hết ngày thì chưa có thưởng", (await xpOf("roadmap_day")) === 0,
        `còn ${restCount} việc`);
    }

    // ── 4. Làm nốt phần còn lại, NHƯNG vẫn còn một việc bị bỏ qua ─────────
    const rest = await prisma.studyTask.findMany({
      where: { planId, date: new Date(`${today}T00:00:00Z`), priority: "core", status: "pending" },
    });
    for (const t of rest) {
      fake.push(...(await fakeAttempt(userId, t.target as unknown as EvidenceSpec)));
    }
    await syncTasks(userId);

    const stillPending = await prisma.studyTask.count({
      where: { planId, date: new Date(`${today}T00:00:00Z`), priority: "core", status: "pending" },
    });
    check("không còn việc nào chờ", stillPending === 0, `còn ${stillPending}`);
    // Đây là chỗ dễ hiểu nhầm nhất của cả phase: "hết việc chờ" KHÁC "xong cả
    // ngày". Việc học viên tự bỏ qua không phải việc đã làm, nên ngày có việc
    // bỏ qua thì không có thưởng — nếu không XP lại đo công sức bấm nút.
    check("ngày còn việc tự bỏ qua thì chưa có thưởng", (await xpOf("roadmap_day")) === 0);

    // ── 5. Làm nốt luôn việc đã bỏ qua → lúc này mới có thưởng ngày ───────
    await prisma.studyTask.update({
      where: { id: todayTasks[0].id },
      data: { status: "pending", completedAt: null },
    });
    fake.push(...(await fakeAttempt(userId, todayTasks[0].target as unknown as EvidenceSpec)));
    await syncTasks(userId);

    check("có thưởng xong cả ngày", (await xpOf("roadmap_day")) === 1);

    await syncTasks(userId);
    check("thưởng ngày không cộng lần hai", (await xpOf("roadmap_day")) === 1);

    const dayEvent = await prisma.xpEvent.findFirst({
      where: { userId, source: "roadmap_day", createdAt: { gte: startedAt } },
      select: { metadata: true },
    });
    check(
      "thưởng ngày ghi đúng ngày",
      (dayEvent?.metadata as { date?: string } | null)?.date === today,
      `${(dayEvent?.metadata as { date?: string } | null)?.date}`,
    );

    // ── 6. Dữ liệu cho biểu đồ ────────────────────────────────────────────
    const done = await prisma.fullTestAttempt.findMany({
      where: { userId, status: "done", total: { not: null } },
      orderBy: { completedAt: "asc" },
      select: { total: true, completedAt: true },
    });
    check(
      "mọi lượt thi dùng vẽ biểu đồ đều có ngày hoàn thành",
      done.every((d) => d.completedAt !== null),
    );
    if (done.length) {
      const keys = done.map((d) => vnDateKey(d.completedAt!));
      check("ngày thi đọc được theo giờ VN", keys.every((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)));
    }
  } finally {
    if (planId) await prisma.studyPlan.delete({ where: { id: planId } }).catch(() => {});
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
    // XP đã cộng cũng phải trả lại — đây là tài khoản thật.
    const events = await prisma.xpEvent.findMany({
      where: {
        userId,
        source: { in: ["roadmap_task", "roadmap_day"] },
        createdAt: { gte: startedAt },
      },
      select: { id: true, xp: true },
    });
    if (events.length) {
      const total = events.reduce((s, e) => s + e.xp, 0);
      await prisma.xpEvent.deleteMany({ where: { id: { in: events.map((e) => e.id) } } });
      await prisma.profile.update({
        where: { id: userId },
        data: { totalXp: { decrement: total } },
      });
      console.log(`\n   (đã hoàn lại ${total} XP của ${events.length} sự kiện thử)`);
    }
    if (previouslyActive) {
      await prisma.studyPlan
        .update({ where: { id: previouslyActive.id }, data: { status: "active" } })
        .catch(() => {});
    }
    console.log("   (đã xoá lộ trình thử và các lượt làm bài giả)");
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
