/**
 * Xác minh Phase 0: số "từ đến hạn" trước đây lệch giữa 4 nơi, giờ phải về một số.
 *
 * Đọc kho từ thật trên RTDB, chạy song song 4 biến thể logic CŨ và logic MỚI
 * (lib/vocab/srs.ts), in bảng so sánh theo từng học viên.
 *
 *   npx tsx scripts/verify-srs-unify.ts            # 10 học viên nhiều từ nhất
 *   npx tsx scripts/verify-srs-unify.ts --all
 *
 * Script chỉ đọc, không ghi gì.
 */

import "dotenv/config";
import { getAdminDb } from "@/lib/firebase/admin";
import { countDue, isDue } from "@/lib/vocab/srs";
import type { VocabWord } from "@/lib/firebase/types";

type W = Omit<VocabWord, "id">;

// ── 4 biến thể logic CŨ, chép nguyên từ các file trước khi sửa ───────────────

/** hooks/firebase/useNavBadges.ts — bảng interval khác, KHÔNG bỏ từ đã thuộc */
function oldBadge(words: W[]): number {
  const SRS = [1, 3, 7, 14, 30, 90, 180];
  const today = new Date().toISOString().slice(0, 10);
  const addDays = (d: string, n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x.toISOString().slice(0, 10);
  };
  return words.filter((w) => {
    if (!w.lastReview) return true;
    return addDays(w.lastReview, SRS[Math.min(w.repCount, SRS.length - 1)]) <= today;
  }).length;
}

/** app/(student)/journal/vocab/page.tsx — hôm nay theo UTC */
function oldPage(words: W[]): number {
  const SRS = [0, 1, 3, 7, 14, 30, 60];
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date(todayStr + "T00:00:00");
  return words.filter((w) => {
    if ((w.repCount ?? 0) >= 10) return false;
    if (!w.lastReview) return true;
    const due = new Date(w.lastReview + "T00:00:00");
    due.setDate(due.getDate() + SRS[Math.min(w.repCount ?? 0, SRS.length - 1)]);
    return due <= today;
  }).length;
}

/** app/(student)/journal/_dashboard-client.tsx — hôm nay theo local, KHÔNG bỏ từ đã thuộc */
function oldDashboard(words: W[]): number {
  const SRS = [0, 1, 3, 7, 14, 30, 60];
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = new Date(todayStr + "T00:00:00");
  return words.filter((w) => {
    if (!w.lastReview) return true;
    const due = new Date(w.lastReview + "T00:00:00");
    due.setDate(due.getDate() + SRS[Math.min(w.repCount ?? 0, SRS.length - 1)]);
    return due <= today;
  }).length;
}

/** app/api/cron/* — hôm nay theo ICT, có bỏ từ đã thuộc */
function oldCron(words: W[]): number {
  const SRS = [0, 1, 3, 7, 14, 30, 60];
  const todayStr = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  const today = new Date(todayStr + "T00:00:00");
  return words.filter((w) => {
    if ((w.repCount ?? 0) >= 10) return false;
    if (!w.lastReview) return true;
    const due = new Date(w.lastReview + "T00:00:00");
    due.setDate(due.getDate() + SRS[Math.min(w.repCount ?? 0, SRS.length - 1)]);
    return due <= today;
  }).length;
}

async function main() {
  const all = process.argv.includes("--all");

  const snap = await getAdminDb().ref("vocab").get();
  if (!snap.exists()) {
    console.log("RTDB vocab/ rỗng — không có gì để đối chiếu.");
    return;
  }

  const raw = snap.val() as Record<string, Record<string, W>>;
  let rows = Object.entries(raw).map(([code, map]) => {
    const words = Object.values(map ?? {}).filter((w) => w && typeof w.word === "string");
    return { code, words };
  });
  rows.sort((a, b) => b.words.length - a.words.length);
  if (!all) rows = rows.slice(0, 10);

  console.log(
    `\nHọc viên có kho từ: ${Object.keys(raw).length}` +
      (all ? "" : " (hiện 10 người nhiều từ nhất)") + "\n"
  );
  console.log("mã HV      tổng  thuộc |  badge   trang   dash    cron |   MỚI  | lệch");
  console.log("-".repeat(78));

  let mismatchBadge = 0;
  let mismatchAny = 0;

  for (const { code, words } of rows) {
    const mastered = words.filter((w) => (w.repCount ?? 0) >= 10).length;
    const o1 = oldBadge(words);
    const o2 = oldPage(words);
    const o3 = oldDashboard(words);
    const o4 = oldCron(words);
    const now = countDue(words);

    const olds = [o1, o2, o3, o4];
    const spread = Math.max(...olds) - Math.min(...olds);
    if (o1 !== now) mismatchBadge++;
    if (spread > 0) mismatchAny++;

    console.log(
      `${code.padEnd(10)} ${String(words.length).padStart(4)}  ${String(mastered).padStart(5)} |` +
        `${String(o1).padStart(7)} ${String(o2).padStart(7)} ${String(o3).padStart(7)} ${String(o4).padStart(7)} |` +
        `${String(now).padStart(6)}  | ${spread > 0 ? `±${spread}` : "—"}`
    );
  }

  console.log("-".repeat(78));
  console.log(`\nTRƯỚC: ${mismatchAny}/${rows.length} học viên có 4 nơi hiện 4 số khác nhau.`);
  console.log(`       ${mismatchBadge}/${rows.length} học viên thấy badge nav lệch với số mới.`);
  console.log(`SAU:   mọi nơi gọi countDue() nên chỉ còn một số — cột MỚI.`);
  console.log(`\nSố mới phải khớp cột "cron" (cron đã đúng từ trước: ICT + bỏ từ đã thuộc).`);

  const wrong = rows.filter(({ words }) => oldCron(words) !== countDue(words));
  if (wrong.length === 0) {
    console.log("✓ Khớp 100% với cron trên mọi học viên đã kiểm.");
  } else {
    console.log(`✗ Lệch với cron ở ${wrong.length} học viên: ${wrong.map((w) => w.code).join(", ")}`);
    process.exitCode = 1;
  }

  // Kiểm tra bất biến: không từ nào đã thuộc mà vẫn bị tính đến hạn
  const leaked = rows.flatMap(({ code, words }) =>
    words.filter((w) => (w.repCount ?? 0) >= 10 && isDue(w)).map((w) => `${code}/${w.word}`)
  );
  console.log(
    leaked.length === 0
      ? "✓ Không từ đã thuộc nào bị tính đến hạn."
      : `✗ ${leaked.length} từ đã thuộc vẫn bị tính đến hạn: ${leaked.slice(0, 5).join(", ")}`
  );
  if (leaked.length > 0) process.exitCode = 1;
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
