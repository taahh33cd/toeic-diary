import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { loadTest } from "@/lib/full-tests";
import { normalizeWord } from "./normalize";
import type { CardDraft } from "./types";

/**
 * Sinh bộ từ vựng từ nội dung học viên ĐÃ HỌC trong hệ thống.
 *
 * Giá trị sư phạm nằm ở chỗ từ đến từ đúng bài họ vừa làm, nhất là nguồn
 * "câu sai" — ôn đúng chỗ yếu thay vì học danh sách chung chung.
 */

export type ContentSource = "lesson" | "reading" | "error-log" | "wrong-answers";

export interface SourceOption {
  id: string;
  label: string;
  note?: string;
}

/** Bỏ thẻ HTML trong passage Part 7 (texts lưu dạng HTML). */
function boHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Danh sách nguồn học viên chọn được, mới học trước. */
export async function listSources(
  userId: string,
  studentCode: string | null,
  source: ContentSource
): Promise<SourceOption[]> {
  if (source === "lesson") {
    const rows = await prisma.userProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        lessonId: true,
        updatedAt: true,
        lesson: { select: { title: true, part: { select: { partNumber: true } } } },
      },
    });
    // Một bài có 4 level nên userProgress lặp lại — gộp theo lessonId
    const thay = new Set<string>();
    return rows
      .filter((r) => !thay.has(r.lessonId) && thay.add(r.lessonId))
      .slice(0, 15)
      .map((r) => ({
        id: r.lessonId,
        label: `Part ${r.lesson.part.partNumber} — ${r.lesson.title}`,
        note: r.updatedAt.toISOString().slice(0, 10),
      }));
  }

  if (source === "reading") {
    const rows = await prisma.readingAttempt.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: 30,
      select: {
        passageId: true,
        score: true,
        completedAt: true,
        passage: { select: { type: true, category: true, orderIndex: true } },
      },
    });
    const thay = new Set<string>();
    return rows
      .filter((r) => !thay.has(r.passageId) && thay.add(r.passageId))
      .slice(0, 15)
      .map((r) => ({
        id: r.passageId,
        label: `Bài đọc #${r.passage.orderIndex}${r.passage.category ? ` — ${r.passage.category}` : ""}`,
        note: `${r.score} điểm · ${r.completedAt.toISOString().slice(0, 10)}`,
      }));
  }

  if (source === "wrong-answers") {
    const rows = await prisma.fullTestAttempt.findMany({
      where: { userId, status: "done" },
      orderBy: { completedAt: "desc" },
      take: 10,
      select: { id: true, testSlug: true, correct: true, gradable: true, completedAt: true },
    });
    // Nhãn ghi số câu ĐÚNG, không ghi "sai N câu": gradable − correct tính cả
    // câu học viên chưa trả lời, nên nói "sai" là sai sự thật — có lượt hiện
    // "sai 4/6" trong khi học viên chỉ trả lời 2 câu và đúng cả hai.
    return rows.map((r) => ({
      id: r.id,
      label: r.testSlug,
      note:
        r.correct !== null && r.gradable !== null
          ? `đúng ${r.correct}/${r.gradable} câu · ${r.completedAt?.toISOString().slice(0, 10) ?? ""}`
          : undefined,
    }));
  }

  // error-log: cả sổ lỗi là một nguồn, không phải chọn
  if (!studentCode) return [];
  try {
    const snap = await getAdminDb().ref(`students/${studentCode}/errorLog`).get();
    const n = snap.exists() ? Object.keys(snap.val() ?? {}).length : 0;
    return n > 0 ? [{ id: "all", label: "Toàn bộ sổ lỗi", note: `${n} buổi đã ghi` }] : [];
  } catch {
    return [];
  }
}

