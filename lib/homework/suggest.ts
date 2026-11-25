/**
 * lib/homework/suggest.ts — gợi ý bài riêng cho từng học viên.
 *
 * Chỉ dùng dữ liệu làm bài thật, không đoán:
 *   1. Ngữ pháp theo chủ đề (grammar_attempts) — chủ đề đúng dưới 60%.
 *   2. Kỹ năng con (subskill_attempts) — khu điểm trung bình dưới 60.
 *   3. Độ chính xác từng part: đề thi thử gần nhất + luyện part 30 ngày.
 *   4. Sổ lỗi sai giáo viên ghi (RTDB students/{code}/errorLog) — loại lỗi lặp lại.
 * Mỗi điểm yếu → bài trong kho (lib/roadmap/catalog), bỏ bài đã có trong BTVN
 * gần đây và bài HV đã làm đạt (cùng bộ kiểm "đã xong" của Lộ trình).
 * Không gọi AI: gợi ý phải giải thích được bằng số liệu cho giáo viên duyệt.
 */

import { prisma } from "@/lib/db/prisma";
import { CATALOG_ITEMS, filterCatalog, sortForPlanner } from "@/lib/roadmap/catalog";
import { checkEvidence } from "@/lib/roadmap/evidence";
import type { CatalogItem, PartNumber } from "@/lib/roadmap/types";
import type { ErrorLogEntry } from "@/lib/firebase/types";
import { sectionForLib, type HwCatKey } from "./library";

const DAY = 86_400_000;
const WINDOW_DAYS = 30;
const WEAK = 0.6;

export type Suggestion = {
  catalogId: string;
  title: string;
  href: string;
  minutes: number;
  section: HwCatKey;
  why: string;
};

export type StudentSuggestions = {
  code: string;
  score: number | null;
  reasons: string[];
  suggestions: Suggestion[];
  /** Không có dữ liệu làm bài gần đây → không đủ căn cứ gợi ý. */
  inactive: boolean;
};

type Weakness = { why: string; candidates: CatalogItem[]; severity: number };

const PART_NAME: Record<number, string> = {
  1: "Part 1", 2: "Part 2", 3: "Part 3", 4: "Part 4", 5: "Part 5", 6: "Part 6", 7: "Part 7",
};

const GRAMMAR_TOPIC: Record<string, string> = {
  "12-thi": "12 thì", "cau-bi-dong": "câu bị động", "cau-dieu-kien": "câu điều kiện",
  "cau-truc-cau": "cấu trúc câu", "danh-dong-tu-nguyen-the": "V-ing / to V",
  "danh-tu-dai-tu": "danh từ & đại từ", "dong-tu-khuyet-thieu": "động từ khuyết thiếu",
  "gioi-tu": "giới từ", "hoa-hop-sv": "hoà hợp S-V", "lien-tu": "liên từ", mdqh: "mệnh đề quan hệ",
  "menh-de-danh-ngu": "mệnh đề danh ngữ", "nhan-dang-hau-to": "hậu tố / từ loại",
  "part-5-tong-hop": "Part 5 tổng hợp", "so-sanh": "so sánh", "tinh-tu-trang-tu": "tính từ & trạng từ",
};

/** Loại lỗi trong sổ lỗi → nhóm bài trong kho. */
const ERROR_MAP: { key: string; side: "listening" | "reading"; label: string; filter: Parameters<typeof filterCatalog>[0] }[] = [
  { key: "grammar", side: "reading", label: "lỗi ngữ pháp", filter: { anyTag: ["grammar-core"], parts: [5, 6] } },
  { key: "vocabulary", side: "reading", label: "lỗi từ vựng (Đọc)", filter: { anyTag: ["vocab"] } },
  { key: "no_time", side: "reading", label: "không kịp giờ (Đọc)", filter: { anyTag: ["reading-speed"] } },
  { key: "paraphrase", side: "listening", label: "không nhận ra paraphrase", filter: { anyTag: ["paraphrase"] } },
  { key: "new_word", side: "listening", label: "từ mới khi nghe", filter: { anyTag: ["vocab", "listening-decode"] } },
  { key: "distractor", side: "listening", label: "mắc bẫy đáp án nhiễu", filter: { anyTag: ["listening-decode"], parts: [2, 3, 4] } },
  { key: "miss_keyword", side: "listening", label: "lỡ từ khoá khi nghe", filter: { anyTag: ["listening-decode"], parts: [3, 4] } },
  { key: "speed", side: "listening", label: "nghe không kịp tốc độ", filter: { anyTag: ["listening-decode", "chunking"] } },
];

