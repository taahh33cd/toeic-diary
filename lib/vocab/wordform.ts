/**
 * Soạn bộ phương án cho dạng quiz "chọn dạng từ" (Part 5 word form).
 *
 * CHỈ CHẠY Ở SERVER — gọi Gemini và dùng node:crypto.
 *
 * Khác mọi dạng quiz còn lại, dạng này không có luật nào đảm bảo đúng. Đo trên
 * 60 thẻ thật (scripts/probe-wordform.ts, probe-wordform2.ts):
 *
 *   - Ép 4 phương án phải khác loại từ thì luật tự chặn được câu hai đáp án,
 *     nhưng chỉ 8% thẻ đủ 4 loại — từ vựng thật của học viên phần lớn là
 *     "pool", "sum", "rule", không có đủ họ từ.
 *   - Để AI sinh nhiễu theo ngữ cảnh rồi một lượt AI kiểm chéo: 83%.
 *
 * Nên chọn hướng sau, và chấp nhận rằng sẽ có câu sai lọt lưới — bù lại học
 * viên có nút báo sai ngay trong lượt làm.
 *
 * Lượt kiểm chéo hỏi bằng câu hỏi KHÁC HẲN lượt sinh: "có bao nhiêu phương án
 * làm câu đúng ngữ pháp", không nhắc đáp án nào là đáp án. Hỏi kiểu "đúng
 * không?" thì model gần như luôn gật.
 */

import { createHash } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { O_TRONG, taoChoTrong } from "./cloze";

/** Một câu đã sẵn sàng đem đi soạn phương án. */
export interface DeKhoet {
  wordKey: string;
  word: string;
  example: string;
  cloze: string;
  /** Chính chữ đã bị khoét — đáp án đúng. */
  answer: string;
}

export interface BoPhuongAn extends DeKhoet {
  exampleHash: string;
  distractors: string[];
}

export type LyDoLoai = "khong-khoet-duoc" | "ai-khong-sinh-duoc" | "nhieu-dap-an" | "lech-dap-an";

export function bamViDu(example: string): string {
  return createHash("sha1").update(example.trim()).digest("hex").slice(0, 16);
}

/**
 * Chữ đã bị thay bằng ô trống.
 *
 * So theo VỊ TRÍ tiếng chứ không dò chuỗi: câu có thể chứa chữ đó nhiều lần,
 * mà taoChoTrong chỉ khoét chỗ đầu tiên.
 */
