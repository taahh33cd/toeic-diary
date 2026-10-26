/**
 * Xác minh migration 008: đối chiếu TỪNG TỪ giữa RTDB vocab/{code} và Postgres.
 *
 * Không tin số mà script migrate tự in — đọc lại cả hai phía rồi so khớp:
 *   1. Mọi từ trên RTDB đều có thẻ trong Postgres (theo wordKey + Part)
 *   2. repCount / lastReview chuyển đúng
 *   3. dueAt tính ra đúng ngày mà trang vocab cũ sẽ hiển thị
 *   4. Số "từ đến hạn" đọc từ Postgres khớp số đọc từ RTDB
 *
 *   npx tsx scripts/verify-vocab-migration.ts
 *
 * Chỉ đọc, không ghi. Thoát khác 0 nếu có sai lệch.
 */

import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { normalizeWord } from "@/lib/vocab/normalize";
import { countDue, intervalFor, MASTERY_THRESHOLD } from "@/lib/vocab/srs";
import type { VocabWord } from "@/lib/firebase/types";

type W = Omit<VocabWord, "id">;

function ngayCuaDate(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

function dueMongDoi(lastReview: string | undefined, repCount: number): string | null {
  if (!lastReview) return null; // chưa ôn → dueAt = thời điểm migrate, không so ngày
  const d = new Date(lastReview + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + intervalFor(repCount));
  return d.toISOString().slice(0, 10);
}

async function main() {
  const loi: string[] = [];
  const canh: string[] = [];

  const snap = await getAdminDb().ref("vocab").get();
  const raw = (snap.val() ?? {}) as Record<string, Record<string, W> | null>;

  const profiles = await prisma.profile.findMany({
    where: { studentCode: { in: Object.keys(raw) } },
    select: { id: true, studentCode: true, displayName: true },
  });

  console.log("mã HV        RTDB   thẻ PG  tiến độ |  đến hạn RTDB/PG  | kết quả");
  console.log("-".repeat(74));

  let tongThe = 0;
  let tongTienDo = 0;

  for (const p of profiles) {
    const code = p.studentCode!;
    const words = Object.values(raw[code] ?? {}).filter(
      (w): w is W => !!w && typeof w.word === "string" && w.word.trim() !== ""
    );
    if (words.length === 0) continue;

    const decks = await prisma.vocabDeck.findMany({
      where: { ownerId: p.id, source: "migrated" },
      select: { id: true, part: true, cardCount: true, cards: { select: { wordKey: true, word: true, ipa: true, meaningVi: true } } },
    });
    const progress = await prisma.vocabProgress.findMany({
      where: { userId: p.id },
      select: { wordKey: true, repCount: true, lastReview: true, dueAt: true, mastered: true, intervalDays: true },
    });

    const theTheoKey = new Map<string, { part: number | null }[]>();
    for (const d of decks) {
      for (const c of d.cards) {
        const arr = theTheoKey.get(c.wordKey) ?? [];
        arr.push({ part: d.part ?? null });
        theTheoKey.set(c.wordKey, arr);
      }
    }
    const tdTheoKey = new Map(progress.map((x) => [x.wordKey, x]));

    // 1 + 2 + 3: đối chiếu từng từ
    for (const w of words) {
      const key = normalizeWord(w.word);
      const part = typeof w.part === "number" && w.part >= 1 && w.part <= 7 ? w.part : null;

      const the = theTheoKey.get(key);
      if (!the) {
        loi.push(`${code}: từ "${w.word}" có trên RTDB nhưng KHÔNG có thẻ ở Postgres`);
        continue;
      }
      if (!the.some((t) => t.part === part)) {
        loi.push(
          `${code}: từ "${w.word}" ở Part ${part ?? "Khác"} nhưng thẻ lại nằm ở ` +
            `Part ${the.map((t) => t.part ?? "Khác").join("/")}`
        );
      }

      const td = tdTheoKey.get(key);
      if (!td) {
        loi.push(`${code}: từ "${w.word}" không có dòng tiến độ`);
        continue;
      }

      // repCount: tiến độ gộp lấy repCount LỚN NHẤT trong các bản trùng
      const repMax = Math.max(
        ...words.filter((x) => normalizeWord(x.word) === key).map((x) => x.repCount ?? 0)
      );
      if (td.repCount !== repMax) {
        loi.push(`${code}/"${w.word}": repCount PG=${td.repCount} ≠ RTDB(max)=${repMax}`);
      }

      if (td.mastered !== repMax >= MASTERY_THRESHOLD) {
        loi.push(`${code}/"${w.word}": cờ mastered sai (repCount=${repMax})`);
      }

      if (td.intervalDays !== intervalFor(repMax)) {
        loi.push(
          `${code}/"${w.word}": intervalDays PG=${td.intervalDays} ≠ ${intervalFor(repMax)}`
        );
      }

      // dueAt: chỉ so khi từ đã từng được ôn
      const repSource = words.find(
        (x) => normalizeWord(x.word) === key && (x.repCount ?? 0) === repMax
      );
      const mongDoi = dueMongDoi(repSource?.lastReview, repMax);
      if (mongDoi) {
        const thucTe = ngayCuaDate(td.dueAt);
        if (thucTe !== mongDoi) {
          loi.push(`${code}/"${w.word}": dueAt PG=${thucTe} ≠ mong đợi=${mongDoi}`);
        }
        const lrPg = ngayCuaDate(td.lastReview);
        if (lrPg !== repSource!.lastReview) {
          loi.push(`${code}/"${w.word}": lastReview PG=${lrPg} ≠ RTDB=${repSource!.lastReview}`);
        }
      } else if (td.lastReview !== null) {
        canh.push(`${code}/"${w.word}": RTDB không có lastReview nhưng PG có ${ngayCuaDate(td.lastReview)}`);
      }
    }

    // 4: số "đến hạn" hai phía.
    // Phải gộp từ trùng trên RTDB trước khi đếm, vì Postgres có MỘT dòng tiến độ
    // cho mỗi từ — đúng chủ ý của mô hình. countDue(words) thô sẽ đếm từ trùng
    // hai lần, đó chính là chỗ badge cũ thổi phồng số "đến hạn".
    const gopTheoKey = new Map<string, W>();
    for (const w of words) {
      const k = normalizeWord(w.word);
      const cu = gopTheoKey.get(k);
      if (!cu || (w.repCount ?? 0) > (cu.repCount ?? 0)) gopTheoKey.set(k, w);
    }
    const dueRtdb = countDue([...gopTheoKey.values()]);
    const dueRtdbTho = countDue(words);
    const hnay = new Date();
    const duePg = progress.filter((x) => !x.mastered && x.dueAt !== null && x.dueAt <= hnay).length;

    // cardCount denormalized phải khớp số thẻ thật
    for (const d of decks) {
      if (d.cardCount !== d.cards.length) {
        loi.push(`${code}: bộ ${d.id} cardCount=${d.cardCount} ≠ số thẻ thật=${d.cards.length}`);
      }
    }

    const soThe = decks.reduce((n, d) => n + d.cards.length, 0);
    tongThe += soThe;
    tongTienDo += progress.length;

    const okDue = dueRtdb === duePg;
    const thoiPhong = dueRtdbTho - dueRtdb;
    console.log(
      `${code.padEnd(12)} ${String(words.length).padStart(4)} ${String(soThe).padStart(7)} ` +
        `${String(progress.length).padStart(8)} | ${String(dueRtdb).padStart(9)}/${String(duePg).padEnd(6)} | ` +
        (okDue ? "✓" : `✗ lệch ${Math.abs(dueRtdb - duePg)}`) +
        (thoiPhong > 0 ? `  (badge cũ thổi phồng +${thoiPhong} do đếm từ trùng)` : "")
    );
    if (!okDue) {
      loi.push(`${code}: số đến hạn RTDB(đã gộp)=${dueRtdb} ≠ Postgres=${duePg}`);
    }
  }

  console.log("-".repeat(74));
  console.log(`\nTổng: ${tongThe} thẻ, ${tongTienDo} dòng tiến độ ở Postgres.`);

  if (canh.length) {
    console.log(`\n⚠ ${canh.length} cảnh báo (không chặn):`);
    for (const c of canh.slice(0, 10)) console.log(`  ${c}`);
  }

  if (loi.length === 0) {
    console.log("\n✓ Đối chiếu từng từ: khớp 100%, không sai lệch nào.");
  } else {
    console.log(`\n✗ ${loi.length} sai lệch:`);
    for (const l of loi.slice(0, 30)) console.log(`  ${l}`);
    if (loi.length > 30) console.log(`  … còn ${loi.length - 30} dòng nữa`);
    process.exitCode = 1;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(process.exitCode ?? 0);
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