const pct = (x: number) => `${Math.round(x * 100)}%`;
const lowFirst = (items: CatalogItem[]) => sortForPlanner(items);

export async function suggestForStudent(opts: {
  code: string;
  userId: string | null;
  errorLog?: Record<string, ErrorLogEntry> | null;
  /** catalogId đã có trong BTVN gần đây / BTVN đang gắn vào. */
  exclude: Set<string>;
  budget: number;
  maxItems?: number;
}): Promise<StudentSuggestions> {
  const { code, userId, exclude, budget } = opts;
  const maxItems = opts.maxItems ?? 3;
  const since = new Date(Date.now() - WINDOW_DAYS * DAY);
  const reasons: string[] = [];
  const weaknesses: Weakness[] = [];
  let score: number | null = null;
  let activity = 0;

  if (userId) {
    const [full, parts, grammar, subs] = await Promise.all([
      prisma.fullTestAttempt.findFirst({
        where: { userId, status: "done", total: { not: null } },
        orderBy: { completedAt: "desc" },
        select: { total: true, partScores: true, completedAt: true },
      }),
      prisma.partPracticeAttempt.findMany({
        where: { userId, status: "done", completedAt: { gte: since } },
        select: { part: true, correct: true, gradable: true },
      }),
      prisma.grammarAttempt.groupBy({
        by: ["topicSlug", "isCorrect"],
        where: { userId, createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.subskillAttempt.findMany({
        where: { userId, completedAt: { gte: since }, itemIdx: null },
        select: { part: true, questionWord: true, score: true },
      }),
    ]);
    score = full?.total ?? null;
    if (full?.completedAt && full.completedAt >= since) activity++;
    activity += parts.length + subs.length + grammar.reduce((a, g) => a + g._count._all, 0);

    // 1. Ngữ pháp theo chủ đề
    const g = new Map<string, { ok: number; n: number }>();
    for (const row of grammar) {
      const cur = g.get(row.topicSlug) ?? { ok: 0, n: 0 };
      cur.n += row._count._all;
      if (row.isCorrect) cur.ok += row._count._all;
      g.set(row.topicSlug, cur);
    }
    for (const [topic, { ok, n }] of g) {
      if (n < 5 || ok / n >= WEAK) continue;
      const cands = lowFirst(
        CATALOG_ITEMS.filter((c) => c.evidence.source === "grammar" && c.evidence.topicSlug === topic),
      );
      weaknesses.push({
        why: `Ngữ pháp · ${GRAMMAR_TOPIC[topic] ?? topic}: đúng ${pct(ok / n)} (${n} câu)`,
        candidates: cands,
        severity: 1.2 - ok / n,
      });
    }

    // 2. Kỹ năng con điểm thấp
    const s = new Map<string, { sum: number; n: number }>();
    for (const r of subs) {
      const k = `${r.part}|${r.questionWord}`;
      const cur = s.get(k) ?? { sum: 0, n: 0 };
      cur.sum += r.score;
      cur.n += 1;
      s.set(k, cur);
    }
    for (const [k, { sum, n }] of s) {
      const avg = sum / n / 100;
      if (avg >= WEAK) continue;
      const [part, qw] = k.split("|");
      const cands = lowFirst(
        CATALOG_ITEMS.filter(
          (c) => c.evidence.source === "subskill" && c.evidence.part === part && c.evidence.questionWord === qw,
        ),
      );
      if (cands.length === 0) continue;
      const label = cands[0].title.split(" — ")[0];
      weaknesses.push({ why: `${label}: điểm TB ${Math.round(avg * 100)} (${n} lượt)`, candidates: cands, severity: 1.1 - avg });
    }

    // 3. Độ chính xác từng part
    const acc = new Map<number, { ok: number; n: number }>();
    const addPart = (p: number, ok: number, n: number) => {
      const cur = acc.get(p) ?? { ok: 0, n: 0 };
      cur.ok += ok;
      cur.n += n;
      acc.set(p, cur);
    };
    if (Array.isArray(full?.partScores)) {
      for (const ps of full.partScores as { part: number; correct: number; gradable: number }[]) {
        if (ps?.gradable) addPart(ps.part, ps.correct, ps.gradable);
      }
    }
    for (const r of parts) if (r.gradable && r.correct !== null) addPart(r.part, r.correct, r.gradable);
    const totalOk = [...acc.values()].reduce((a, v) => a + v.ok, 0);
    const totalN = [...acc.values()].reduce((a, v) => a + v.n, 0);
    const overall = totalN ? totalOk / totalN : 0;
    for (const [p, { ok, n }] of acc) {
      const a = ok / n;
      if (n < 6 || (a >= WEAK && a >= overall - 0.1)) continue;
      const cands = lowFirst(
        filterCatalog({
          parts: [p as PartNumber],
          band: score ?? undefined,
          ignoreBandMax: true,
          noneTag: ["checkpoint", "sw", "exam-format"],
          kinds: p >= 5 ? ["grammar", "subskill"] : ["subskill", "part_practice"],
        }),
      );
      weaknesses.push({ why: `${PART_NAME[p]}: đúng ${pct(a)} (${n} câu)`, candidates: cands, severity: 1 - a });
    }
  }

  // 4. Sổ lỗi sai (30 ngày)
  const counts = new Map<string, number>();
  for (const e of Object.values(opts.errorLog ?? {})) {
    if (!e?.date || Date.parse(e.date) < since.getTime()) continue;
    activity++;
    for (const m of ERROR_MAP) {
      const v = (e[m.side] as Record<string, number> | undefined)?.[m.key] ?? 0;
      if (v > 0) counts.set(m.key, (counts.get(m.key) ?? 0) + v);
    }
  }
  for (const m of ERROR_MAP) {
    const c = counts.get(m.key) ?? 0;
    if (c < 3) continue;
    weaknesses.push({
      why: `Sổ lỗi: ${c} lần ${m.label}`,
      candidates: lowFirst(filterCatalog({ ...m.filter, band: score ?? undefined, ignoreBandMax: true, noneTag: ["checkpoint", "sw"] })),
      severity: Math.min(0.8, c / 20),
    });
  }

  weaknesses.sort((a, b) => b.severity - a.severity);
  reasons.push(...weaknesses.slice(0, 4).map((w) => w.why));

  // Chọn bài: lần lượt từng điểm yếu, mỗi điểm yếu 1 bài, tới khi đủ ngân sách.
  const suggestions: Suggestion[] = [];
  const taken = new Set(exclude);
  const evidenceSince = new Date(Date.now() - 60 * DAY);
  let minutes = 0;
  let checks = 0;
  for (let round = 0; round < 2 && suggestions.length < maxItems; round++) {
    for (const w of weaknesses) {
      if (suggestions.length >= maxItems) break;
      for (const c of w.candidates) {
        if (taken.has(c.id)) continue;
        if (minutes + c.estMinutes > budget && suggestions.length > 0) continue;
        if (c.estMinutes > budget * 1.5) continue;
        taken.add(c.id);
        // Bỏ bài HV đã làm đạt trong 60 ngày.
        if (userId && checks < 15) {
          checks++;
          const done = await checkEvidence(userId, c.evidence, evidenceSince).catch(() => null);
          if (done) continue;
        }
        suggestions.push({
          catalogId: c.id,
          title: c.title,
          href: c.href,
          minutes: c.estMinutes,
          section: sectionForLib(c),
          why: w.why,
        });
        minutes += c.estMinutes;
        break;
      }
    }
    if (minutes >= budget) break;
  }

  return { code, score, reasons, suggestions, inactive: activity === 0 };
}
