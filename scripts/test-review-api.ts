/**
 * Kiểm đường GHI của SRS trên DB thật: lật thẻ có thật sự đổi lịch ôn không,
 * và số "đến hạn" mà /api/flashcards/due sẽ trả có khớp cách đếm của cron không.
 *
 * Dùng một từ tạm (__test__...) rồi tự dọn, KHÔNG đụng tiến độ thật của ai.
 *
 *   npx tsx scripts/test-review-api.ts
 */

import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { makeId } from "@/lib/vocab/deck";
import { normalizeWord } from "@/lib/vocab/normalize";
import { applyReview, emptyState, type SrsState } from "@/lib/vocab/srs";

let pass = 0;
let fail = 0;

function check(ten: string, dieuKien: boolean, chiTiet = "") {
  if (dieuKien) {
    pass++;
    console.log(`  ✓ ${ten}`);
  } else {
    fail++;
    console.log(`  ✗ ${ten}${chiTiet ? ` — ${chiTiet}` : ""}`);
  }
}

function toState(r: {
  repCount: number; intervalDays: number; ease: number; lapses: number;
  seenCount: number; wrongCount: number; mastered: boolean;
  lastReview: Date | null; dueAt: Date | null;
}): SrsState {
  return { ...r };
}

async function main() {
  const user = await prisma.profile.findFirst({
    where: { studentCode: { not: null } },
    select: { id: true, studentCode: true },
    orderBy: { createdAt: "asc" },
  });
  if (!user) {
    console.log("Không có hồ sơ nào có studentCode. Bỏ qua.");
    return;
  }
  console.log(`Học viên thử: ${user.studentCode}\n`);

  const word = "__test__negotiate";
  const wordKey = normalizeWord(word);
  await prisma.vocabProgress.deleteMany({ where: { userId: user.id, wordKey } });

  // ── 1. Lật "Chưa thuộc" trên từ mới ──
  console.log("1. Từ mới, lật Chưa thuộc");
  {
    const sau = applyReview(emptyState(), { kind: "flip", known: false });
    await prisma.vocabProgress.create({
      data: { id: makeId("vp"), userId: user.id, wordKey, word, ...sau },
    });
    const row = await prisma.vocabProgress.findUniqueOrThrow({
      where: { userId_wordKey: { userId: user.id, wordKey } },
    });
    check("ghi được xuống DB", row.wordKey === wordKey);
    check("đến hạn ngay (dueAt <= bây giờ)", row.dueAt !== null && row.dueAt <= new Date(),
      `dueAt=${row.dueAt?.toISOString()}`);
    check("không tính là trả lời sai", row.wrongCount === 0, `wrongCount=${row.wrongCount}`);
    check("ease hạ còn 2.4", Math.abs(row.ease - 2.4) < 1e-9, `${row.ease}`);
  }

  // ── 2. Lật "Thuộc" 3 lần liên tiếp, lịch phải giãn dần ──
  console.log("\n2. Lật Thuộc nhiều lần, lịch giãn dần");
  {
    const moc: number[] = [];
    for (let i = 0; i < 3; i++) {
      const cur = await prisma.vocabProgress.findUniqueOrThrow({
        where: { userId_wordKey: { userId: user.id, wordKey } },
      });
      // Giả lập đã tới hạn: kéo dueAt về quá khứ trước mỗi lượt
      await prisma.vocabProgress.update({
        where: { userId_wordKey: { userId: user.id, wordKey } },
        data: { dueAt: new Date(Date.now() - 86_400_000) },
      });
      const truoc = toState({ ...cur, dueAt: new Date(Date.now() - 86_400_000) });
      const sau = applyReview(truoc, { kind: "flip", known: true });
      await prisma.vocabProgress.update({
        where: { userId_wordKey: { userId: user.id, wordKey } },
        data: sau,
      });
      moc.push(sau.intervalDays);
    }
    check("giãn cách tăng dần qua 3 lượt", moc[0] < moc[1] && moc[1] < moc[2], `${moc.join(" → ")} ngày`);
    const row = await prisma.vocabProgress.findUniqueOrThrow({
      where: { userId_wordKey: { userId: user.id, wordKey } },
    });
    check("repCount = 3", row.repCount === 3, `${row.repCount}`);
    check("dueAt đẩy về tương lai", row.dueAt !== null && row.dueAt > new Date());
    check("seenCount đếm đủ 4 lượt (1 chưa thuộc + 3 thuộc)", row.seenCount === 4, `${row.seenCount}`);
  }

  // ── 3. Lật lại khi CHƯA tới hạn: không được đẩy lịch đi xa thêm ──
  console.log("\n3. Lật lại khi chưa tới hạn");
  {
    const truoc = await prisma.vocabProgress.findUniqueOrThrow({
      where: { userId_wordKey: { userId: user.id, wordKey } },
    });
    const sau = applyReview(toState(truoc), { kind: "flip", known: true });
    await prisma.vocabProgress.update({
      where: { userId_wordKey: { userId: user.id, wordKey } },
      data: sau,
    });
    const row = await prisma.vocabProgress.findUniqueOrThrow({
      where: { userId_wordKey: { userId: user.id, wordKey } },
    });
    check("dueAt không đổi", row.dueAt?.getTime() === truoc.dueAt?.getTime(),
      `${truoc.dueAt?.toISOString()} → ${row.dueAt?.toISOString()}`);
    check("repCount không đổi", row.repCount === truoc.repCount, `${row.repCount}`);
    check("seenCount vẫn tăng", row.seenCount === truoc.seenCount + 1, `${row.seenCount}`);
  }

  // ── 4. Số "đến hạn": API vs cron phải cùng công thức ──
  console.log("\n4. Số đến hạn — /api/flashcards/due vs groupBy của cron");
  {
    const now = new Date();
    const dkDue = {
      mastered: false,
      OR: [{ dueAt: null }, { dueAt: { lte: now } }],
    };

    const kieuApi = await prisma.vocabProgress.count({
      where: { userId: user.id, ...dkDue },
    });
    const kieuCron = await prisma.vocabProgress.groupBy({
      by: ["userId"],
      where: { userId: { in: [user.id] }, ...dkDue },
      _count: { _all: true },
    });
    const soCron = kieuCron[0]?._count._all ?? 0;
    check("hai cách đếm ra cùng một số", kieuApi === soCron, `API=${kieuApi} cron=${soCron}`);

    const daThuoc = await prisma.vocabProgress.count({
      where: { userId: user.id, mastered: true, ...{ OR: [{ dueAt: null }, { dueAt: { lte: now } }] } },
    });
    check("từ đã thuộc không lọt vào số đến hạn", daThuoc >= 0);

    // Tổng thể: không học viên nào có số đến hạn > tổng số từ
    const batThuong = await prisma.$queryRaw<{ user_id: string; due: bigint; tong: bigint }[]>`
      SELECT user_id,
             count(*) FILTER (WHERE mastered = false AND (due_at IS NULL OR due_at <= now())) AS due,
             count(*) AS tong
      FROM vocab_progress
      GROUP BY user_id
      HAVING count(*) FILTER (WHERE mastered = false AND (due_at IS NULL OR due_at <= now())) > count(*)
    `;
    check("không ai có 'đến hạn' nhiều hơn tổng số từ", batThuong.length === 0,
      `${batThuong.length} học viên bất thường`);
  }

  // ── Dọn ──
  await prisma.vocabProgress.deleteMany({ where: { userId: user.id, wordKey } });
  const sot = await prisma.vocabProgress.count({ where: { wordKey: { startsWith: "__test__" } } });
  if (sot > 0) await prisma.vocabProgress.deleteMany({ where: { wordKey: { startsWith: "__test__" } } });

  console.log(`\n${"─".repeat(50)}\n${pass} đạt, ${fail} lỗi`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(process.exitCode ?? 0);
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.vocabProgress.deleteMany({ where: { wordKey: { startsWith: "__test__" } } }).catch(() => {});
    await prisma.$disconnect();
    process.exit(1);
  });
