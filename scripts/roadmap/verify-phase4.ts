/**
 * scripts/roadmap/verify-phase4.ts — kiểm chứng tái lập kế hoạch.
 *
 *   npm run roadmap:verify4 -- --attempt <id>
 *
 * Hai phần:
 *   1. Bảng điều chỉnh tải (thuần code, không DB): từng kịch bản tuần → quyết
 *      định đúng chưa.
 *   2. Chạy thật trên DB: dựng lộ trình, giả làm xong 100% tuần 1 với điểm cao,
 *      đẩy tuần về quá khứ rồi sinh tuần 2 — kiểm xem có lên bậc không. Sau đó
 *      làm lại với kịch bản đuối để kiểm nhánh giảm tải.
 *
 * Mọi thứ script tạo ra đều bị xoá ở cuối.
 */

import "../env";

import { prisma } from "../../lib/db/prisma";
import { generatePlan } from "../../lib/roadmap/persist";
import { replanWeek } from "../../lib/roadmap/replan";
import { buildReview, decideAdjustment } from "../../lib/roadmap/review";
import { vnToday } from "../../lib/roadmap/vn-date";

const args = process.argv.slice(2);
const attemptId = args[args.indexOf("--attempt") + 1];
if (!args.includes("--attempt") || !attemptId) {
  console.error("Thiếu --attempt <id>");
  process.exit(1);
}

// Kiểm quyết định, không kiểm câu chữ → khỏi đốt quota AI.
delete process.env.GEMINI_API_KEY;

