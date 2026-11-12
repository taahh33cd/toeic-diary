/**
 * scripts/roadmap/check-catalog.ts — chốt chặn "lộ trình đẹp, bấm vào 404".
 *
 *   npm run check:catalog
 *
 * Đây là lỗi duy nhất giết được tính năng lộ trình: giao cho học viên một bài
 * không tồn tại. Script chạy ba lớp kiểm tra, thoát mã 1 nếu có bất cứ vấn đề gì:
 *
 *   1. Mỗi href có một route thật trong app/ không.
 *      Lớp này MỘT MÌNH là không đủ: route Part 5 là `[tense]/[level]` nên
 *      /subskills/reading/part5/thi-bia-dat/l2 vẫn "khớp route". Vì thế mới có
 *      lớp 2.
 *   2. Catalog đã commit có khớp với registry nội dung hiện tại không — dựng lại
 *      trong bộ nhớ rồi so từng id/href. Đây là lớp bắt được slug bịa, bắt được
 *      bài bị xoá khỏi data, và bắt được cả trường hợp quên chạy build:catalog.
 *   3. Ràng buộc nội bộ: prereq có thật, dải điểm hợp lệ, evidence đủ khoá.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { CATALOG_ITEMS } from "../../lib/roadmap/catalog.generated";
import { buildCatalog } from "./catalog-source";

const APP_DIR = resolve(process.cwd(), "app");

const problems: string[] = [];
const warnings: string[] = [];

/**
 * Một đoạn URL có khớp một thư mục route không.
 * Ưu tiên thư mục tên đúng; không có thì chấp nhận [param] / [...param].
 * Bỏ qua route group `(ten)` — chúng không xuất hiện trong URL.
 */
function matchSegment(dir: string, segment: string): string | null {
  const direct = join(dir, segment);
  if (existsSync(direct) && statSync(direct).isDirectory()) return direct;

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return null;
  }

  const dynamic = entries.find(
    (e) =>
      (e.startsWith("[") && e.endsWith("]")) &&
      statSync(join(dir, e)).isDirectory(),
  );
  if (dynamic) return join(dir, dynamic);

  // Thử chui qua route group, vd app/(student)/journal
  for (const e of entries) {
    if (!e.startsWith("(") || !e.endsWith(")")) continue;
    const p = join(dir, e);
    if (!statSync(p).isDirectory()) continue;
    const inner = matchSegment(p, segment);
    if (inner) return inner;
  }
  return null;
}

function routeExists(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  let dir = APP_DIR;
  for (const seg of segments) {
    const next = matchSegment(dir, seg);
    if (!next) return false;
    dir = next;
  }
  return existsSync(join(dir, "page.tsx")) || existsSync(join(dir, "page.ts"));
}

// ── 1. Mọi href phải dẫn tới một route có thật ──────────────────────────────
const checkedPaths = new Map<string, boolean>();
for (const item of CATALOG_ITEMS) {
  const pathname = item.href.split("?")[0];
  if (!pathname.startsWith("/")) {
    problems.push(`${item.id}: href không bắt đầu bằng "/" (${item.href})`);
    continue;
  }
  let ok = checkedPaths.get(pathname);
  if (ok === undefined) {
    ok = routeExists(pathname);
    checkedPaths.set(pathname, ok);
  }
  if (!ok) problems.push(`${item.id}: không có route cho ${pathname}`);
}