/** Gom văn bản thô của một nguồn. Trả chuỗi rỗng khi không có gì. */
export async function layVanBan(
  userId: string,
  studentCode: string | null,
  source: ContentSource,
  ref: string
): Promise<{ text: string; label: string }> {
  if (source === "lesson") {
    const l = await prisma.lesson.findUnique({
      where: { id: ref },
      select: { title: true, transcriptFull: true, part: { select: { partNumber: true } } },
    });
    if (!l) return { text: "", label: "" };
    return { text: l.transcriptFull, label: `Part ${l.part.partNumber} — ${l.title}` };
  }

  if (source === "reading") {
    const p = await prisma.readingPassage.findUnique({
      where: { id: ref },
      select: { texts: true, orderIndex: true, category: true },
    });
    if (!p) return { text: "", label: "" };
    const arr = Array.isArray(p.texts) ? (p.texts as unknown[]) : [];
    const text = arr.filter((t): t is string => typeof t === "string").map(boHtml).join("\n\n");
    return { text, label: `Bài đọc #${p.orderIndex}${p.category ? ` — ${p.category}` : ""}` };
  }

  if (source === "wrong-answers") {
    const a = await prisma.fullTestAttempt.findFirst({
      where: { id: ref, userId, status: "done" },
      select: { testSlug: true, answers: true },
    });
    if (!a) return { text: "", label: "" };

    const test = await loadTest(a.testSlug);
    if (!test) return { text: "", label: "" };

    const daChon = (a.answers ?? {}) as Record<string, string>;
    const manh: string[] = [];

    for (const g of test.groups) {
      const saiTrongNhom = g.questions.filter(
        (q) => q.answer && daChon[String(q.number)] && daChon[String(q.number)] !== q.answer
      );
      if (saiTrongNhom.length === 0) continue;

      // Ngữ cảnh của nhóm giúp AI chọn từ đúng chủ đề, không chỉ nhìn câu lẻ
      const nganh = [g.intro, ...(g.passages ?? []).map((p) => p.text), g.transcript]
        .filter((x): x is string => !!x)
        .join("\n");
      if (nganh) manh.push(boHtml(nganh));

      for (const q of saiTrongNhom) {
        const dong = [q.prompt, q.options ? Object.values(q.options).join(" / ") : null]
          .filter(Boolean)
          .join(" — ");
        if (dong) manh.push(dong);
      }
    }

    return { text: manh.join("\n\n"), label: `Câu sai trong ${a.testSlug}` };
  }

  // error-log
  if (!studentCode) return { text: "", label: "" };
  try {
    const snap = await getAdminDb().ref(`students/${studentCode}/errorLog`).get();
    if (!snap.exists()) return { text: "", label: "" };
    const log = snap.val() as Record<string, { details?: { content?: string }[] }>;
    const dong = Object.values(log)
      .flatMap((e) => e.details ?? [])
      .map((d) => d.content)
      .filter((c): c is string => !!c && c.trim().length > 0);
    return { text: dong.join("\n"), label: "Sổ lỗi của bạn" };
  } catch {
    return { text: "", label: "" };
  }
}

/**
 * Nhờ Gemini rút từ vựng TOEIC đáng học từ một đoạn văn bản.
 *
 * Mở rộng prompt của /api/ai/extract-vocabulary: trả nhiều từ hơn và có thêm
 * câu ví dụ riêng (không lấy lại câu trong bài, để học viên gặp từ ở ngữ cảnh
 * thứ hai).
 */
export async function rutTuVung(text: string, soTu: number): Promise<CardDraft[]> {
  if (!process.env.GEMINI_API_KEY || !text.trim()) return [];

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Bạn là giáo viên TOEIC. Đọc đoạn sau và chọn ${soTu} từ/cụm từ tiếng Anh đáng học nhất cho người luyện TOEIC.

"""
${text.slice(0, 6000)}
"""

Với mỗi từ, cho:
- word: dạng nguyên thể/từ điển
- ipa: phiên âm IPA, đặt trong hai dấu gạch chéo
- pos: một trong n, v, adj, adv, phrase
- vi: nghĩa tiếng Việt ngắn gọn (2-6 từ)
- example: MỘT câu tiếng Anh ngắn tự đặt, có dùng từ đó, KHÔNG chép lại câu trong đoạn trên

Quy tắc:
- Ưu tiên từ thương mại / công sở / đời sống hay gặp trong TOEIC
- Bỏ qua từ quá thông dụng (the, is, and, have…)
- Chỉ chọn từ thật sự xuất hiện trong đoạn

Trả về DUY NHẤT mảng JSON:
[{"word":"...","ipa":"...","pos":"...","vi":"...","example":"..."}]`;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    const m = (res.text ?? "").match(/\[[\s\S]*\]/);
    if (!m) return [];
    const parsed = JSON.parse(m[0]) as unknown;
    if (!Array.isArray(parsed)) return [];

    const thay = new Set<string>();
    const out: CardDraft[] = [];
    for (const r of parsed) {
      if (typeof r !== "object" || r === null) continue;
      const o = r as Record<string, unknown>;
      const word = typeof o.word === "string" ? o.word.trim() : "";
      if (!word) continue;
      const key = normalizeWord(word);
      if (thay.has(key)) continue;
      thay.add(key);

      const ipa = typeof o.ipa === "string" ? o.ipa.trim() : "";
      out.push({
        word,
        ipa: ipa ? (ipa.startsWith("/") ? ipa : `/${ipa.replace(/^\/+|\/+$/g, "")}/`) : undefined,
        pos: typeof o.pos === "string" ? o.pos.trim() : undefined,
        meaningVi: typeof o.vi === "string" ? o.vi.trim() : undefined,
        example: typeof o.example === "string" ? o.example.trim() : undefined,
      });
    }
    return out.slice(0, soTu);
  } catch (e) {
    console.error("[from-content] Gemini:", e instanceof Error ? e.message : String(e));
    return [];
  }
}
