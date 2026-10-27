/**
 * Kiểm logic giao bộ thẻ ở tầng dữ liệu — phần mà giao diện giáo viên gọi tới.
 *
 *   npx tsx scripts/test-assignment.ts
 *
 * Dùng dữ liệu tạm (__test__) và tự dọn. Chỉ đụng DB, không gọi AI.
 */

import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { makeId, makeSlug } from "@/lib/vocab/deck";
import { normalizeWord } from "@/lib/vocab/normalize";

let pass = 0;
let fail = 0;
function check(ten: string, dk: boolean, ct = "") {
  if (dk) { pass++; console.log(`  ✓ ${ten}`); }
  else { fail++; console.log(`  ✗ ${ten}${ct ? ` — ${ct}` : ""}`); }
}

/** Bản sao công thức "xong" của route GET, để kiểm nó ra đúng số. */
function tinhTienDo(keys: string[], daOn: Set<string>, minScore: number) {
  const soDaOn = keys.filter((k) => daOn.has(k)).length;
  const pct = keys.length > 0 ? Math.round((soDaOn / keys.length) * 100) : 0;
  return { soDaOn, pct, done: pct >= minScore };
}

async function main() {
  const gv = await prisma.profile.findFirst({
    where: { OR: [{ role: "teacher" }, { role: "admin" }] },
    select: { id: true, role: true },
  });
  const hv = await prisma.profile.findFirst({
    where: { studentCode: { not: null } },
    select: { id: true, studentCode: true },
  });
  if (!gv || !hv) {
    console.log("Cần ít nhất 1 giáo viên/admin và 1 học viên. Bỏ qua.");
    return;
  }
  console.log(`Giáo viên: ${gv.role} · Học viên: ${hv.studentCode}\n`);

  const deckId = makeId("vd");
  const tu = ["__test__alpha", "__test__beta", "__test__gamma", "__test__delta"];

  // ── 1. Bộ của giáo viên, ban đầu private ──
  console.log("1. Giao bài tự bật chia sẻ");
  await prisma.vocabDeck.create({
    data: {
      id: deckId,
      ownerId: gv.id,
      title: "__test__ bộ giao bài",
      slug: makeSlug(),
      visibility: "private",
      cardCount: tu.length,
      cards: {
        create: tu.map((w, i) => ({
          id: makeId("vc"), word: w, wordKey: normalizeWord(w), order: i,
        })),
      },
    },
  });
  const truoc = await prisma.vocabDeck.findUniqueOrThrow({
    where: { id: deckId }, select: { visibility: true },
  });
  check("bộ bắt đầu ở trạng thái private", truoc.visibility === "private");

  // Mô phỏng đúng việc route POST làm
  await prisma.vocabDeck.update({ where: { id: deckId }, data: { visibility: "link" } });
  const asgId = makeId("va");
  await prisma.vocabDeckAssignment.create({
    data: {
      id: asgId, deckId, assignedBy: gv.id, studentCode: hv.studentCode!,
      activity: "study", minScore: 70, homeworkId: "hw__test__",
    },
  });
  const sau = await prisma.vocabDeck.findUniqueOrThrow({
    where: { id: deckId }, select: { visibility: true },
  });
  check("sau khi giao thì bộ đã bật chia sẻ", sau.visibility === "link",
    `vẫn là ${sau.visibility}`);

  // ── 2. Giao lại cùng bộ cho cùng học viên không tạo bản ghi thứ hai ──
  console.log("\n2. Giao lại không nhân đôi");
  await prisma.vocabDeckAssignment.upsert({
    where: { deckId_studentCode: { deckId, studentCode: hv.studentCode! } },
    create: {
      id: makeId("va"), deckId, assignedBy: gv.id, studentCode: hv.studentCode!,
      activity: "quiz", minScore: 80,
    },
    update: { activity: "quiz", minScore: 80 },
  });
  const dem = await prisma.vocabDeckAssignment.count({ where: { deckId } });
  check("vẫn chỉ 1 bản ghi", dem === 1, `có ${dem}`);
  const capNhat = await prisma.vocabDeckAssignment.findFirstOrThrow({ where: { deckId } });
  check("giá trị được cập nhật", capNhat.activity === "quiz" && capNhat.minScore === 80);

  // ── 3. Tiến độ: 0 → dưới ngưỡng → đạt ngưỡng ──
  console.log("\n3. Tính tiến độ và mốc 'xong'");
  const keys = tu.map(normalizeWord);
  check("chưa ôn gì → 0%, chưa xong", (() => {
    const r = tinhTienDo(keys, new Set(), 70);
    return r.pct === 0 && !r.done;
  })());

  // Ôn 2/4 từ
  for (const w of tu.slice(0, 2)) {
    await prisma.vocabProgress.upsert({
      where: { userId_wordKey: { userId: hv.id, wordKey: normalizeWord(w) } },
      create: { id: makeId("vp"), userId: hv.id, wordKey: normalizeWord(w), word: w, repCount: 1 },
      update: { repCount: 1 },
    });
  }
  let daOn = new Set(
    (await prisma.vocabProgress.findMany({
      where: { userId: hv.id, repCount: { gt: 0 }, wordKey: { in: keys } },
      select: { wordKey: true },
    })).map((x) => x.wordKey)
  );
  let r = tinhTienDo(keys, daOn, 70);
  check("ôn 2/4 → 50%, chưa đạt ngưỡng 70%", r.pct === 50 && !r.done, `${r.pct}% done=${r.done}`);

  // Ôn nốt
  for (const w of tu.slice(2)) {
    await prisma.vocabProgress.upsert({
      where: { userId_wordKey: { userId: hv.id, wordKey: normalizeWord(w) } },
      create: { id: makeId("vp"), userId: hv.id, wordKey: normalizeWord(w), word: w, repCount: 1 },
      update: { repCount: 1 },
    });
  }
  daOn = new Set(
    (await prisma.vocabProgress.findMany({
      where: { userId: hv.id, repCount: { gt: 0 }, wordKey: { in: keys } },
      select: { wordKey: true },
    })).map((x) => x.wordKey)
  );
  r = tinhTienDo(keys, daOn, 70);
  check("ôn 4/4 → 100%, đã xong", r.pct === 100 && r.done, `${r.pct}% done=${r.done}`);

  // ── 4. Từ có tiến độ nhưng repCount = 0 không được tính là đã ôn ──
  console.log("\n4. repCount 0 không tính là đã ôn");
  await prisma.vocabProgress.update({
    where: { userId_wordKey: { userId: hv.id, wordKey: normalizeWord(tu[0]) } },
    data: { repCount: 0 },
  });
  const daOn2 = new Set(
    (await prisma.vocabProgress.findMany({
      where: { userId: hv.id, repCount: { gt: 0 }, wordKey: { in: keys } },
      select: { wordKey: true },
    })).map((x) => x.wordKey)
  );
  const r2 = tinhTienDo(keys, daOn2, 70);
  check("còn 3/4 → 75%", r2.pct === 75, `${r2.pct}%`);

  // ── 5. Xoá bộ thì assignment đi theo ──
  console.log("\n5. Xoá bộ kéo theo assignment");
  await prisma.vocabDeck.delete({ where: { id: deckId } });
  const conLai = await prisma.vocabDeckAssignment.count({ where: { deckId } });
  check("assignment bị xoá theo (cascade)", conLai === 0, `còn ${conLai}`);

  // ── Dọn ──
  await prisma.vocabProgress.deleteMany({ where: { wordKey: { startsWith: "__test__" } } });
  await prisma.vocabDeck.deleteMany({ where: { title: { startsWith: "__test__" } } });

  console.log(`\n${"─".repeat(50)}\n${pass} đạt, ${fail} lỗi`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .then(async () => { await prisma.$disconnect(); process.exit(process.exitCode ?? 0); })
  .catch(async (e) => {
    console.error(e);
    await prisma.vocabProgress.deleteMany({ where: { wordKey: { startsWith: "__test__" } } }).catch(() => {});
    await prisma.vocabDeck.deleteMany({ where: { title: { startsWith: "__test__" } } }).catch(() => {});
    await prisma.$disconnect();
    process.exit(1);
  });
