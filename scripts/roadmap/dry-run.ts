/**
 * scripts/roadmap/dry-run.ts — kiểm chứng engine chẩn đoán + planner.
 *
 *   npm run roadmap:dry-run                      → chạy 3 hồ sơ mẫu + kiểm tra
 *   npm run roadmap:dry-run -- --attempt <id>    → chạy trên một lượt thi thật
 *   npm run roadmap:dry-run -- --quiet           → chỉ in kết quả kiểm tra
 *
 * Đây là thứ thay cho unit test ở Phase 1: dự án chưa cài test runner, mà cái
 * cần biết lúc này là "lịch sinh ra có hợp lý không" — thứ phải đọc bằng mắt
 * mới thấy. Script vừa in lịch ra cho người đọc, vừa chạy một loạt khẳng định
 * máy kiểm tra được, và thoát mã 1 nếu có khẳng định nào sai.
 */

import "../env";

import { MAX_BONUS_TASKS_PER_DAY, MAX_CORE_TASKS_PER_DAY } from "../../lib/roadmap/config";
import { diagnose, explainPriority } from "../../lib/roadmap/diagnose";
import { planWeek } from "../../lib/roadmap/planner";
import { getCatalogItem } from "../../lib/roadmap/catalog";
import { addDays, formatDayLabel, mondayOf } from "../../lib/roadmap/vn-date";
import type { DraftWeek, Intake, PartScoreInput } from "../../lib/roadmap/types";

const args = process.argv.slice(2);
const quiet = args.includes("--quiet");
const attemptId = args[args.indexOf("--attempt") + 1];
const wantAttempt = args.includes("--attempt");

/** Số câu mỗi part của một đề TOEIC chuẩn. */
const PART_SIZES: Record<number, number> = { 1: 6, 2: 25, 3: 39, 4: 30, 5: 30, 6: 16, 7: 54 };

function scoresFrom(accuracy: Record<number, number>): PartScoreInput[] {
  return (Object.keys(PART_SIZES) as unknown as string[]).map((k) => {
    const part = Number(k) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
    const gradable = PART_SIZES[part];
    return { part, gradable, correct: Math.round(gradable * accuracy[part]) };
  });
}

type Fixture = {
  name: string;
  total: number;
  listening: number;
  reading: number;
  accuracy: Record<number, number>;
  intake: Intake;
  targetScore: number;
  deadline: string;
  /** Part mà engine PHẢI xếp vào nhóm ưu tiên — kỳ vọng sư phạm của hồ sơ này. */
  expectFocusIncludes: number[];
};

const START = "2026-11-16"; // Thứ Hai

const FIXTURES: Fixture[] = [
  {
    name: "Yếu đều · 350 điểm · 30 phút/ngày × 4 ngày",
    total: 350,
    listening: 190,
    reading: 160,
    accuracy: { 1: 0.4, 2: 0.36, 3: 0.33, 4: 0.3, 5: 0.35, 6: 0.32, 7: 0.28 },
    intake: { minutesPerDay: 30, daysPerWeek: 4, startDate: START },
    targetScore: 550,
    deadline: "2027-02-15",
    // Yếu đều thì absoluteFloor kéo tất cả lên; Part 5 phải được ưu tiên vì
    // nhiều câu và dễ cải thiện nhất.
    expectFocusIncludes: [5],
  },
  {
    name: "Lệch nghe · 550 điểm · 45 phút/ngày × 5 ngày",
    total: 550,
    listening: 230,
    reading: 320,
    accuracy: { 1: 0.5, 2: 0.44, 3: 0.4, 4: 0.42, 5: 0.78, 6: 0.72, 7: 0.68 },
    intake: { minutesPerDay: 45, daysPerWeek: 5, startDate: START },
    targetScore: 700,
    deadline: "2027-03-01",
    expectFocusIncludes: [2, 3, 4],
  },
  {
    name: "Lệch đọc · 600 điểm · 60 phút/ngày × 6 ngày",
    total: 600,
    listening: 350,
    reading: 250,
    accuracy: { 1: 0.85, 2: 0.8, 3: 0.72, 4: 0.7, 5: 0.45, 6: 0.42, 7: 0.38 },
    intake: { minutesPerDay: 60, daysPerWeek: 6, startDate: START },
    targetScore: 800,
    deadline: "2027-01-10",
    expectFocusIncludes: [5, 6, 7],
  },
];

// ── Khẳng định ───────────────────────────────────────────────────────────────

let failures = 0;
function check(label: string, ok: boolean, detail?: string) {
  if (ok) return;
  failures++;
  console.error(`   ✗ ${label}${detail ? ` — ${detail}` : ""}`);
}

