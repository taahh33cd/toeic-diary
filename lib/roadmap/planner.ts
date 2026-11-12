/**
 * lib/roadmap/planner.ts — rải bài vào lịch một tuần.
 *
 * Thuần code, không gọi AI. Đây là MẠNG LƯỚI AN TOÀN của cả tính năng: Gemini
 * sập, hết quota hay trả JSON rác thì học viên vẫn nhận được lộ trình đầy đủ từ
 * hàm này, chỉ là lời lẽ khô hơn. Vì vậy planner không được phép phụ thuộc vào
 * bất cứ thứ gì có thể hỏng — không mạng, không DB, không AI.
 *
 * Quy tắc rải bài (plan-roadmap-ai.md §7):
 *   • 60% thời lượng chữa 2 part yếu nhất · 25% kỹ năng nền · 15% duy trì
 *   • tối đa 3 việc core + 1 bonus mỗi ngày
 *   • ngày có BTVN của giáo viên → chỉ 1 việc ngắn
 *   • luôn có ít nhất một ngày nghỉ trong tuần
 *   • ngày cuối tuần học: một mốc kiểm tra để đo tiến bộ thật
 */

import {
  BUDGET_SPLIT,
  BUSY_DAY_MAX_CORE_TASKS,
  BUSY_DAY_MINUTES,
  LIGHT_DAY_RATIO,
  MAX_BONUS_TASKS_PER_DAY,
  MAX_CORE_TASKS_PER_DAY,
  PREFERRED_STUDY_DAYS,
} from "./config";
import {
  checkpointForPart,
  filterCatalog,
  nextFullTest,
  sortForPlanner,
} from "./catalog";
import { addDays, mondayOf, weekDays, weekdayOf } from "./vn-date";
import type {
  CatalogItem,
  DraftDay,
  DraftTask,
  DraftWeek,
  Intake,
  PartNumber,
  WeaknessReport,
} from "./types";

/** Tag được coi là "kỹ năng nền" — phần 25% ngân sách. */
const FOUNDATION_TAGS = [
  "grammar-core",
  "listening-decode",
  "vocab",
  "pronunciation",
  "chunking",
];

export type PlanWeekInput = {
  report: WeaknessReport;
  intake: Intake;
  /** 1 = tuần đầu tiên của lộ trình. */
  weekIndex: number;
  /** Thứ Hai của tuần. Bỏ trống thì lấy tuần chứa `intake.startDate`. */
  weekStart?: string;
  /** catalogId học viên đã hoàn thành — dùng để mở khoá bậc sau. */
  completed?: Set<string>;
  /** catalogId đã giao ở các tuần trước — không giao lại. */
  used?: Set<string>;
  /** Ngày có BTVN của giáo viên hoặc buổi học trên lớp → giảm tải. */
  busyDates?: Set<string>;
  /** Tuần này có mốc kiểm tra tháng (thi thử trọn đề) không. */
  monthCheckpoint?: boolean;
};