// ── 2. Catalog đã commit có còn khớp registry nội dung không ────────────────
{
  const fresh = buildCatalog().items;
  const freshById = new Map(fresh.map((i) => [i.id, i]));
  const committedById = new Map(CATALOG_ITEMS.map((i) => [i.id, i]));

  for (const item of CATALOG_ITEMS) {
    const f = freshById.get(item.id);
    if (!f) {
      problems.push(
        `${item.id}: có trong catalog nhưng dựng lại không ra — slug bịa, hoặc dữ liệu đã bị xoá`,
      );
      continue;
    }
    if (f.href !== item.href) {
      problems.push(`${item.id}: href lệch (file: ${item.href} · thật: ${f.href})`);
    }
    if (JSON.stringify(f.evidence) !== JSON.stringify(item.evidence)) {
      problems.push(`${item.id}: evidence lệch so với registry — chạy lại build:catalog`);
    }
  }

  const missing = fresh.filter((f) => !committedById.has(f.id));
  if (missing.length) {
    problems.push(
      `${missing.length} mục nội dung mới chưa có trong catalog (vd ${missing
        .slice(0, 3)
        .map((m) => m.id)
        .join(", ")}) — chạy npm run build:catalog`,
    );
  }
}

// ── 3. Ràng buộc nội bộ của catalog ─────────────────────────────────────────
const ids = new Set(CATALOG_ITEMS.map((i) => i.id));

for (const item of CATALOG_ITEMS) {
  for (const p of item.prereq) {
    if (!ids.has(p)) problems.push(`${item.id}: prereq "${p}" không có trong catalog`);
  }
  if (item.bandMin > item.bandMax) {
    problems.push(`${item.id}: bandMin ${item.bandMin} > bandMax ${item.bandMax}`);
  }
  if (item.estMinutes <= 0 || item.estMinutes > 180) {
    problems.push(`${item.id}: estMinutes bất thường (${item.estMinutes})`);
  }
  if (!item.parts.length) {
    problems.push(`${item.id}: không gắn part nào — planner sẽ không bao giờ chọn`);
  }
  if (!item.title.trim()) problems.push(`${item.id}: thiếu tiêu đề`);

  // Evidence phải đủ khoá, nếu không việc sẽ không bao giờ tự tích xong.
  const ev = item.evidence;
  switch (ev.source) {
    case "subskill":
      if (!ev.part || !ev.questionWord)
        problems.push(`${item.id}: evidence subskill thiếu part/questionWord`);
      if (ev.minExercises < 1)
        problems.push(`${item.id}: evidence subskill minExercises < 1`);
      break;
    case "ipa":
      if (!ev.section || !ev.difficulty)
        problems.push(`${item.id}: evidence ipa thiếu section/difficulty`);
      break;
    case "grammar":
      if (!ev.topicSlug) problems.push(`${item.id}: evidence grammar thiếu topicSlug`);
      if (ev.minQuestions < 1)
        problems.push(`${item.id}: evidence grammar minQuestions < 1`);
      break;
    case "part_practice":
      if (!ev.testSlug) problems.push(`${item.id}: evidence part_practice thiếu testSlug`);
      break;
    case "full_test":
      if (!ev.examSlug || !ev.testSlug)
        problems.push(`${item.id}: evidence full_test thiếu slug`);
      break;
  }
}

// ── 4. Cảnh báo: part nào không có bài nào chữa ─────────────────────────────
for (const part of [1, 2, 3, 4, 5, 6, 7] as const) {
  const n = CATALOG_ITEMS.filter(
    (i) => i.parts.includes(part) && i.kind !== "full_test",
  ).length;
  if (n === 0) {
    problems.push(`Part ${part}: không có bài nào trong catalog — planner sẽ bí`);
  } else if (n < 5) {
    warnings.push(`Part ${part}: chỉ có ${n} bài, lộ trình sẽ lặp lại nhanh`);
  }
}

// ── Kết quả ─────────────────────────────────────────────────────────────────
console.log(`Đã kiểm tra ${CATALOG_ITEMS.length} mục · ${checkedPaths.size} đường dẫn.`);

if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} cảnh báo:`);
  for (const w of warnings) console.log(`   - ${w}`);
}

if (problems.length) {
  console.error(`\n✗ ${problems.length} lỗi:`);
  for (const p of problems.slice(0, 50)) console.error(`   - ${p}`);
  if (problems.length > 50) console.error(`   … và ${problems.length - 50} lỗi nữa`);
  process.exit(1);
}

console.log("\n✓ Catalog sạch — mọi href đều có route thật.");
