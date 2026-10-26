/**
 * Kiểm chứng tầng dữ liệu của API bộ thẻ, trên DB thật nhưng bằng dữ liệu tạm
 * (tiền tố __test__) và tự dọn sạch ở cuối.
 *
 * Kiểm 5 điều:
 *   1. Tạo bộ kèm thẻ, cardCount khớp số thẻ
 *   2. Bộ của người khác → findFirst trả null (API sẽ ra 404, không rò tồn tại)
 *   3. PATCH/DELETE của người khác → count 0, dữ liệu không đổi
 *   4. Thay trọn danh sách thẻ (PUT cards) giữ nguyên TIẾN ĐỘ theo từ
 *   5. Xoá bộ thì thẻ mất theo nhưng tiến độ ôn vẫn còn
 *
 *   npx tsx scripts/test-deck-api.ts
 */

import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { makeId, makeSlug, prepareCards } from "@/lib/vocab/deck";
import { normalizeWord } from "@/lib/vocab/normalize";

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

async function main() {
  const users = await prisma.profile.findMany({
    where: { studentCode: { not: null } },
    select: { id: true, studentCode: true },
    take: 2,
    orderBy: { createdAt: "asc" },
  });
  if (users.length < 2) {
    console.log("Cần ít nhất 2 hồ sơ có studentCode để kiểm cách ly. Bỏ qua.");
    return;
  }
  const [A, B] = users;
  console.log(`Người A: ${A.studentCode}   Người B: ${B.studentCode}\n`);

  const deckId = makeId("vd");
  const TITLE = "__test__ bộ thẻ tạm";

  // ── 1. Tạo bộ kèm thẻ ──
  console.log("1. Tạo bộ kèm thẻ");
  const { rows, duplicates } = prepareCards([
    { word: "Negotiate", meaningVi: "đàm phán" },
    { word: "deadline", meaningVi: "hạn chót" },
    { word: "  NEGOTIATE  ", meaningVi: "trùng, phải bị bỏ" },
  ]);
  check("bỏ đúng 1 thẻ trùng (chuẩn hoá hoa/thường + khoảng trắng)", duplicates.length === 1,
    `bỏ ${duplicates.length}: ${duplicates.join(", ")}`);
  check("còn 2 thẻ", rows.length === 2, `có ${rows.length}`);

  await prisma.vocabDeck.create({
    data: {
      id: deckId,
      ownerId: A.id,
      title: TITLE,
      slug: makeSlug(),
      source: "manual",
      cardCount: rows.length,
      cards: { create: rows },
    },
  });
  const deck1 = await prisma.vocabDeck.findUnique({
    where: { id: deckId },
    include: { cards: true },
  });
  check("cardCount khớp số thẻ thật", deck1?.cardCount === deck1?.cards.length,
    `${deck1?.cardCount} vs ${deck1?.cards.length}`);
  check("wordKey đã chuẩn hoá", deck1?.cards.every((c) => c.wordKey === normalizeWord(c.word)) === true);

  // ── 2 + 3. Cách ly theo chủ sở hữu ──
  console.log("\n2. Người B không thấy bộ của A");
  const bThay = await prisma.vocabDeck.findFirst({ where: { id: deckId, ownerId: B.id } });
  check("findFirst của B trả null (API → 404)", bThay === null);

  console.log("\n3. Người B không sửa/xoá được bộ của A");
  const patchB = await prisma.vocabDeck.updateMany({
    where: { id: deckId, ownerId: B.id },
    data: { title: "BỊ CHIẾM" },
  });
  check("updateMany của B đổi 0 dòng", patchB.count === 0, `đổi ${patchB.count}`);
  const sauPatch = await prisma.vocabDeck.findUnique({ where: { id: deckId }, select: { title: true } });
  check("tiêu đề không bị đổi", sauPatch?.title === TITLE, `giờ là "${sauPatch?.title}"`);

  const delB = await prisma.vocabDeck.deleteMany({ where: { id: deckId, ownerId: B.id } });
  check("deleteMany của B xoá 0 dòng", delB.count === 0, `xoá ${delB.count}`);
  check("bộ vẫn còn", (await prisma.vocabDeck.count({ where: { id: deckId } })) === 1);

  // ── 4. Thay trọn danh sách thẻ, tiến độ phải sống ──
  console.log("\n4. Thay trọn danh sách thẻ — tiến độ theo từ phải sống");
  const progId = makeId("vp");
  const key = normalizeWord("negotiate");
  const daCo = await prisma.vocabProgress.findUnique({
    where: { userId_wordKey: { userId: A.id, wordKey: key } },
  });
  if (!daCo) {
    await prisma.vocabProgress.create({
      data: { id: progId, userId: A.id, wordKey: key, word: "negotiate", repCount: 4, intervalDays: 14 },
    });
  }

  const moi = prepareCards([{ word: "negotiate", meaningVi: "đàm phán (đã sửa)" }]);
  await prisma.$transaction([
    prisma.vocabCard.deleteMany({ where: { deckId } }),
    prisma.vocabCard.createMany({ data: moi.rows.map((r) => ({ ...r, deckId })) }),
    prisma.vocabDeck.update({ where: { id: deckId }, data: { cardCount: moi.rows.length } }),
  ]);
  const sauPut = await prisma.vocabDeck.findUnique({
    where: { id: deckId },
    include: { cards: true },
  });
  check("còn 1 thẻ sau khi thay", sauPut?.cards.length === 1, `có ${sauPut?.cards.length}`);
  check("cardCount cập nhật theo", sauPut?.cardCount === 1, `${sauPut?.cardCount}`);
  const tdSauPut = await prisma.vocabProgress.findUnique({
    where: { userId_wordKey: { userId: A.id, wordKey: key } },
    select: { repCount: true },
  });
  check("tiến độ của 'negotiate' còn nguyên", tdSauPut !== null && tdSauPut.repCount >= 4,
    `repCount=${tdSauPut?.repCount}`);

  // ── 5. Xoá bộ: thẻ mất, tiến độ còn ──
  console.log("\n5. Xoá bộ — thẻ mất theo, tiến độ ôn giữ lại");
  const delA = await prisma.vocabDeck.deleteMany({ where: { id: deckId, ownerId: A.id } });
  check("chủ sở hữu xoá được", delA.count === 1);
  check("thẻ bị xoá theo (cascade)", (await prisma.vocabCard.count({ where: { deckId } })) === 0);
  const tdCuoi = await prisma.vocabProgress.findUnique({
    where: { userId_wordKey: { userId: A.id, wordKey: key } },
    select: { repCount: true },
  });
  check("tiến độ ôn KHÔNG mất khi xoá bộ", tdCuoi !== null, "mất rồi");

  // ── Dọn ──
  if (!daCo) {
    await prisma.vocabProgress.deleteMany({ where: { userId: A.id, wordKey: key, id: progId } });
  }
  const con = await prisma.vocabDeck.count({ where: { title: { startsWith: "__test__" } } });
  if (con > 0) {
    await prisma.vocabDeck.deleteMany({ where: { title: { startsWith: "__test__" } } });
    console.log(`\n(dọn thêm ${con} bộ __test__ còn sót)`);
  }

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
    await prisma.vocabDeck.deleteMany({ where: { title: { startsWith: "__test__" } } }).catch(() => {});
    await prisma.$disconnect();
    process.exit(1);
  });