export function planWeek(input: PlanWeekInput): DraftWeek {
  const { report, intake, weekIndex } = input;
  const completed = input.completed ?? new Set<string>();
  const used = new Set(input.used ?? []);
  const busyDates = input.busyDates ?? new Set<string>();

  const weekStart = input.weekStart ?? mondayOf(intake.startDate);
  const weekEnd = addDays(weekStart, 6);

  // ── Chọn ngày học trong tuần ──────────────────────────────────────────────
  const studyWeekdays = PREFERRED_STUDY_DAYS.slice(0, intake.daysPerWeek);
  // Khai học cả 7 ngày thì ngày cuối danh sách thành "ôn nhẹ" — vẫn phải có một
  // ngày thở, nếu không tuần thứ hai là bỏ cuộc.
  const lightWeekday =
    intake.daysPerWeek >= 7 ? studyWeekdays[studyWeekdays.length - 1] : null;

  // ── Dựng các kho bài ──────────────────────────────────────────────────────
  const band = report.bandAnchor;
  const focusParts = pickFocusParts(report, intake);

  /**
   * Dựng kho theo hai nấc: bài đúng tầm trước, rồi mới tới bài dễ hơn tầm.
   *
   * Nấc hai là bắt buộc chứ không phải cho đẹp: band và prereq cộng lại khoá
   * chặt học viên tầm giữa (xem ghi chú ở `filterCatalog.ignoreBandMax`), và
   * một kho rỗng nghĩa là ngày học trống — thứ tệ hơn nhiều so với một bài hơi
   * dễ. Giữ nguyên thứ tự nên bài đúng tầm luôn được bốc trước.
   */
  const poolFor = (opts: Omit<Parameters<typeof filterCatalog>[0], "band">) => {
    const strict = sortForPlanner(filterCatalog({ ...opts, band }));
    const relaxed = sortForPlanner(
      filterCatalog({ ...opts, band, ignoreBandMax: true }),
    );
    const seen = new Set(strict.map((i) => i.id));
    return [...strict, ...relaxed.filter((i) => !seen.has(i.id))];
  };

  const kinds = ["subskill", "grammar", "ipa"] as const;
  const pools = {
    focus: poolFor({ parts: focusParts, exclude: used, completed, kinds: [...kinds] }),
    foundation: poolFor({
      anyTag: FOUNDATION_TAGS,
      exclude: used,
      completed,
      kinds: [...kinds],
    }),
    maintenance: poolFor({
      parts: report.strongParts,
      exclude: used,
      completed,
      kinds: [...kinds],
    }),
  };

  // ── Rải vào từng ngày ─────────────────────────────────────────────────────
  const days: DraftDay[] = [];
  const studyDates: string[] = [];
  /** Tuần này có thật sự đặt được mốc kiểm tra không — xem ghi chú ở dưới. */
  let checkpointAdded = false;

  for (const date of weekDays(weekStart)) {
    const wd = weekdayOf(date);
    const beforeStart = date < intake.startDate;
    const isStudyDay = (studyWeekdays as readonly number[]).includes(wd);

    if (beforeStart || !isStudyDay) {
      days.push({ date, weekday: wd, rest: true, busy: false, budgetMinutes: 0, tasks: [] });
      continue;
    }

    const busy = busyDates.has(date);
    const light = wd === lightWeekday;
    const budgetMinutes = busy
      ? Math.min(intake.minutesPerDay, BUSY_DAY_MINUTES)
      : light
        ? Math.max(10, Math.round(intake.minutesPerDay * LIGHT_DAY_RATIO))
        : intake.minutesPerDay;

    days.push({ date, weekday: wd, rest: false, busy, budgetMinutes, tasks: [] });
    studyDates.push(date);
  }

  const lastStudyDate = studyDates[studyDates.length - 1];

  days.forEach((day, dayIdx) => {
    if (day.rest) return;

    const maxCore = day.busy ? BUSY_DAY_MAX_CORE_TASKS : MAX_CORE_TASKS_PER_DAY;
    let remaining = day.budgetMinutes;
    const groupsUsed = new Set<string>();

    const coreCount = () => day.tasks.filter((t) => t.priority === "core").length;

    /**
     * Bốc bài từ một kho vào ngày này.
     *
     * Phải kiểm `used` ngay tại đây chứ không chỉ lúc dựng kho: ba kho focus /
     * foundation / maintenance chồng lấn nhau (một bài Part 5 vừa là bài chữa
     * điểm yếu vừa là bài nền), nên xoá khỏi kho này không xoá khỏi kho kia —
     * thiếu dòng kiểm tra này là một ngày nhận hai lần cùng một bài.
     */
    const take = (
      pool: CatalogItem[],
      minutes: number,
      reason: DraftTask["reason"],
      max = 1,
    ) => {
      let added = 0;
      let slice = minutes;
      while (added < max && coreCount() < maxCore && remaining > 0) {
        const cap = Math.min(Math.max(slice, 0) || remaining, remaining);
        const fits = (it: CatalogItem, limit: number) =>
          !used.has(it.id) && it.estMinutes <= limit && !groupsUsed.has(groupKey(it));

        let idx = pool.findIndex((it) => fits(it, cap));
        // Chưa lấy được việc nào mà lát ngân sách quá hẹp thì nới tới phần thời
        // gian còn lại của ngày. Không có lối thoát này thì một bài dài hơn lát
        // của nó sẽ không bao giờ được giao — và nếu đó là kho chữa điểm yếu,
        // học viên yếu phần nào lại chẳng bao giờ nhận bài phần đó.
        if (idx === -1 && added === 0 && cap < remaining) {
          idx = pool.findIndex((it) => fits(it, remaining));
        }
        if (idx === -1) break;
        const [item] = pool.splice(idx, 1);
        used.add(item.id);
        groupsUsed.add(groupKey(item));
        day.tasks.push(toTask(item, "core", reason));
        remaining -= item.estMinutes;
        slice -= item.estMinutes;
        added++;
      }
    };

    // Ngày bận: đúng một việc ngắn nhất của kho chữa điểm yếu.
    if (day.busy) {
      take(pools.focus, remaining, "focus", 1);
      if (day.tasks.length === 0) take(pools.foundation, remaining, "foundation", 1);
      return;
    }

    // Ngày học cuối tuần: đặt mốc kiểm tra TRƯỚC khi rải việc khác, để nó được
    // tính vào ngân sách. Nhét vào cuối thì ngày đó luôn thừa một việc và vượt
    // giờ — học viên thấy ngày cuối tuần nào cũng nặng bất thường.
    if (date_eq(day.date, lastStudyDate)) {
      const cp = input.monthCheckpoint
        ? nextFullTest(used)
        : checkpointForPart(focusParts[0], used);
      if (cp) {
        used.add(cp.id);
        groupsUsed.add(groupKey(cp));
        day.tasks.push(toTask(cp, "core", "checkpoint"));
        remaining -= cp.estMinutes;
        checkpointAdded = true;
        // Thi thử trọn đề chiếm cả buổi — giao kèm việc khác chỉ làm học viên
        // bỏ dở một trong hai.
        if (cp.kind === "full_test") return;
      }
    }

    // Xen kẽ Nghe/Đọc giữa các ngày: ngày chẵn ưu tiên part yếu nhất, ngày lẻ
    // ưu tiên part yếu nhì. Không làm thế thì ba ngày liền toàn Part 5.
    const rotated = dayIdx % 2 === 1 ? rotatePool(pools.focus, focusParts[1]) : pools.focus;

    take(rotated, Math.round(day.budgetMinutes * BUDGET_SPLIT.focus), "focus", 2);
    take(
      pools.foundation,
      Math.round(day.budgetMinutes * BUDGET_SPLIT.foundation),
      "foundation",
      1,
    );
    if (remaining >= 10) {
      take(
        pools.maintenance,
        Math.round(day.budgetMinutes * BUDGET_SPLIT.maintenance),
        "maintenance",
        1,
      );
    }

    // Còn thừa thời gian thì thêm một việc bonus (không bắt buộc).
    if (
      remaining >= 10 &&
      day.tasks.filter((t) => t.priority === "bonus").length < MAX_BONUS_TASKS_PER_DAY
    ) {
      const pool = pools.focus.length ? pools.focus : pools.foundation;
      const idx = pool.findIndex(
        (it) =>
          !used.has(it.id) &&
          it.estMinutes <= remaining &&
          !groupsUsed.has(groupKey(it)),
      );
      if (idx !== -1) {
        const [item] = pool.splice(idx, 1);
        used.add(item.id);
        day.tasks.push(toTask(item, "bonus", "focus"));
        remaining -= item.estMinutes;
      }
    }
  });

  const targetMinutes = days.reduce(
    (sum, d) => sum + d.tasks.reduce((s, t) => s + t.estMinutes, 0),
    0,
  );

  return {
    weekIndex,
    startDate: weekStart,
    endDate: weekEnd,
    theme: themeFor(report, focusParts, weekIndex),
    goalText: goalTextFor(report, focusParts, targetMinutes, {
      monthCheckpoint: input.monthCheckpoint,
      checkpointAdded,
    }),
    targetMinutes,
    days,
  };
}