function auditWeek(week: DraftWeek, intake: Intake, busyDates: Set<string>) {
  const studyDays = week.days.filter((d) => !d.rest);
  const restDays = week.days.filter((d) => d.rest);

  check("tuần có ít nhất một ngày nghỉ", restDays.length >= 1);
  check(
    "số ngày học khớp daysPerWeek",
    studyDays.length <= intake.daysPerWeek,
    `${studyDays.length} ngày học, khai ${intake.daysPerWeek}`,
  );

  const seen = new Set<string>();
  for (const day of week.days) {
    const core = day.tasks.filter((t) => t.priority === "core");
    const bonus = day.tasks.filter((t) => t.priority === "bonus");

    if (day.rest) {
      check(`ngày nghỉ ${day.date} không có việc`, day.tasks.length === 0);
      continue;
    }

    check(
      `ngày học ${day.date} có việc`,
      day.tasks.length > 0,
      "kho bài cạn hoặc ngân sách quá nhỏ",
    );
    check(
      `ngày ${day.date} không quá ${MAX_CORE_TASKS_PER_DAY} việc core`,
      core.length <= MAX_CORE_TASKS_PER_DAY,
      `${core.length} việc`,
    );
    check(
      `ngày ${day.date} không quá ${MAX_BONUS_TASKS_PER_DAY} việc bonus`,
      bonus.length <= MAX_BONUS_TASKS_PER_DAY,
    );
    if (busyDates.has(day.date)) {
      check(`ngày bận ${day.date} chỉ 1 việc core`, core.length <= 1, `${core.length} việc`);
    }

    // Thi thử trọn đề được phép vượt ngân sách ngày (nó chiếm cả buổi).
    const hasFullTest = day.tasks.some((t) => t.kind === "full_test");
    const minutes = day.tasks.reduce((s, t) => s + t.estMinutes, 0);
    if (!hasFullTest) {
      check(
        `ngày ${day.date} không vượt quá ngân sách`,
        minutes <= day.budgetMinutes + 15,
        `${minutes} phút / ngân sách ${day.budgetMinutes}`,
      );
    }

    check(
      `ngày ${day.date} không quá 1 thẻ ngữ pháp`,
      day.tasks.filter((t) => t.kind === "grammar").length <= 1,
      `${day.tasks.filter((t) => t.kind === "grammar").length} thẻ`,
    );

    for (const t of day.tasks) {
      check(`việc "${t.catalogId}" có trong catalog`, !!getCatalogItem(t.catalogId));
      check(`việc "${t.catalogId}" không bị giao trùng trong tuần`, !seen.has(t.catalogId));
      seen.add(t.catalogId);
      check(
        `việc "${t.catalogId}" có href`,
        typeof t.href === "string" && t.href.startsWith("/"),
      );
    }
  }

  // Lời hứa trong goalText phải khớp lịch thật: khu luyện từng part mới có đề
  // cho Part 1 và Part 2, nên nhiều tuần sẽ không có mốc kiểm tra nào.
  const hasCheckpoint = week.days.some((d) =>
    d.tasks.some((t) => t.reason === "checkpoint"),
  );
  const promisesCheckpoint = /kiểm tra ngắn|thi thử trọn bộ/.test(week.goalText);
  check(
    "goalText chỉ hứa mốc kiểm tra khi thật sự có",
    hasCheckpoint === promisesCheckpoint,
    `có mốc: ${hasCheckpoint} · hứa: ${promisesCheckpoint}`,
  );

  const budget = intake.minutesPerDay * intake.daysPerWeek;
  const hasFullTest = week.days.some((d) => d.tasks.some((t) => t.kind === "full_test"));
  if (!hasFullTest) {
    check(
      "tổng phút tuần không vượt ngân sách",
      week.targetMinutes <= budget * 1.2,
      `${week.targetMinutes} phút / ngân sách ${budget}`,
    );
    check(
      "tổng phút tuần lấp được ít nhất 60% ngân sách",
      week.targetMinutes >= budget * 0.6,
      `${week.targetMinutes} phút / ngân sách ${budget}`,
    );
  }
}

function printWeek(week: DraftWeek) {
  console.log(`\n   Tuần ${week.weekIndex}: ${week.theme}`);
  console.log(`   ${week.goalText}`);
  console.log(`   Tổng ${week.targetMinutes} phút · ${week.startDate} → ${week.endDate}`);
  for (const day of week.days) {
    if (day.rest) {
      console.log(`     ${formatDayLabel(day.date)}  —  nghỉ`);
      continue;
    }
    const tag = day.busy ? " (ngày có BTVN)" : "";
    console.log(`     ${formatDayLabel(day.date)}  ${day.budgetMinutes} phút${tag}`);
    for (const t of day.tasks) {
      const mark = t.priority === "bonus" ? "+" : "•";
      console.log(
        `        ${mark} [${t.reason.padEnd(11)}] ${t.estMinutes}' ${t.title}`,
      );
      console.log(`          ${t.href}`);
    }
  }
}

// ── Chạy hồ sơ mẫu ───────────────────────────────────────────────────────────

