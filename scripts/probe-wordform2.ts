/**
 * Đo hướng thứ hai của dạng "chọn dạng từ": để AI sinh nhiễu THEO NGỮ CẢNH câu
 * (gồm cả dạng chia), rồi một lượt KIỂM CHÉO độc lập loại câu nhiều đáp án.
 *
 *   npx tsx scripts/probe-wordform2.ts [số thẻ]
 *
 * Hướng thứ nhất (probe-wordform.ts) ép 4 phương án phải khác loại từ, nhờ đó
 * luật tự đảm bảo chỉ một đáp án đúng — nhưng chỉ 8% thẻ đủ 4 loại.
 *
 * Hướng này phủ rộng hơn nhưng mất đảm bảo bằng luật, nên phải đo cho ra:
 *   1. Bao nhiêu thẻ AI sinh được 3 nhiễu cùng gốc?
 *   2. Trong đó bao nhiêu bị lượt kiểm chéo loại vì có hơn một đáp án đúng?
 *   3. Còn lại bao nhiêu — tức độ phủ THẬT sau khi đã lọc an toàn.
 *
 * Lượt kiểm chéo hỏi lại bằng câu hỏi KHÁC hẳn (đếm số phương án đúng), không
 * nhắc đáp án nào là đáp án, để model không chỉ gật theo lượt sinh.
 *
 * Script này KHÔNG ghi gì vào DB.
 */

import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db/prisma";
import { O_TRONG, taoChoTrong } from "@/lib/vocab/cloze";

const SO_THE = Number(process.argv[2] ?? 30);

interface De {
  word: string;
  de: string;
  dap: string;
}