// ── Phụ trợ ──────────────────────────────────────────────────────────────────

function date_eq(a: string, b: string | undefined): boolean {
  return b !== undefined && a === b;
}

/**
 * Khoá nhóm để một ngày không nhận hai bài quá giống nhau.
 *
 * Với subskill thì hai đoạn đầu của id là đủ ("sub.part5", "sub.conn"). Với thẻ
 * ngữ pháp thì KHÔNG: đoạn thứ hai là tên thẻ, nên "giới từ" và "liên từ" tính
 * là hai nhóm khác nhau và một ngày có thể nhận bốn thẻ ngữ pháp liên tiếp —
 * đúng luật nhưng học thì chán chết. Cả khu ngữ pháp gộp làm một nhóm, mỗi ngày
 * một thẻ.
 */
function groupKey(item: CatalogItem): string {
  if (item.kind === "grammar") return "grammar";
  return item.id.split(".").slice(0, 2).join(".");
}

/** Đưa bài của `part` lên đầu kho, giữ nguyên thứ tự phần còn lại. */
function rotatePool(pool: CatalogItem[], part: PartNumber | undefined): CatalogItem[] {
  if (part === undefined) return pool;
  const head = pool.filter((i) => i.parts.includes(part));
  const tail = pool.filter((i) => !i.parts.includes(part));
  return [...head, ...tail];
}

