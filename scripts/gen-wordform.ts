/**
 * Sinh bộ phương án cho dạng quiz "chọn dạng từ", lưu vào vocab_word_forms.
 *
 *   npx tsx scripts/gen-wordform.ts            # thử, KHÔNG ghi
 *   npx tsx scripts/gen-wordform.ts --ghi      # ghi thật
 *   npx tsx scripts/gen-wordform.ts --ghi 50   # chỉ làm 50 câu đầu còn thiếu
 *
 * Chạy lại nhiều lần được: câu nào đã có trong bảng thì bỏ qua, kể cả câu đã
 * bị học viên báo sai (status != "ok") — không sinh đè lên để khỏi dựng lại
 * đúng cái câu thầy vừa bỏ.
 */

import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { bamViDu, dungDe, soanLo, type DeKhoet, type LyDoLoai } from "@/lib/vocab/wordform";

const GHI = process.argv.includes("--ghi");
const TRAN = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 0);
const CO_LO = 12;

async function main() {
  const the = await prisma.vocabCard.findMany({
    where: { example: { not: null } },
    select: { word: true, wordKey: true, example: true },
  });

  // Một câu ví dụ lặp ở nhiều bộ của nhiều học viên — soạn một lần dùng chung
  const duy = new Map<string, DeKhoet>();
  let khongKhoetDuoc = 0;
  for (const c of the) {
    const de = dungDe(c);
    if (!de) {
      khongKhoetDuoc++;
      continue;
    }
    const k = `${de.wordKey}|${bamViDu(de.example)}`;
    if (!duy.has(k)) duy.set(k, de);
  }

  const daCo = await prisma.vocabWordForm.findMany({ select: { wordKey: true, exampleHash: true } });
  const coSan = new Set(daCo.map((d) => `${d.wordKey}|${d.exampleHash}`));
  let canLam = [...duy.entries()].filter(([k]) => !coSan.has(k)).map(([, v]) => v);
  if (TRAN > 0) canLam = canLam.slice(0, TRAN);

  console.log(`${the.length} thẻ có ví dụ`);
  console.log(`  ${khongKhoetDuoc} thẻ không khoét lỗ được`);
  console.log(`  ${duy.size} câu khác nhau · ${coSan.size} câu đã có sẵn trong bảng`);
  console.log(`  → cần soạn ${canLam.length} câu${GHI ? "" : "  (CHẠY THỬ, không ghi)"}\n`);
  if (canLam.length === 0) return;

  const dem: Record<LyDoLoai, number> = {
    "khong-khoet-duoc": khongKhoetDuoc,
    "ai-khong-sinh-duoc": 0,
    "nhieu-dap-an": 0,
    "lech-dap-an": 0,
  };
  let daGhi = 0;
  const viDuLoai: string[] = [];

  for (let i = 0; i < canLam.length; i += CO_LO) {
    const lo = canLam.slice(i, i + CO_LO);
    const so = `${Math.floor(i / CO_LO) + 1}/${Math.ceil(canLam.length / CO_LO)}`;
    process.stdout.write(`  lô ${so} (${lo.length} câu)…`);

    let kq;
    try {
      kq = await soanLo(lo);
    } catch (e) {
      console.log(` LỖI: ${e instanceof Error ? e.message : e}`);
      continue;
    }
    for (const l of kq.loai) {
      dem[l.vi]++;
      if (viDuLoai.length < 8) viDuLoai.push(`  [${l.vi}] ${l.de.cloze}\n      ${l.chiTiet ?? ""}`);
    }

    if (GHI && kq.dat.length > 0) {
      const r = await prisma.vocabWordForm.createMany({
        data: kq.dat.map((d) => ({
          wordKey: d.wordKey,
          exampleHash: d.exampleHash,
          cloze: d.cloze,
          answer: d.answer,
          distractors: d.distractors,
        })),
        skipDuplicates: true,
      });
      daGhi += r.count;
    } else {
      daGhi += kq.dat.length;
    }
    console.log(` ${kq.dat.length} đạt, ${kq.loai.length} loại`);
  }

  const pc = (n: number) => `${n} (${Math.round((n / canLam.length) * 100)}%)`;
  console.log(`\n${"─".repeat(56)}`);
  console.log(`AI không sinh nổi 3 nhiễu : ${pc(dem["ai-khong-sinh-duoc"])}`);
  console.log(`Kiểm chéo thấy >1 đáp án  : ${pc(dem["nhieu-dap-an"])}`);
  console.log(`Kiểm chéo chọn khác đáp án: ${pc(dem["lech-dap-an"])}`);
  console.log(`${GHI ? "ĐÃ GHI" : "SẼ GHI"}                    : ${pc(daGhi)}`);

  if (viDuLoai.length) console.log(`\nVí dụ câu bị loại:\n${viDuLoai.join("\n")}`);

  if (GHI) {
    const tong = await prisma.vocabWordForm.count({ where: { status: "ok" } });
    console.log(`\nTổng trong bảng (status=ok): ${tong}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