function chuBiKhoet(goc: string, daKhoet: string): string | null {
  const a = goc.split(/\s+/);
  const b = daKhoet.split(/\s+/);
  if (a.length !== b.length) return null;
  for (let i = 0; i < a.length; i++) {
    if (b[i].includes(O_TRONG)) return a[i].replace(/[^a-zA-Z'-]/g, "");
  }
  return null;
}

function ai() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

/** Lượt 1: sinh 3 phương án nhiễu cùng gốc, hợp ngữ cảnh câu. */
async function sinhNhieu(lo: De[]): Promise<Map<number, string[]>> {
  const prompt = `Bạn đang soạn câu hỏi TOEIC Part 5 dạng chọn dạng từ.

Với mỗi câu dưới đây, đáp án đúng cho ô trống đã cho sẵn. Hãy cho 3 phương án NHIỄU.

${lo.map((d, i) => `${i + 1}. ${d.de}\n   đáp án đúng: ${d.dap}`).join("\n")}

Trả về DUY NHẤT một mảng JSON, mỗi phần tử ứng với một câu theo đúng thứ tự:
[{"n":1,"nhieu":["...","...","..."]}]

Quy tắc bắt buộc:
- Mỗi nhiễu phải CÙNG GỐC TỪ với đáp án (đổi loại từ hoặc đổi dạng chia)
- Mỗi nhiễu phải làm câu SAI NGỮ PHÁP khi đặt vào ô trống
- KHÔNG đưa phương án nào cũng đúng ngữ pháp như đáp án
- KHÔNG lặp lại đáp án đúng
- Đúng 3 nhiễu mỗi câu, không hơn không kém`;

  const res = await ai().models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  const raw = JSON.parse(res.text ?? "[]") as { n: number; nhieu: string[] }[];
  const ra = new Map<number, string[]>();
  if (raw.length === lo.length) raw.forEach((r, i) => ra.set(i, r?.nhieu ?? []));
  else for (const r of raw) if (typeof r?.n === "number") ra.set(r.n - 1, r.nhieu ?? []);
  return ra;
}

/**
 * Lượt 2: kiểm chéo. Hỏi "có BAO NHIÊU phương án đặt vào ô trống thì câu đúng
 * ngữ pháp", KHÔNG nói đáp án nào là đáp án — hỏi kiểu "đúng không?" thì model
 * gần như luôn gật.
 */
async function kiemCheo(
  lo: { de: string; pa: string[] }[]
): Promise<Map<number, { soDung: number; dung: string[] }>> {
  const prompt = `Bạn là giám khảo ngữ pháp tiếng Anh, rất khắt khe.

Với mỗi câu, xét TỪNG phương án: đặt nó vào ô trống thì câu có đúng ngữ pháp và tự nhiên không?

${lo.map((d, i) => `${i + 1}. ${d.de}\n   ${d.pa.map((p, j) => `${String.fromCharCode(65 + j)}. ${p}`).join("   ")}`).join("\n")}

Trả về DUY NHẤT một mảng JSON theo đúng thứ tự:
[{"n":1,"dung":["phương án làm câu đúng ngữ pháp","..."]}]

Quy tắc:
- "dung" liệt kê MỌI phương án khiến câu đúng ngữ pháp, có thể nhiều hơn một
- Chép lại nguyên văn chữ của phương án
- Đừng cố đoán phương án nào là đáp án ra đề — chỉ xét ngữ pháp`;

  const res = await ai().models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  const raw = JSON.parse(res.text ?? "[]") as { n: number; dung: string[] }[];
  const ra = new Map<number, { soDung: number; dung: string[] }>();
  // Khử trùng trước khi đếm: model hay liệt kê một phương án hai lần
  // ("implies, implies"), đếm thô thành 2 là loại oan câu hoàn toàn tốt.
  const dat = (i: number, d: string[]) => {
    const duy = [...new Set(d.map((x) => String(x ?? "").toLowerCase().trim()).filter(Boolean))];
    ra.set(i, { soDung: duy.length, dung: duy });
  };
  if (raw.length === lo.length) raw.forEach((r, i) => dat(i, r?.dung ?? []));
  else for (const r of raw) if (typeof r?.n === "number") dat(r.n - 1, r.dung ?? []);
  return ra;
}

async function main() {
  const the = await prisma.vocabCard.findMany({
    where: { example: { not: null } },
    select: { word: true, example: true },
    take: 600,
  });

  const theoTu = new Map<string, De>();
  for (const c of the) {
    const de = taoChoTrong(c.example!, c.word);
    if (!de) continue;
    const dap = chuBiKhoet(c.example!, de);
    if (!dap) continue;
    const k = c.word.toLowerCase();
    if (!theoTu.has(k)) theoTu.set(k, { word: c.word, de, dap });
  }
  const mau = [...theoTu.values()].slice(0, SO_THE);
  console.log(`${the.length} thẻ có ví dụ · lấy mẫu ${mau.length} thẻ khoét được\n`);

  let sinhDuoc = 0;
  let loaiViNhieuDapAn = 0;
  let loaiViNhieuXau = 0;
  let dat = 0;
  const vdDat: string[] = [];
  const vdLoai: string[] = [];

  for (let i = 0; i < mau.length; i += 15) {
    const lo = mau.slice(i, i + 15);
    process.stdout.write(`  lô ${i / 15 + 1}: sinh nhiễu…`);
    const nhieu = await sinhNhieu(lo);

    const deKiem: { de: string; pa: string[] }[] = [];
    const chiSo: number[] = [];
    lo.forEach((d, j) => {
      const n = (nhieu.get(j) ?? [])
        .map((x) => String(x ?? "").trim())
        .filter((x) => x && x.toLowerCase() !== d.dap.toLowerCase());
      const duy = [...new Set(n.map((x) => x.toLowerCase()))];
      if (duy.length !== 3) {
        loaiViNhieuXau++;
        return;
      }
      sinhDuoc++;
      deKiem.push({ de: d.de, pa: [d.dap, ...duy] });
      chiSo.push(j);
    });

    process.stdout.write(` kiểm chéo ${deKiem.length} câu…`);
    const kq = deKiem.length ? await kiemCheo(deKiem) : new Map();
    deKiem.forEach((k, j) => {
      const r = kq.get(j);
      const d = lo[chiSo[j]];
      if (!r || r.soDung !== 1) {
        loaiViNhieuDapAn++;
        if (vdLoai.length < 6) {
          vdLoai.push(`  ${k.de}\n    phương án: ${k.pa.join(" / ")}\n    giám khảo thấy ĐÚNG: ${r?.dung.join(", ") || "(không rõ)"}`);
        }
        return;
      }
      // Phải đúng một, VÀ cái đúng đó phải là đáp án ta định
      if (r.dung[0]?.toLowerCase().trim() !== d.dap.toLowerCase()) {
        loaiViNhieuDapAn++;
        if (vdLoai.length < 6) {
          vdLoai.push(`  ${k.de}\n    ta định "${d.dap}" nhưng giám khảo chọn "${r.dung[0]}"`);
        }
        return;
      }
      dat++;
      if (vdDat.length < 5) vdDat.push(`  ${k.de}\n    ${k.pa.join("  /  ")}   → ${d.dap}`);
    });
    console.log(" xong");
  }

  const pc = (n: number) => `${n}/${mau.length} (${Math.round((n / mau.length) * 100)}%)`;
  console.log(`\n${"─".repeat(60)}`);
  console.log(`AI sinh được 3 nhiễu     : ${pc(sinhDuoc)}  (hỏng: ${loaiViNhieuXau})`);
  console.log(`Bị kiểm chéo loại        : ${loaiViNhieuDapAn}`);
  console.log(`CÒN LẠI, DÙNG ĐƯỢC      : ${pc(dat)}`);

  console.log(`\nVí dụ câu dùng được:`);
  console.log(vdDat.join("\n") || "  (không có)");
  console.log(`\nVí dụ câu bị kiểm chéo loại:`);
  console.log(vdLoai.join("\n") || "  (không có)");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
