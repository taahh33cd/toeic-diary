/**
 * Đo tính khả thi của dạng quiz "chọn dạng từ" TRƯỚC khi xây.
 *
 *   npx tsx scripts/probe-wordform.ts [số từ]
 *
 * Câu hỏi cần trả lời bằng số, không bằng cảm tính:
 *   1. Gemini có trả về họ từ dùng được không (đủ 4 loại từ khác nhau)?
 *   2. Chữ BỊ KHOÉT trong câu ví dụ có nằm trong họ từ đó không? Nếu không
 *      thì không biết đáp án đúng là dạng nào — phải bỏ thẻ.
 *   3. Rốt cuộc bao nhiêu % thẻ ra được câu hỏi hợp lệ?
 *
 * Script này KHÔNG ghi gì vào DB.
 */

import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db/prisma";
import { O_TRONG, taoChoTrong } from "@/lib/vocab/cloze";

const SO_TU = Number(process.argv[2] ?? 40);
const LOAI = ["n", "v", "adj", "adv"] as const;
type Loai = (typeof LOAI)[number];

interface Dang {
  form: string;
  pos: Loai;
}

/** Chữ đã bị thay bằng ô trống — chính là đáp án đúng. */
function chuBiKhoet(goc: string, daKhoet: string): string | null {
  const a = goc.split(/\s+/);
  const b = daKhoet.split(/\s+/);
  if (a.length !== b.length) return null;
  for (let i = 0; i < a.length; i++) {
    if (b[i].includes(O_TRONG)) return a[i].replace(/[^a-zA-Z'-]/g, "");
  }
  return null;
}

async function hoiGemini(tu: string[]): Promise<Map<string, Dang[]>> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Với mỗi từ tiếng Anh dưới đây, liệt kê các dạng CÙNG GỐC của nó.

${tu.map((w, i) => `${i + 1}. ${w}`).join("\n")}

Trả về DUY NHẤT một mảng JSON, mỗi phần tử ứng với một từ theo đúng thứ tự:
[{"word":"...","forms":[{"form":"inform","pos":"v"},{"form":"information","pos":"n"},{"form":"informative","pos":"adj"},{"form":"informatively","pos":"adv"}]}]

Quy tắc:
- pos chỉ nhận đúng 4 giá trị: "n", "v", "adj", "adv"
- MỖI pos nhiều nhất MỘT dạng, chọn dạng thông dụng nhất
- Chỉ liệt kê dạng CÓ THẬT trong tiếng Anh, không bịa
- Nếu từ không có dạng nào của một loại thì bỏ loại đó đi
- Kèm cả dạng chia của động từ nếu nó là dạng thông dụng nhất của loại đó`;

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  const raw = JSON.parse(res.text ?? "[]") as { word: string; forms: Dang[] }[];
  const ra = new Map<string, Dang[]>();
  // Khớp THEO VỊ TRÍ, không theo chữ "word" model trả về — bài học từ enrich:
  // model hay sửa lại chữ ("take over (v)") rồi khớp trượt hết.
  if (raw.length === tu.length) {
    tu.forEach((w, i) => ra.set(w, raw[i]?.forms ?? []));
  } else {
    for (const r of raw) if (r?.word) ra.set(r.word.toLowerCase().trim(), r.forms ?? []);
  }
  return ra;
}

async function main() {
  const the = await prisma.vocabCard.findMany({
    where: { example: { not: null } },
    select: { word: true, example: true, pos: true },
    take: 600,
  });

  // Chỉ xét thẻ đã khoét lỗ được — dạng này dùng chung đề với cloze
  const ungVien = the
    .map((c) => {
      const de = taoChoTrong(c.example!, c.word);
      return de ? { word: c.word, example: c.example!, de, dap: chuBiKhoet(c.example!, de) } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null && x.dap !== null);

  // Lọc trùng từ: họ từ dùng chung nên không cần hỏi hai lần
  const theoTu = new Map<string, (typeof ungVien)[number]>();
  for (const u of ungVien) if (!theoTu.has(u.word.toLowerCase())) theoTu.set(u.word.toLowerCase(), u);
  const mau = [...theoTu.values()].slice(0, SO_TU);

  console.log(`${the.length} thẻ có ví dụ · ${ungVien.length} khoét được · lấy mẫu ${mau.length} từ\n`);

  const ho = new Map<string, Dang[]>();
  for (let i = 0; i < mau.length; i += 20) {
    const lo = mau.slice(i, i + 20).map((m) => m.word.toLowerCase());
    process.stdout.write(`  hỏi Gemini lô ${i / 20 + 1} (${lo.length} từ)…`);
    try {
      const r = await hoiGemini(lo);
      for (const [k, v] of r) ho.set(k, v);
      console.log(" xong");
    } catch (e) {
      console.log(` LỖI: ${e instanceof Error ? e.message : e}`);
    }
  }

  let duDang = 0;
  let dapCoTrongHo = 0;
  let hopLe = 0;
  const truot: string[] = [];
  const vd: string[] = [];

  for (const m of mau) {
    const forms = ho.get(m.word.toLowerCase()) ?? [];
    const posHopLe = forms.filter((f) => LOAI.includes(f.pos) && f.form);
    const theoPos = new Map<Loai, string>();
    for (const f of posHopLe) if (!theoPos.has(f.pos)) theoPos.set(f.pos, f.form.toLowerCase());

    const du = theoPos.size >= 4;
    if (du) duDang++;

    const dap = m.dap!.toLowerCase();
    const co = [...theoPos.values()].includes(dap);
    if (co) dapCoTrongHo++;
    else truot.push(`${m.word} → câu dùng "${dap}", họ từ: ${[...theoPos.values()].join("/") || "(rỗng)"}`);

    if (du && co) {
      hopLe++;
      if (vd.length < 4) {
        vd.push(`  ${m.de}\n    ${[...theoPos.entries()].map(([p, f]) => `${f}(${p})${f === dap ? " ←" : ""}`).join("  ")}`);
      }
    }
  }

  const pc = (n: number) => `${n}/${mau.length} (${Math.round((n / mau.length) * 100)}%)`;
  console.log(`\n${"─".repeat(60)}`);
  console.log(`Đủ 4 loại từ khác nhau : ${pc(duDang)}`);
  console.log(`Đáp án nằm trong họ từ : ${pc(dapCoTrongHo)}`);
  console.log(`RA ĐƯỢC CÂU HỢP LỆ     : ${pc(hopLe)}`);

  console.log(`\nVí dụ câu ra được:`);
  console.log(vd.join("\n") || "  (không có)");

  console.log(`\nVí dụ thẻ bị loại vì đáp án không khớp họ từ (${truot.length}):`);
  console.log(truot.slice(0, 10).map((t) => `  ${t}`).join("\n") || "  (không có)");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
