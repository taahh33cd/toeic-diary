/**
 * scripts/roadmap/verify-phase2.ts — chạy thử toàn bộ đường sinh lộ trình.
 *
 *   npm run roadmap:verify -- --attempt <id>          (có AI nếu có GEMINI_API_KEY)
 *   npm run roadmap:verify -- --attempt <id> --no-ai  (ép chạy bản rule)
 *   npm run roadmap:verify -- --attempt <id> --keep   (giữ lại lộ trình vừa tạo)
 *
 * Mặc định XOÁ lộ trình vừa tạo sau khi kiểm tra xong: script này chạy trên DB
 * thật, không được để lại rác trong tài khoản của học viên.
 */

import "../env";

import { prisma } from "../../lib/db/prisma";
import { generatePlan } from "../../lib/roadmap/persist";
import { vnToday } from "../../lib/roadmap/vn-date";

const args = process.argv.slice(2);
const attemptId = args[args.indexOf("--attempt") + 1];
const noAi = args.includes("--no-ai");
const keep = args.includes("--keep");

if (!args.includes("--attempt") || !attemptId) {
  console.error("Thiếu --attempt <id>");
  process.exit(1);
}

if (noAi) delete process.env.GEMINI_API_KEY;

let failures = 0;
function check(label: string, ok: boolean, detail?: string) {
  console.log(`   ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function main() {
  const attempt = await prisma.fullTestAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) {
    console.error(`Không tìm thấy lượt thi ${attemptId}`);
    process.exit(1);
  }

  console.log(
    `\n━━ Sinh lộ trình cho user ${attempt.userId.slice(0, 8)}… từ ${attempt.testSlug} ` +
      `(${attempt.total} điểm) · AI: ${noAi ? "TẮT" : process.env.GEMINI_API_KEY ? "bật" : "không có key"} ━━`,
  );

  const before = await prisma.studyPlan.findFirst({
    where: { userId: attempt.userId, status: "active" },
    select: { id: true },
  });

  const t0 = Date.now();
  const result = await generatePlan({
    userId: attempt.userId,
    intake: { minutesPerDay: 45, daysPerWeek: 5, startDate: vnToday() },
    targetScore: 750,
    deadline: null,
    attemptId,
  });
  const ms = Date.now() - t0;

  if (!result.ok) {
    console.error(`   ✗ generatePlan lỗi: ${result.error}`);
    process.exit(1);
  }

  console.log(
    `   Xong trong ${ms}ms · AI dùng được: ${result.aiUsed}` +
      `${result.aiReason ? ` (${result.aiReason})` : ""}\n`,
  );

  check("tạo được plan", !!result.planId);
  check("có mục tiêu tháng", result.months.length > 0, `${result.months.length} tháng`);
  check(
    "mốc điểm tháng tăng dần",
    result.months.every((m, i) => i === 0 || m.targetScore >= result.months[i - 1].targetScore),
  );
  check("tuần 1 có việc", result.week.days.some((d) => d.tasks.length > 0));
  check("tuần có chủ đề và câu mục tiêu", !!result.week.theme && !!result.week.goalText);
  if (noAi) {
    check("không gọi AI khi thiếu key", !result.aiUsed, result.aiReason);
  }

  // Đọc ngược từ DB — thứ học viên thật sự nhìn thấy là dữ liệu ở đây.
  const saved = await prisma.studyPlan.findUnique({
    where: { id: result.planId },
    include: { weeks: { include: { tasks: true } }, events: true },
  });
  check("plan lưu được xuống DB", !!saved);
  check("có đúng 1 tuần", saved?.weeks.length === 1, `${saved?.weeks.length}`);
  check(
    "số việc trong DB khớp bản sinh ra",
    (saved?.weeks[0]?.tasks.length ?? 0) ===
      result.week.days.reduce((s, d) => s + d.tasks.length, 0),
  );
  check("có ghi PlanEvent", (saved?.events.length ?? 0) >= 1);
  check(
    "aiCalledAt chỉ có khi thật sự gọi AI",
    !!saved?.events[0]?.aiCalledAt === result.aiUsed,
  );
  check(
    "mọi việc đều có href",
    (saved?.weeks[0]?.tasks ?? []).every((t) => t.href.startsWith("/")),
  );

  console.log(`\n   Tuần 1 · ${saved?.weeks[0]?.theme}`);
  console.log(`   ${saved?.weeks[0]?.goalText}`);
  for (const m of result.months) {
    console.log(`   ${m.label}: mốc ${m.targetScore} — ${m.summary.slice(0, 90)}…`);
  }

  // ── Dọn dẹp ──────────────────────────────────────────────────────────────
  if (!keep) {
    await prisma.studyPlan.delete({ where: { id: result.planId } });
    if (before) {
      await prisma.studyPlan.update({
        where: { id: before.id },
        data: { status: "active" },
      });
    }
    console.log("\n   (đã xoá lộ trình thử, trả DB về như cũ)");
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
