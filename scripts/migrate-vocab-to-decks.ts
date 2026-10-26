/**
 * Chuyển kho từ RTDB `vocab/{studentCode}` sang Postgres theo mô hình bộ thẻ.
 *
 * Mỗi học viên: nhóm từ theo Part 1-7 (không có part → nhóm "Khác"), mỗi nhóm
 * thành một VocabDeck `source = "migrated"`. Mỗi từ thành một VocabCard, và
 * repCount/lastReview chuyển sang VocabProgress (khoá theo từ, nên từ trùng ở
 * nhiều Part chỉ còn MỘT tiến độ — lấy repCount lớn nhất).
 *
 *   npx tsx scripts/migrate-vocab-to-decks.ts --dry-run    # chỉ in báo cáo
 *   npx tsx scripts/migrate-vocab-to-decks.ts              # ghi thật
 *   npx tsx scripts/migrate-vocab-to-decks.ts --only=0363709105
 *
 * Chạy lại được: học viên nào đã có bộ `migrated` thì bỏ qua (trừ khi --force).
 * KHÔNG xoá gì trên RTDB — nhánh cũ giữ nguyên để rollback.
 */

import "dotenv/config";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { normalizeWord } from "@/lib/vocab/normalize";
import { intervalFor, MASTERY_THRESHOLD } from "@/lib/vocab/srs";
import type { VocabWord } from "@/lib/firebase/types";

type W = Omit<VocabWord, "id">;

const DRY = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice(7);

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function slug(len = 10): string {
  const b = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += B58[b[i] % B58.length];
  return s;
}

