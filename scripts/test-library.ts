/**
 * Kiểm thư viện bộ mẫu và việc lấy bộ về kho riêng.
 *
 *   npx tsx scripts/test-library.ts
 *
 * Dùng dữ liệu tạm (__test__) trên DB thật rồi tự dọn.
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

async function don() {
  await prisma.vocabDeck.deleteMany({ where: { title: { startsWith: "__test__" } } });
  await prisma.vocabProgress.deleteMany({ where: { wordKey: { startsWith: "__test__" } } });
}

async function main() {
  const gv = await prisma.profile.findFirst({
    where: { OR: [{ role: "teacher" }, { role: "admin" }] },
    select: { id: true, role: true },
  });
  const hv = await prisma.profile.findFirst({
    where: { studentCode: { not: null }, role: "student" },
    select: { id: true, studentCode: true },
  });
  if (!gv || !hv) {
    console.log("Cần 1 giáo viên/admin và 1 học viên (role=student). Bỏ qua.");
    return;
  }
  await don();
  console.log(`Giáo viên: ${gv.role} · Học viên: ${hv.studentCode}\n`);

  const tu = ["__test__lib_a", "__test__lib_b", "__test__lib_c", "__test__lib_d"];
  const gocId = makeId("vd");

  // ── 1. Bộ mẫu của thầy ──
  console.log("1. Bộ trong thư viện");
  await prisma.vocabDeck.create({
    data: {
      id: gocId, ownerId: gv.id, title: "__test__ bộ mẫu Part 5",
      description: "mô tả gốc", slug: makeSlug(), visibility: "library",
      part: 5, cardCount: tu.length,
      cards: {
        create: tu.map((w, i) => ({
          id: makeId("vc"), word: w, wordKey: normalizeWord(w),
          meaningVi: `nghĩa ${w}`, order: i,
        })),
      },
    },
  });
  const trongTV = await prisma.vocabDeck.count({ where: { visibility: "library", id: gocId } });
  check("bộ nằm trong thư viện", trongTV === 1);

  // ── 2. Học viên đã học sẵn 2 từ trong bộ đó ──
  console.log("\n2. Học viên đã học sẵn 2/4 từ");
  for (const w of tu.slice(0, 2)) {
    await prisma.vocabProgress.create({
      data: {
        id: makeId("vp"), userId: hv.id, wordKey: normalizeWord(w), word: w,
        repCount: 5, intervalDays: 14,
      },
    });
  }
  const khoa = tu.map(normalizeWord);
  const daHoc = await prisma.vocabProgress.count({
    where: { userId: hv.id, wordKey: { in: khoa }, repCount: { gt: 0 } },
  });
  check("đếm đúng 2 từ đã học trong bộ", daHoc === 2, `${daHoc}`);

  // ── 3. Lấy bộ về: nhân bản thành bộ riêng ──
  console.log("\n3. Lấy bộ về kho riêng");
  const goc = await prisma.vocabDeck.findUniqueOrThrow({
    where: { id: gocId },
    select: { title: true, description: true, part: true, cards: { orderBy: { order: "asc" },
      select: { word: true, wordKey: true, ipa: true, pos: true, meaningVi: true,
        definition: true, example: true, imageUrl: true, audioUrl: true, order: true } } },
  });
  const banSao = await prisma.vocabDeck.create({
    data: {
      id: makeId("vd"), ownerId: hv.id, title: goc.title, description: goc.description,
      slug: makeSlug(), visibility: "private", source: "manual",
      part: goc.part ?? undefined, clonedFrom: gocId, cardCount: goc.cards.length,
      cards: { create: goc.cards.map((c, i) => ({ id: makeId("vc"), ...c, order: i })) },
    },
    select: { id: true, ownerId: true, visibility: true, clonedFrom: true, cardCount: true },
  });
  check("bản sao thuộc về học viên", banSao.ownerId === hv.id);
  check("bản sao để ở chế độ riêng tư", banSao.visibility === "private");
  check("bản sao ghi nguồn clonedFrom", banSao.clonedFrom === gocId);
  check("chép đủ 4 thẻ", banSao.cardCount === 4, `${banSao.cardCount}`);

  // ── 4. TIẾN ĐỘ KHÔNG MẤT — lời hứa chính của mô hình ──
  console.log("\n4. Tiến độ giữ nguyên sau khi lấy bộ");
  const sau = await prisma.vocabProgress.findMany({
    where: { userId: hv.id, wordKey: { in: khoa } },
    select: { wordKey: true, repCount: true },
    orderBy: { wordKey: "asc" },
  });
  check("vẫn đúng 2 dòng tiến độ, không đẻ thêm", sau.length === 2, `${sau.length}`);
  check("repCount giữ nguyên 5", sau.every((p) => p.repCount === 5),
    sau.map((p) => `${p.wordKey}=${p.repCount}`).join(","));

  // ── 5. Sửa bản sao không đụng bộ gốc ──
  console.log("\n5. Sửa bản sao không ảnh hưởng bộ gốc");
  await prisma.vocabCard.updateMany({
    where: { deckId: banSao.id, wordKey: normalizeWord(tu[0]) },
    data: { meaningVi: "NGHĨA HỌC VIÊN TỰ SỬA" },
  });
  const theGoc = await prisma.vocabCard.findFirstOrThrow({
    where: { deckId: gocId, wordKey: normalizeWord(tu[0]) },
    select: { meaningVi: true },
  });
  check("nghĩa trong bộ gốc không đổi", theGoc.meaningVi === `nghĩa ${tu[0]}`,
    `"${theGoc.meaningVi}"`);

  // ── 6. Không lấy hai lần ──
  console.log("\n6. Không tạo hai bản sao của cùng một bộ");
  const daCo = await prisma.vocabDeck.findFirst({
    where: { ownerId: hv.id, clonedFrom: gocId }, select: { id: true },
  });
  check("tìm được bản sao có sẵn để trả về", daCo?.id === banSao.id);
  const soBanSao = await prisma.vocabDeck.count({ where: { ownerId: hv.id, clonedFrom: gocId } });
  check("chỉ có đúng 1 bản sao", soBanSao === 1, `${soBanSao}`);

  // ── 7. Gỡ khỏi thư viện thì học viên không thấy nữa ──
  console.log("\n7. Gỡ khỏi thư viện");
  await prisma.vocabDeck.update({ where: { id: gocId }, data: { visibility: "link" } });
  const conTrongTV = await prisma.vocabDeck.count({ where: { id: gocId, visibility: "library" } });
  check("bộ biến khỏi thư viện", conTrongTV === 0);
  const banSaoVanCon = await prisma.vocabDeck.count({ where: { id: banSao.id } });
  check("bản sao học viên đã lấy vẫn còn", banSaoVanCon === 1);

  await don();
  console.log(`\n${"─".repeat(50)}\n${pass} đạt, ${fail} lỗi`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .then(async () => { await prisma.$disconnect(); process.exit(process.exitCode ?? 0); })
  .catch(async (e) => {
    console.error(e);
    await don().catch(() => {});
    await prisma.$disconnect();
    process.exit(1);
  });