let failures = 0;
function check(label: string, ok: boolean, detail?: string) {
  console.log(`   ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

/** Dựng danh sách việc giả cho một tuần, theo tỉ lệ hoàn thành và điểm. */
function fakeWeek(coreCount: number, doneCount: number, score: number) {
  return Array.from({ length: coreCount }, (_, i) => ({
    status: i < doneCount ? "done" : "missed",
    estMinutes: 15,
    priority: "core",
    evidence: i < doneCount ? { score } : null,
  }));
}

function part1_adjustmentTable() {
  console.log("\n━━ Bảng điều chỉnh tải ━━");

  const cases = [
    { name: "làm gần hết, đúng nhiều", tasks: fakeWeek(10, 9, 88), expect: "level_up" },
    { name: "làm hết nhưng sai nhiều", tasks: fakeWeek(10, 9, 55), expect: "reinforce" },
    { name: "làm được quá nửa", tasks: fakeWeek(10, 7, 75), expect: "keep" },
    { name: "làm dưới một nửa", tasks: fakeWeek(10, 3, 80), expect: "lighten" },
  ] as const;

  for (const c of cases) {
    const review = buildReview(c.tasks);
    const adj = decideAdjustment(review);
    check(`${c.name} → ${c.expect}`, adj.kind === c.expect, `nhận ${adj.kind}`);
  }

  // Việc bonus không được kéo tụt tỉ lệ hoàn thành.
  const withBonus = [
    ...fakeWeek(4, 4, 90),
    { status: "missed", estMinutes: 15, priority: "bonus", evidence: null },
  ];
  const r = buildReview(withBonus);
  check(
    "việc không bắt buộc không tính vào tỉ lệ hoàn thành",
    r.completionRate === 1,
    `${Math.round(r.completionRate * 100)}%`,
  );

  // Không có điểm nào (chưa làm gì) thì không được coi là "sai nhiều".
  const noScores = buildReview(fakeWeek(5, 0, 0));
  check("tuần trắng không có accuracy", noScores.accuracy === null);
  check("tuần trắng → giảm tải", decideAdjustment(noScores).kind === "lighten");
}

async function part2_realReplan() {
  const attempt = await prisma.fullTestAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) {
    console.error(`Không tìm thấy lượt thi ${attemptId}`);
    process.exit(1);
  }
  const userId = attempt.userId;

  const previouslyActive = await prisma.studyPlan.findFirst({
    where: { userId, status: "active" },
    select: { id: true },
  });

  for (const scenario of ["tốt", "đuối"] as const) {
    console.log(`\n━━ Sinh tuần 2 sau một tuần ${scenario} ━━`);
    let planId: string | null = null;

    try {
      const gen = await generatePlan({
        userId,
        intake: { minutesPerDay: 45, daysPerWeek: 5, startDate: vnToday() },
        targetScore: 750,
        attemptId,
      });
      if (!gen.ok) {
        console.error(`   ✗ không dựng được lộ trình: ${gen.error}`);
        failures++;
        continue;
      }
      planId = gen.planId;

      const week1 = await prisma.studyWeek.findFirst({
        where: { planId },
        include: { tasks: true },
      });
      if (!week1) {
        console.error("   ✗ không có tuần 1");
        failures++;
        continue;
      }

      // Giả kết quả tuần 1 rồi đẩy tuần về quá khứ để nó "đã hết".
      const core = week1.tasks.filter((t) => t.priority === "core");
      const doneCount = scenario === "tốt" ? core.length : Math.floor(core.length * 0.2);
      const score = scenario === "tốt" ? 90 : 70;

      await prisma.studyTask.updateMany({
        where: { id: { in: core.slice(0, doneCount).map((t) => t.id) } },
        data: { status: "done", evidence: { source: "subskill", score, at: new Date().toISOString() } },
      });
      await prisma.studyTask.updateMany({
        where: { id: { in: core.slice(doneCount).map((t) => t.id) } },
        data: { status: "missed" },
      });

      const past = new Date(`${vnToday()}T00:00:00Z`);
      past.setUTCDate(past.getUTCDate() - 8);
      const pastEnd = new Date(past);
      pastEnd.setUTCDate(pastEnd.getUTCDate() + 6);
      await prisma.studyWeek.update({
        where: { id: week1.id },
        data: { startDate: past, endDate: pastEnd },
      });

      const res = await replanWeek(userId, "replan_weekly");
      check("sinh được tuần mới", res.ok, res.ok ? "" : res.error);
      if (!res.ok) continue;

      check(
        scenario === "tốt" ? "tuần tốt → lên bậc" : "tuần đuối → giảm tải",
        res.adjustment.kind === (scenario === "tốt" ? "level_up" : "lighten"),
        res.adjustment.kind,
      );
      check("tuần mới là tuần 2", res.weekIndex === 2, `${res.weekIndex}`);
      check("tuần mới có việc", res.tasks > 0, `${res.tasks} việc`);

      const saved = await prisma.studyWeek.findMany({
        where: { planId },
        orderBy: { weekIndex: "asc" },
        include: { tasks: true },
      });
      check("tuần 1 được khoá lại", saved[0]?.status === "done", saved[0]?.status);
      check("tuần 1 có bản tổng kết", !!saved[0]?.review);
      check("có đúng 2 tuần", saved.length === 2, `${saved.length}`);

      const w2 = saved[1];
      const ids1 = new Set(saved[0].tasks.map((t) => t.catalogId));
      check(
        "tuần 2 không giao lại bài của tuần 1",
        w2.tasks.every((t) => !ids1.has(t.catalogId)),
      );
      check("lý do điều chỉnh có trong câu mục tiêu", w2.goalText.includes(res.adjustment.reason));

      if (scenario === "đuối") {
        // So PHÚT MỖI BUỔI, không so tổng phút tuần: tuần 1 là tuần cụt (học
        // viên bắt đầu giữa tuần nên chỉ có 2 buổi), tuần 2 đủ 5 buổi — tổng
        // phút tuần 2 vẫn lớn hơn dù mỗi buổi đã nhẹ đi đúng 1/3.
        const perDay = (w: { targetMinutes: number; tasks: { date: Date }[] }) => {
          const days = new Set(w.tasks.map((t) => t.date.toISOString().slice(0, 10)));
          return days.size ? w.targetMinutes / days.size : 0;
        };
        const before = perDay(saved[0]);
        const after = perDay(w2);
        check(
          "tuần đuối nhẹ hơn tính theo mỗi buổi",
          after < before,
          `${after.toFixed(0)} vs ${before.toFixed(0)} phút/buổi`,
        );
        const parts = new Set(w2.tasks.flatMap((t) => t.title.match(/Part \d/g) ?? []));
        check("tuần đuối thu hẹp phạm vi", parts.size <= 3, `${[...parts].join(", ")}`);
      }

      // Tuần 2 đang bắt đầu trong quá khứ (vì tuần 1 bị đẩy lùi 8 ngày để giả
      // lập "tuần đã hết"). Đẩy nó sang tuần sau để thử đúng tình huống thật:
      // học viên bấm "Tính lại" khi đã có sẵn một tuần tương lai.
      const nextMon = new Date(`${vnToday()}T00:00:00Z`);
      nextMon.setUTCDate(nextMon.getUTCDate() + 7);
      const nextSun = new Date(nextMon);
      nextSun.setUTCDate(nextSun.getUTCDate() + 6);
      await prisma.studyWeek.update({
        where: { id: w2.id },
        data: { startDate: nextMon, endDate: nextSun },
      });
      await prisma.studyTask.updateMany({
        where: { weekId: w2.id },
        data: { date: nextMon },
      });

      const again = await replanWeek(userId, "replan_weekly");
      const count = await prisma.studyWeek.count({ where: { planId } });
      check("xếp lại tuần tương lai không chồng thêm tuần", count === 2, `${count} tuần`);
      check(
        "vẫn giữ số tuần 2",
        again.ok && again.weekIndex === 2,
        again.ok ? `${again.weekIndex}` : again.error,
      );
    } finally {
      if (planId) await prisma.studyPlan.delete({ where: { id: planId } }).catch(() => {});
    }
  }

  if (previouslyActive) {
    await prisma.studyPlan
      .update({ where: { id: previouslyActive.id }, data: { status: "active" } })
      .catch(() => {});
  }
  console.log("\n   (đã xoá lộ trình thử, trả DB về như cũ)");
}

async function main() {
  part1_adjustmentTable();
  await part2_realReplan();

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