/** Dời `days` ngày từ YYYY-MM-DD, trả về Date ở 00:00 UTC. */
function dayPlus(dateStr: string, days: number): Date | null {
  const d = new Date(dateStr + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function partLabel(part: number | null): string {
  return part === null ? "Từ vựng khác" : `Từ vựng Part ${part}`;
}

async function main() {
  console.log(DRY ? "── DRY RUN — không ghi gì ──\n" : "── GHI THẬT ──\n");

  // 1. Kho từ trên RTDB
  const snap = await getAdminDb().ref("vocab").get();
  if (!snap.exists()) {
    console.log("RTDB vocab/ rỗng — không có gì để chuyển.");
    return;
  }
  const raw = snap.val() as Record<string, Record<string, W> | null>;

  // 2. studentCode → Profile.id
  const codes = Object.keys(raw).filter((c) => (ONLY ? c === ONLY : true));
  const profiles = await prisma.profile.findMany({
    where: { studentCode: { in: codes } },
    select: { id: true, studentCode: true, displayName: true },
  });
  const byCode = new Map(profiles.map((p) => [p.studentCode!, p]));

  const report = {
    hvTongCong: codes.length,
    hvKhongMapDuoc: [] as string[],
    hvBoQua: [] as string[],
    hvDaChuyen: 0,
    boThe: 0,
    the: 0,
    tienDo: 0,
    tuTrungPart: 0,
    tuTrungTrongBo: 0,
    tuBoVi: { khongCoWord: 0, lastReviewLoi: 0 },
  };

  for (const code of codes) {
    const words = Object.values(raw[code] ?? {}).filter(
      (w): w is W => !!w && typeof w.word === "string" && w.word.trim() !== ""
    );
    const skipped = Object.values(raw[code] ?? {}).length - words.length;
    report.tuBoVi.khongCoWord += skipped;

    if (words.length === 0) continue;

    const profile = byCode.get(code);
    if (!profile) {
      report.hvKhongMapDuoc.push(`${code} (${words.length} từ)`);
      continue;
    }

    if (!FORCE) {
      const existing = await prisma.vocabDeck.count({
        where: { ownerId: profile.id, source: "migrated" },
      });
      if (existing > 0) {
        report.hvBoQua.push(`${code} (đã có ${existing} bộ migrated)`);
        continue;
      }
    }

    // ── Nhóm theo Part ──
    const groups = new Map<number | null, W[]>();
    for (const w of words) {
      const p = typeof w.part === "number" && w.part >= 1 && w.part <= 7 ? w.part : null;
      const arr = groups.get(p) ?? [];
      arr.push(w);
      groups.set(p, arr);
    }

    // ── Tiến độ gộp theo TỪ: từ trùng ở nhiều Part lấy repCount lớn nhất ──
    const progressByKey = new Map<string, { word: string; repCount: number; lastReview?: string }>();
    for (const w of words) {
      const key = normalizeWord(w.word);
      const rep = w.repCount ?? 0;
      const prev = progressByKey.get(key);
      if (!prev) {
        progressByKey.set(key, { word: w.word.trim(), repCount: rep, lastReview: w.lastReview });
      } else {
        report.tuTrungPart++;
        if (rep > prev.repCount) {
          prev.repCount = rep;
          prev.lastReview = w.lastReview;
        }
      }
    }

    const orderedParts = [1, 2, 3, 4, 5, 6, 7, null as number | null].filter((p) =>
      groups.has(p)
    );

    // Dựng sẵn danh sách thẻ của từng bộ — dùng cho CẢ dry-run và lần ghi thật,
    // để số trong báo cáo đúng bằng số sẽ ghi (word_key không trùng trong một bộ).
    const decks = orderedParts.map((part) => {
      const seen = new Set<string>();
      const cards = groups
        .get(part)!
        .filter((w) => {
          const k = normalizeWord(w.word);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        })
        .map((w, i) => ({
          id: `vc_${slug(16)}`,
          word: w.word.trim(),
          wordKey: normalizeWord(w.word),
          ipa: w.ipa ?? null,
          pos: w.pos ?? null,
          meaningVi: w.vi ?? null,
          definition: w.def ?? null,
          example: w.example ?? null,
          audioUrl: w.audioUrl ?? null,
          order: i,
        }));
      return { part, cards };
    });

    const soThe = decks.reduce((n, d) => n + d.cards.length, 0);
    const trungTrongBo = words.length - soThe;
    report.tuTrungTrongBo += trungTrongBo;

    if (DRY) {
      const parts = decks
        .map((d) => `${d.part === null ? "Khác" : `P${d.part}`}:${d.cards.length}`)
        .join(" ");
      console.log(
        `${code.padEnd(11)} ${String(words.length).padStart(4)} từ → ` +
          `${decks.length} bộ, ${String(soThe).padStart(4)} thẻ  [${parts}]` +
          `  tiến độ:${progressByKey.size}` +
          (trungTrongBo > 0 ? `  (bỏ ${trungTrongBo} trùng)` : "") +
          (profile.displayName ? `  — ${profile.displayName}` : "")
      );
      report.hvDaChuyen++;
      report.boThe += decks.length;
      report.the += soThe;
      report.tienDo += progressByKey.size;
      continue;
    }

    // ── Ghi thật, mỗi học viên một transaction ──
    await prisma.$transaction(async (tx) => {
      for (const { part, cards } of decks) {
        await tx.vocabDeck.create({
          data: {
            id: `vd_${slug(16)}`,
            ownerId: profile.id,
            title: partLabel(part),
            description: `Chuyển từ sổ từ vựng cũ · ${cards.length} từ`,
            slug: slug(10),
            visibility: "private",
            source: "migrated",
            part: part ?? undefined,
            cardCount: cards.length,
            cards: { create: cards },
          },
        });
        report.boThe++;
        report.the += cards.length;
      }

      for (const [wordKey, p] of progressByKey) {
        const repCount = p.repCount;
        const intervalDays = intervalFor(repCount);
        let lastReview: Date | null = null;
        let dueAt: Date | null = new Date(); // chưa ôn lần nào → đến hạn ngay

        if (p.lastReview) {
          const lr = new Date(p.lastReview + "T00:00:00Z");
          if (Number.isNaN(lr.getTime())) {
            report.tuBoVi.lastReviewLoi++;
          } else {
            lastReview = lr;
            dueAt = dayPlus(p.lastReview, intervalDays);
          }
        }

        await tx.vocabProgress.upsert({
          where: { userId_wordKey: { userId: profile.id, wordKey } },
          create: {
            id: `vp_${slug(16)}`,
            userId: profile.id,
            wordKey,
            word: p.word,
            repCount,
            intervalDays,
            ease: 2.5,
            seenCount: repCount,
            mastered: repCount >= MASTERY_THRESHOLD,
            lastReview,
            dueAt,
          },
          update: {
            repCount,
            intervalDays,
            mastered: repCount >= MASTERY_THRESHOLD,
            lastReview,
            dueAt,
          },
        });
        report.tienDo++;
      }
    }, { timeout: 60_000 });

    report.hvDaChuyen++;
    console.log(
      `✓ ${code.padEnd(11)} ${String(words.length).padStart(4)} từ → ` +
        `${decks.length} bộ, ${soThe} thẻ, ${progressByKey.size} tiến độ`
    );
  }

  // ── Báo cáo ──
  console.log("\n" + "─".repeat(64));
  console.log(`Học viên có kho từ      : ${report.hvTongCong}`);
  console.log(`Đã chuyển               : ${report.hvDaChuyen}`);
  console.log(`Bộ thẻ tạo ra           : ${report.boThe}`);
  console.log(`Thẻ tạo ra              : ${report.the}`);
  console.log(`Dòng tiến độ            : ${report.tienDo}`);
  console.log(`Từ trùng toàn kho       : ${report.tuTrungPart} (gộp còn 1 tiến độ, lấy repCount lớn nhất)`);
  console.log(`  ↳ trùng trong cùng 1 bộ: ${report.tuTrungTrongBo} (bỏ bản sau, giữ bản đầu)`);
  console.log(`  ↳ trùng vắt qua 2 Part : ${report.tuTrungPart - report.tuTrungTrongBo} (giữ cả 2 thẻ, dùng chung 1 tiến độ)`);
  if (report.tuBoVi.khongCoWord > 0)
    console.log(`Bản ghi bỏ (thiếu word) : ${report.tuBoVi.khongCoWord}`);
  if (report.tuBoVi.lastReviewLoi > 0)
    console.log(`lastReview không đọc được: ${report.tuBoVi.lastReviewLoi}`);
  if (report.hvBoQua.length)
    console.log(`\nBỏ qua (đã migrate, dùng --force để làm lại):\n  ${report.hvBoQua.join("\n  ")}`);
  if (report.hvKhongMapDuoc.length)
    console.log(
      `\n⚠ Không map được studentCode sang Profile (từ của họ CHƯA được chuyển):\n  ` +
        report.hvKhongMapDuoc.join("\n  ")
    );
  console.log("─".repeat(64));
  if (DRY) console.log("\nChạy lại không có --dry-run để ghi thật.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
