import type { CardRow, ProgressRow } from "./client";

/**
 * Sinh câu hỏi cho quiz từ vựng — hàm thuần, không đụng DB hay mạng, để test
 * được và để màn quiz chạy ngay không phải chờ server.
 */

export type QuizType =
  | "word-to-image"
  | "image-to-word"
  | "image-to-typing"
  | "word-to-meaning"
  | "meaning-to-word"
  | "meaning-to-typing"
  | "listen-to-word"
  | "listen-to-image"
  | "listen-to-meaning"
  | "listen-to-typing";

export const QUIZ_TYPES: { id: QuizType; nhan: string; canAnh: boolean; canNghe: boolean }[] = [
  { id: "word-to-meaning", nhan: "Từ → chọn nghĩa", canAnh: false, canNghe: false },
  { id: "meaning-to-word", nhan: "Nghĩa → chọn từ", canAnh: false, canNghe: false },
  { id: "meaning-to-typing", nhan: "Nghĩa → gõ từ", canAnh: false, canNghe: false },
  { id: "listen-to-word", nhan: "Nghe → chọn từ", canAnh: false, canNghe: true },
  { id: "listen-to-meaning", nhan: "Nghe → chọn nghĩa", canAnh: false, canNghe: true },
  { id: "listen-to-typing", nhan: "Nghe → gõ từ", canAnh: false, canNghe: true },
  { id: "word-to-image", nhan: "Từ → chọn ảnh", canAnh: true, canNghe: false },
  { id: "image-to-word", nhan: "Ảnh → chọn từ", canAnh: true, canNghe: false },
  { id: "image-to-typing", nhan: "Ảnh → gõ từ", canAnh: true, canNghe: false },
  { id: "listen-to-image", nhan: "Nghe → chọn ảnh", canAnh: true, canNghe: true },
];

/**
 * Yêu cầu của ĐỀ BÀI và của PHƯƠNG ÁN là hai thứ khác nhau.
 *
 * "Ảnh → chọn từ": đề cần ảnh, nhưng phương án là chữ nên thẻ nhiễu không cần
 * ảnh. Ngược lại "Từ → chọn ảnh": đề chỉ cần chữ, nhưng MỌI phương án là ảnh
 * nên cả thẻ đúng lẫn thẻ nhiễu đều phải có ảnh.
 *
 * Trước đây gộp làm một và dò bằng t.includes("-image") — chuỗi đó không khớp
 * "image-to-word" (gạch nối nằm ở đầu), nên hai dạng image-to-* coi như không
 * cần ảnh: thẻ trắng vẫn sinh câu và đề bài hiện ra trống trơn.
 */
function canChoDe(t: QuizType): { anh: boolean; nghia: boolean } {
  return { anh: t.startsWith("image-"), nghia: t.startsWith("meaning-") };
}

function canChoPhuongAn(t: QuizType): { anh: boolean; nghia: boolean } {
  return { anh: t.endsWith("-to-image"), nghia: t.endsWith("-to-meaning") };
}

export function laDangGo(t: QuizType): boolean {
  return t.endsWith("-to-typing");
}

export interface PhuongAn {
  id: string;
  label?: string;
  imageUrl?: string;
  dung: boolean;
}

export interface CauHoi {
  id: string;
  wordKey: string;
  word: string;
  type: QuizType;
  /** Đề bài hiện ra: chữ, ảnh, hoặc phát âm. */
  de: { chu?: string; anh?: string; nghe?: boolean };
  /** null với dạng gõ. */
  phuongAn: PhuongAn[] | null;
  /** Đáp án đúng — dùng chấm dạng gõ và hiện lại khi sai. */
  dapAn: string;
  /** Nghĩa, để hiện lại sau khi trả lời. */
  nghia?: string;
}

function tron<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Thẻ nhiễu dùng được không — chỉ cần hiện được ở vị trí phương án. */
function duocLamNhieu(c: CardRow, t: QuizType): boolean {
  const can = canChoPhuongAn(t);
  if (can.anh && !c.imageUrl) return false;
  if (can.nghia && !c.meaningVi) return false;
  return true;
}

/**
 * Thẻ này ra được câu hỏi dạng này không: phải đủ cho ĐỀ BÀI, và nếu là câu
 * trắc nghiệm thì còn phải hiện được ở vị trí phương án (vì đáp án đúng nằm
 * trong đó).
 */
function dungDuoc(c: CardRow, t: QuizType): boolean {
  const de = canChoDe(t);
  if (de.anh && !c.imageUrl) return false;
  if (de.nghia && !c.meaningVi) return false;
  if (!laDangGo(t) && !duocLamNhieu(c, t)) return false;
  // Dạng nghe đọc chính từ đó nên thẻ nào cũng được
  return true;
}

/**
 * Chọn 3 phương án nhiễu.
 *
 * Ưu tiên thẻ CÙNG LOẠI TỪ: nhiễu cùng loại mới buộc học viên nhớ nghĩa, chứ
 * trộn "negotiate" với "quickly" thì đoán mò cũng trúng. Không đủ thì lấy thêm
 * thẻ khác loại.
 */
function chonNhieu(dung: CardRow, pool: CardRow[], t: QuizType, lay = 3): CardRow[] {
  const hopLe = pool.filter((c) => c.wordKey !== dung.wordKey && duocLamNhieu(c, t));
  const cungLoai = hopLe.filter((c) => c.pos && dung.pos && c.pos === dung.pos);
  const khac = hopLe.filter((c) => !cungLoai.includes(c));
  return [...tron(cungLoai), ...tron(khac)].slice(0, lay);
}