/**
 * Hai part được chữa trong tuần. Nếu học viên có khai part muốn ưu tiên và part
 * đó thật sự yếu (nằm trong 4 part đầu bảng xếp hạng) thì tôn trọng ý họ —
 * người học chịu làm bài mình chọn hơn là bài bị giao.
 */
function pickFocusParts(report: WeaknessReport, intake: Intake): PartNumber[] {
  const ranked = report.parts.map((p) => p.part);
  const preferred = (intake.preferredParts ?? []).filter((p) =>
    ranked.slice(0, 4).includes(p),
  );
  const picked: PartNumber[] = [];
  for (const p of [...preferred, ...ranked]) {
    if (!picked.includes(p)) picked.push(p);
    if (picked.length === 2) break;
  }
  return picked;
}

function toTask(
  item: CatalogItem,
  priority: "core" | "bonus",
  reason: DraftTask["reason"],
): DraftTask {
  return {
    catalogId: item.id,
    title: item.title,
    href: item.href,
    kind: item.kind,
    target: item.evidence,
    estMinutes: item.estMinutes,
    priority,
    reason,
  };
}

const PART_LABEL: Record<PartNumber, string> = {
  1: "Part 1 · Mô tả tranh",
  2: "Part 2 · Hỏi – đáp",
  3: "Part 3 · Hội thoại",
  4: "Part 4 · Bài nói",
  5: "Part 5 · Hoàn thành câu",
  6: "Part 6 · Hoàn thành đoạn văn",
  7: "Part 7 · Đọc hiểu",
};

function themeFor(
  report: WeaknessReport,
  focusParts: PartNumber[],
  weekIndex: number,
): string {
  const main = focusParts[0];
  const second = focusParts[1];
  if (weekIndex === 1) return `Bắt đầu từ ${PART_LABEL[main]}`;
  if (second === undefined) return `Tiếp tục ${PART_LABEL[main]}`;
  return `${PART_LABEL[main]} + ${PART_LABEL[second]}`;
}

/**
 * Câu mục tiêu tuần, bản rule. Phase 2 sẽ để Gemini viết lại cho mượt, nhưng
 * câu này phải đứng được một mình — nó là thứ học viên đọc khi AI hỏng.
 */
function goalTextFor(
  report: WeaknessReport,
  focusParts: PartNumber[],
  targetMinutes: number,
  checkpoint: { monthCheckpoint?: boolean; checkpointAdded: boolean },
): string {
  const main = report.parts.find((p) => p.part === focusParts[0]);
  const pct = main ? Math.round(main.accuracy * 100) : null;
  const hours = Math.round((targetMinutes / 60) * 10) / 10;

  const head =
    pct === null
      ? `Tuần này tập trung vào ${PART_LABEL[focusParts[0]]}.`
      : `Tuần này tập trung vào ${PART_LABEL[focusParts[0]]} — bài test đầu vào bạn đúng ${pct}% phần này.`;

  // Chỉ hứa mốc kiểm tra khi thật sự đặt được. Khu luyện từng part mới có đề
  // cho Part 1 và Part 2, nên học viên yếu Part 5-7 tuần này KHÔNG có bài kiểm
  // tra ngắn nào — viết sẵn câu hứa vào đây là nói sai với người học.
  const tail = !checkpoint.checkpointAdded
    ? ""
    : checkpoint.monthCheckpoint
      ? " Cuối tuần có một đề thi thử trọn bộ để đo lại điểm."
      : " Cuối tuần có một bài kiểm tra ngắn để xem đã lên được chưa.";

  return `${head} Tổng cộng khoảng ${hours} giờ.${tail}`;
}