function runFixture(fx: Fixture) {
  console.log(`\n━━ ${fx.name} ━━`);

  const report = diagnose({
    partScores: scoresFrom(fx.accuracy),
    total: fx.total,
    listening: fx.listening,
    reading: fx.reading,
    targetScore: fx.targetScore,
    deadline: fx.deadline,
    startDate: fx.intake.startDate,
    minutesPerDay: fx.intake.minutesPerDay,
    daysPerWeek: fx.intake.daysPerWeek,
  });

  if (!quiet) {
    console.log(
      `   Band ${report.band} · đúng chung ${Math.round(report.overallAccuracy * 100)}%` +
        ` · cần thêm ${report.gapToTarget} điểm trong ${report.weeksLeft} tuần` +
        ` · ước tăng ${report.expectedGain} → ${report.feasibility}`,
    );
    console.log("   Xếp hạng điểm yếu:");
    for (const p of report.parts.slice(0, 4)) {
      console.log(
        `     Part ${p.part}  ưu tiên ${p.priority.toFixed(2)}  ${explainPriority(p)}`,
      );
    }
  }

  check(
    `ưu tiên có part kỳ vọng (${fx.expectFocusIncludes.join("/")})`,
    report.focusParts.some((p) => fx.expectFocusIncludes.includes(p)),
    `engine chọn Part ${report.focusParts.join(", ")}`,
  );
  check("có đủ 2 part ưu tiên", report.focusParts.length === 2);

  // `strongParts` phải đúng là hai part có độ chính xác cao nhất. Cố ý KHÔNG đòi
  // nó khác `focusParts`: với hồ sơ yếu đều, part làm đúng nhiều nhất hoàn toàn
  // có thể cũng là part đáng chữa nhất (Part 5 vừa nhiều câu vừa dễ lên điểm).
  const topByAccuracy = [...report.parts]
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 2)
    .map((p) => p.part);
  check(
    "strongParts đúng là 2 part chính xác nhất",
    JSON.stringify(report.strongParts) === JSON.stringify(topByAccuracy),
    `${report.strongParts.join(",")} vs ${topByAccuracy.join(",")}`,
  );

  // Một ngày trong tuần có BTVN của giáo viên → phải tự giảm tải.
  const busyDates = new Set([addDays(mondayOf(fx.intake.startDate), 2)]);

  const week1 = planWeek({
    report,
    intake: fx.intake,
    weekIndex: 1,
    busyDates,
  });
  if (!quiet) printWeek(week1);
  auditWeek(week1, fx.intake, busyDates);

  // Tuần 2 không được giao lại y nguyên bài của tuần 1.
  const usedInWeek1 = new Set(week1.days.flatMap((d) => d.tasks.map((t) => t.catalogId)));
  const week2 = planWeek({
    report,
    intake: fx.intake,
    weekIndex: 2,
    weekStart: addDays(week1.startDate, 7),
    used: usedInWeek1,
  });
  if (!quiet) printWeek(week2);
  auditWeek(week2, fx.intake, new Set());

  const usedInWeek2 = week2.days.flatMap((d) => d.tasks.map((t) => t.catalogId));
  check(
    "tuần 2 không lặp lại bài của tuần 1",
    usedInWeek2.every((id) => !usedInWeek1.has(id)),
    usedInWeek2.filter((id) => usedInWeek1.has(id)).join(", "),
  );
}

// ── Chạy trên một lượt thi thật ──────────────────────────────────────────────

async function runAttempt(id: string) {
  const { prisma } = await import("../../lib/db/prisma");
  const attempt = await prisma.fullTestAttempt.findUnique({ where: { id } });
  if (!attempt) {
    console.error(`Không tìm thấy lượt thi ${id}`);
    process.exit(1);
  }
  if (attempt.status !== "done" || attempt.total === null) {
    console.error(`Lượt thi ${id} chưa nộp xong — không chẩn đoán được`);
    process.exit(1);
  }

  const partScores = (attempt.partScores as unknown as PartScoreInput[]) ?? [];
  console.log(`\n━━ Lượt thi thật ${id} · ${attempt.testSlug} ━━`);

  const intake: Intake = { minutesPerDay: 45, daysPerWeek: 5, startDate: START };
  const report = diagnose({
    partScores,
    total: attempt.total,
    listening: attempt.listening,
    reading: attempt.reading,
    startDate: intake.startDate,
    minutesPerDay: intake.minutesPerDay,
    daysPerWeek: intake.daysPerWeek,
  });

  console.log(
    `   ${attempt.total} điểm (L ${attempt.listening} · R ${attempt.reading}) · band ${report.band}`,
  );
  for (const p of report.parts.slice(0, 4)) {
    console.log(`     Part ${p.part}  ${explainPriority(p)}`);
  }

  const week = planWeek({ report, intake, weekIndex: 1 });
  printWeek(week);
  auditWeek(week, intake, new Set());
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (wantAttempt) {
    await runAttempt(attemptId);
  } else {
    for (const fx of FIXTURES) runFixture(fx);
  }

  console.log("");
  if (failures) {
    console.error(`✗ ${failures} khẳng định sai.`);
    process.exit(1);
  }
  console.log("✓ Mọi khẳng định đều đúng.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