function nhanPhuongAn(c: CardRow, t: QuizType): PhuongAn {
  // Phương án hiện cái gì là tuỳ dạng: chọn-ảnh thì hiện ảnh, chọn-từ hiện
  // chữ tiếng Anh, chọn-nghĩa hiện nghĩa tiếng Việt.
  if (t === "word-to-image" || t === "listen-to-image") {
    return { id: c.wordKey, imageUrl: c.imageUrl ?? undefined, dung: false };
  }
  if (t === "image-to-word" || t === "meaning-to-word" || t === "listen-to-word") {
    return { id: c.wordKey, label: c.word, dung: false };
  }
  return { id: c.wordKey, label: c.meaningVi ?? c.word, dung: false };
}

function taoCau(c: CardRow, t: QuizType, pool: CardRow[], stt: number): CauHoi | null {
  if (!dungDuoc(c, t)) return null;

  const de: CauHoi["de"] = {};
  if (t.startsWith("listen-")) de.nghe = true;
  else if (t.startsWith("image-")) de.anh = c.imageUrl ?? undefined;
  else if (t.startsWith("word-")) de.chu = c.word;
  else if (t.startsWith("meaning-")) de.chu = c.meaningVi ?? undefined;

  const chung = {
    id: `q${stt}_${c.wordKey}_${t}`,
    wordKey: c.wordKey,
    word: c.word,
    type: t,
    de,
    dapAn: c.word,
    nghia: c.meaningVi ?? undefined,
  };

  if (laDangGo(t)) return { ...chung, phuongAn: null };

  const nhieu = chonNhieu(c, pool, t);
  // Dưới 4 phương án thì câu trắc nghiệm quá dễ — bỏ, UI sẽ báo bộ quá nhỏ.
  if (nhieu.length < 3) return null;

  const pa = tron([
    { ...nhanPhuongAn(c, t), dung: true },
    ...nhieu.map((n) => nhanPhuongAn(n, t)),
  ]);
  return { ...chung, phuongAn: pa };
}

export interface TuyChonQuiz {
  /** Các dạng học viên chọn. */
  modes: QuizType[];
  /** Chỉ lấy từ đang đến hạn. */
  chiDenHan?: boolean;
  /** Trần số câu. Bỏ trống = lấy hết. */
  soCau?: number;
}

/**
 * Sinh bộ câu hỏi.
 *
 * Khác bản FlashCards Pro ở chỗ mỗi thẻ sinh câu cho MỌI dạng đã chọn, không
 * phải random một dạng: bản gốc chọn 10 dạng với bộ 20 thẻ vẫn chỉ ra 20 câu.
 *
 * Thứ tự ưu tiên khi phải cắt bớt: từ đến hạn trước, rồi tới từ hay sai.
 */
export function sinhCauHoi(
  cards: CardRow[],
  progress: ProgressRow[],
  opt: TuyChonQuiz
): { cauHoi: CauHoi[]; boQua: { thieuAnh: number; thieuNghia: number } } {
  const td = new Map(progress.map((p) => [p.wordKey, p]));
  const denHan = (c: CardRow) => {
    const p = td.get(c.wordKey);
    if (!p) return true;
    if (p.mastered) return false;
    return p.dueAt === null || new Date(p.dueAt) <= new Date();
  };

  const pool = opt.chiDenHan ? cards.filter(denHan) : cards;

  const boQua = { thieuAnh: 0, thieuNghia: 0 };
  let tatCa: CauHoi[] = [];
  let stt = 0;

  for (const c of pool) {
    for (const t of opt.modes) {
      if (!dungDuoc(c, t)) {
        const de = canChoDe(t);
        const pa = canChoPhuongAn(t);
        if ((de.anh || pa.anh) && !c.imageUrl) boQua.thieuAnh++;
        else if ((de.nghia || pa.nghia) && !c.meaningVi) boQua.thieuNghia++;
        continue;
      }
      const cau = taoCau(c, t, cards, stt++);
      if (cau) tatCa.push(cau);
    }
  }

  // Ưu tiên: đến hạn trước, trong đó từ hay sai lên trước
  tatCa.sort((a, b) => {
    const ca = cards.find((c) => c.wordKey === a.wordKey)!;
    const cb = cards.find((c) => c.wordKey === b.wordKey)!;
    const da = denHan(ca) ? 1 : 0;
    const db = denHan(cb) ? 1 : 0;
    if (da !== db) return db - da;
    const wa = td.get(a.wordKey)?.wrongCount ?? 0;
    const wb = td.get(b.wordKey)?.wrongCount ?? 0;
    return wb - wa;
  });

  if (opt.soCau && tatCa.length > opt.soCau) tatCa = tatCa.slice(0, opt.soCau);

  return { cauHoi: raiDeu(tatCa), boQua };
}

/**
 * Xáo sao cho hai câu cùng một từ không nằm liền nhau — gặp "negotiate" ba
 * lần liên tiếp thì câu sau chỉ là nhớ câu trước, không đo được gì.
 */
function raiDeu(ds: CauHoi[]): CauHoi[] {
  if (ds.length < 3) return ds;
  const conLai = tron(ds);
  const ra: CauHoi[] = [];
  while (conLai.length > 0) {
    const truoc = ra[ra.length - 1]?.wordKey;
    let i = conLai.findIndex((c) => c.wordKey !== truoc);
    if (i === -1) i = 0; // chỉ còn toàn từ đó, đành chịu
    ra.push(conLai.splice(i, 1)[0]);
  }
  return ra;
}

/** Chấm một câu gõ. Bỏ qua hoa/thường và khoảng trắng thừa. */
export function chamGo(nhap: string, dapAn: string): boolean {
  const chuan = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return chuan(nhap) === chuan(dapAn);
}