export function chuBiKhoet(example: string, cloze: string): string | null {
  const a = example.trim().split(/\s+/);
  const b = cloze.trim().split(/\s+/);
  if (a.length !== b.length) return null;
  for (let i = 0; i < a.length; i++) {
    if (b[i].includes(O_TRONG)) {
      const chu = a[i].replace(/[^a-zA-Z'-]/g, "");
      return chu || null;
    }
  }
  return null;
}

/** Dựng đề từ một thẻ, hoặc null nếu thẻ không khoét lỗ được. */
export function dungDe(c: { wordKey: string; word: string; example: string | null }): DeKhoet | null {
  if (!c.example) return null;
  const cloze = taoChoTrong(c.example, c.word);
  if (!cloze) return null;
  const answer = chuBiKhoet(c.example, cloze);
  if (!answer) return null;
  return { wordKey: c.wordKey, word: c.word, example: c.example, cloze, answer };
}

function ai() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

/**
 * Khớp kết quả model trả về với đầu vào.
 *
 * Ưu tiên khớp THEO VỊ TRÍ khi số phần tử bằng nhau — bài học từ enrich: model
 * hay sửa lại chữ mình gửi đi ("take over" → "take over (v)") rồi khớp trượt
 * sạch, rơi hết xuống nhánh dự phòng mà không ai biết.
 */
function khop<T extends { n?: number }>(raw: T[], soLuong: number): Map<number, T> {
  const ra = new Map<number, T>();
  if (raw.length === soLuong) raw.forEach((r, i) => ra.set(i, r));
  else for (const r of raw) if (typeof r?.n === "number") ra.set(r.n - 1, r);
  return ra;
}

async function hoi<T>(prompt: string): Promise<T[]> {
  const res = await ai().models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  const v = JSON.parse(res.text ?? "[]");
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Lượt 1 — sinh 3 phương án nhiễu cùng gốc, hợp ngữ cảnh câu. */
async function sinhNhieu(lo: DeKhoet[]): Promise<Map<number, string[]>> {
  const raw = await hoi<{ n?: number; nhieu?: string[] }>(
    `Bạn đang soạn câu hỏi TOEIC Part 5 dạng chọn dạng từ.

Với mỗi câu dưới đây, đáp án đúng cho ô trống đã cho sẵn. Hãy cho 3 phương án NHIỄU.

${lo.map((d, i) => `${i + 1}. ${d.cloze}\n   đáp án đúng: ${d.answer}`).join("\n")}

Trả về DUY NHẤT một mảng JSON, mỗi phần tử ứng với một câu theo đúng thứ tự:
[{"n":1,"nhieu":["...","...","..."]}]

Quy tắc bắt buộc:
- Mỗi nhiễu phải CÙNG GỐC TỪ với đáp án (đổi loại từ hoặc đổi dạng chia)
- Mỗi nhiễu phải làm câu SAI NGỮ PHÁP khi đặt vào ô trống
- KHÔNG đưa phương án nào cũng đúng ngữ pháp như đáp án
- KHÔNG lặp lại đáp án đúng
- Đúng 3 nhiễu mỗi câu, không hơn không kém`
  );
  const m = khop(raw, lo.length);
  const ra = new Map<number, string[]>();
  for (const [i, r] of m) ra.set(i, Array.isArray(r.nhieu) ? r.nhieu : []);
  return ra;
}

export function chuan(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(a|an|the)\s+/, "");
}

/**
 * Quy câu trả lời của giám khảo về đúng phương án nó muốn nói.
 *
 * Giám khảo hay trả lời bằng chữ của mình chứ không chép nguyên phương án:
 * "an intersection" cho phương án "intersection", "turnaround time" cho
 * "turnaround". Đếm thô theo chuỗi thì hai câu đó thành hai đáp án khác nhau
 * và câu bị loại oan — đo trên 328 câu thật, đây là lý do loại phổ biến nhất.
 *
 * Chuỗi không quy được về phương án nào thì BỎ: giám khảo nói sang chuyện
 * khác, không phải thêm một đáp án đúng.
 */
export function quyVePhuongAn(traLoi: string[], pa: string[]): string[] {
  const ra = new Set<string>();
  for (const t of traLoi) {
    const c = chuan(t);
    if (!c) continue;
    const tieng = c.split(" ");
    const khop = pa.find((p) => {
      const cp = chuan(p);
      if (!cp) return false;
      return cp === c || (!cp.includes(" ") && tieng.includes(cp));
    });
    if (khop) ra.add(chuan(khop));
  }
  return [...ra];
}

/** Lượt 2 — kiểm chéo: liệt kê MỌI phương án làm câu đúng ngữ pháp. */
async function kiemCheo(lo: { cloze: string; pa: string[] }[]): Promise<Map<number, string[]>> {
  const raw = await hoi<{ n?: number; dung?: string[] }>(
    `Bạn là giám khảo ngữ pháp tiếng Anh, rất khắt khe.

Với mỗi câu, xét TỪNG phương án: đặt nó vào ô trống thì câu có đúng ngữ pháp và tự nhiên không?

${lo
  .map(
    (d, i) =>
      `${i + 1}. ${d.cloze}\n   ${d.pa.map((p, j) => `${String.fromCharCode(65 + j)}. ${p}`).join("   ")}`
  )
  .join("\n")}

Trả về DUY NHẤT một mảng JSON theo đúng thứ tự:
[{"n":1,"dung":["phương án làm câu đúng ngữ pháp","..."]}]

Quy tắc:
- "dung" liệt kê MỌI phương án khiến câu đúng ngữ pháp, có thể nhiều hơn một
- Chép lại nguyên văn chữ của phương án
- Đừng cố đoán phương án nào là đáp án ra đề — chỉ xét ngữ pháp`
  );
  const m = khop(raw, lo.length);
  const ra = new Map<number, string[]>();
  for (const [i, r] of m) {
    const d = Array.isArray(r.dung) ? r.dung : [];
    ra.set(i, quyVePhuongAn(d, lo[i]?.pa ?? []));
  }
  return ra;
}

/**
 * Soạn phương án cho MỘT lô đề (nên dưới 15 câu để model không lạc thứ tự).
 *
 * Trả cả những câu bị loại kèm lý do — gọi xong phải biết vì sao mất câu, chứ
 * không chỉ biết "được ít".
 */
export async function soanLo(
  lo: DeKhoet[]
): Promise<{ dat: BoPhuongAn[]; loai: { de: DeKhoet; vi: LyDoLoai; chiTiet?: string }[] }> {
  const dat: BoPhuongAn[] = [];
  const loai: { de: DeKhoet; vi: LyDoLoai; chiTiet?: string }[] = [];
  if (lo.length === 0) return { dat, loai };

  const nhieu = await sinhNhieu(lo);

  const deKiem: { cloze: string; pa: string[] }[] = [];
  const goc: { de: DeKhoet; nhieu: string[] }[] = [];
  lo.forEach((d, i) => {
    const n = (nhieu.get(i) ?? []).map((x) => String(x ?? "").trim()).filter(Boolean);
    const duy = [...new Map(n.map((x) => [x.toLowerCase(), x])).values()].filter(
      (x) => x.toLowerCase() !== d.answer.toLowerCase()
    );
    if (duy.length !== 3) {
      loai.push({ de: d, vi: "ai-khong-sinh-duoc", chiTiet: `${duy.length} nhiễu` });
      return;
    }
    deKiem.push({ cloze: d.cloze, pa: [d.answer, ...duy] });
    goc.push({ de: d, nhieu: duy });
  });

  if (deKiem.length === 0) return { dat, loai };
  const kq = await kiemCheo(deKiem);

  goc.forEach((g, i) => {
    const dung = kq.get(i);
    if (!dung || dung.length !== 1) {
      loai.push({
        de: g.de,
        vi: "nhieu-dap-an",
        chiTiet: dung?.length
          ? dung.join(", ")
          : "giám khảo không chỉ được phương án nào trong 4 cái đưa ra",
      });
      return;
    }
    // Đúng một, VÀ cái đúng đó phải là đáp án ta định. Lệch nghĩa là chính đề
    // của ta sai, không phải nhiễu sai.
    if (dung[0] !== chuan(g.de.answer)) {
      loai.push({ de: g.de, vi: "lech-dap-an", chiTiet: `giám khảo chọn "${dung[0]}"` });
      return;
    }
    dat.push({ ...g.de, exampleHash: bamViDu(g.de.example), distractors: g.nhieu });
  });

  return { dat, loai };
}
