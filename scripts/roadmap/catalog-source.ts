/**
 * scripts/roadmap/catalog-source.ts — dựng catalog từ các registry nội dung thật.
 *
 * Dùng chung bởi hai script:
 *   • build-catalog.ts  — ghi kết quả ra lib/roadmap/catalog.generated.ts
 *   • check-catalog.ts  — dựng lại trong bộ nhớ rồi so với file đã commit, để
 *     bắt trường hợp nội dung đã đổi mà catalog chưa sinh lại.
 *
 * Nguyên tắc:
 *
 *   1. CHỈ lấy mục có dữ liệu thật. 7/12 thì Part 5 đang để `levels: []`, nhiều
 *      nhóm liên từ chưa có câu — những mục đó bị loại ở đây, không phải chờ
 *      học viên bấm vào mới phát hiện trang trống.
 *   2. Khoá `evidence` phải khớp ĐÚNG tuple (part, questionWord) mà client ghi
 *      vào subskill_attempts, nếu không việc sẽ không bao giờ tự tích xong.
 *      Các hằng khoá đó lấy thẳng từ chính helper của từng khu (tenseToPartKey,
 *      groupToPartKey…) chứ không chép tay.
 *   3. File sinh ra KHÔNG sửa tay. Sửa thì sửa catalog.meta.ts rồi chạy lại.
 */

import {
  PART2_SETS,
  PART2_MEDIUM_SETS,
  PART2_HARD_SETS,
} from "../../lib/subskills/index";
import { PART3_LEVELS, part3AttemptKey } from "../../lib/subskills/part3/index";
import { TENSES } from "../../lib/subskills/reading/index";
import { tenseToPartKey } from "../../lib/subskills/reading/types";
import { CONNECTOR_GROUPS } from "../../lib/subskills/connectors/index";
import { groupToPartKey as connPartKey } from "../../lib/subskills/connectors/types";
import { VERB_GROUPS } from "../../lib/subskills/verbs/index";
import { groupToPartKey as verbPartKey } from "../../lib/subskills/verbs/types";
import { TOPIC_METAS, getTopicConfig } from "../../lib/subskills/translation";
import { topicToPartKey } from "../../lib/subskills/translation/types";
import { levelsOf, attemptPart as chunkPartKey } from "../../lib/subskills/chunking/index";
import { IPA_SECTIONS, ipaExerciseCount } from "../../lib/subskills/ipa/index";
import { TOPICS as GRAMMAR_TOPICS } from "../../lib/grammar/topics";
import { listPracticeTests, countByPart } from "../../lib/listening-practice/index";
import { practiceAttemptSlug } from "../../lib/listening-practice/adapt";
import { EXAM_SETS, listTests } from "../../lib/full-tests/index";

import {
  AREA_META,
  DIFFICULTY_BANDS,
  DIFFICULTY_RANK,
  EXAM_STYLE_MIN_ACCURACY,
  GRAMMAR_MIN_ACCURACY,
  LEVEL_BANDS,
  PART3_LEVEL_BANDS,
  grammarMinutes,
  partPracticeMinutes,
} from "../../lib/roadmap/catalog.meta";
import { BASELINE_EXAM_SLUG, BASELINE_TEST_SLUG } from "../../lib/roadmap/config";
import type { CatalogItem, PartNumber } from "../../lib/roadmap/types";

export function buildCatalog(): { items: CatalogItem[]; skipped: string[] } {
const items: CatalogItem[] = [];
const skipped: string[] = [];

function push(item: CatalogItem) {
  items.push(item);
}

function bandFrom(
  table: Record<string, [number, number]>,
  key: string,
): [number, number] {
  return table[key] ?? [10, 990];
}

// ── Part 2 · 10 loại câu hỏi × 3 mức ────────────────────────────────────────
{
  const m = AREA_META.part2;
  const tiers = [
    { diff: "easy", sets: PART2_SETS },
    { diff: "medium", sets: PART2_MEDIUM_SETS },
    { diff: "hard", sets: PART2_HARD_SETS },
  ] as const;

  for (const { diff, sets } of tiers) {
    for (const set of sets as unknown as {
      part: string;
      questionWord: string;
      labelVi: string;
      passThreshold: number;
      exercises: { title: string; items: unknown[] }[];
    }[]) {
      if (!set.exercises?.length) {
        skipped.push(`part2 ${set.questionWord}/${diff}: không có bài`);
        continue;
      }
      const [bandMin, bandMax] = bandFrom(DIFFICULTY_BANDS, diff);
      const diffLabel = diff === "easy" ? "Cơ bản" : diff === "medium" ? "Khá" : "Khó";
      const href =
        diff === "easy"
          ? `/subskills/listening/part2/${set.questionWord}`
          : `/subskills/listening/part2/${set.questionWord}?d=${diff}`;

      // MỘT MỤC = MỘT BÀI CON, không phải cả bộ 4 bài.
      // Cả bộ là ~30 phút, to hơn lát ngân sách của một ngày 45 phút, nên nếu
      // để nguyên thì học viên yếu Part 2 không bao giờ được giao bài Part 2 —
      // planner luôn bốc trượt. Mỗi bài con 14 câu ≈ 8 phút thì vừa vặn, và
      // người học 15 phút/ngày cũng theo được.
      set.exercises.forEach((ex, exIdx) => {
        if (!ex.items?.length) {
          skipped.push(`part2 ${set.questionWord}/${diff}/bài ${exIdx + 1}: rỗng`);
          return;
        }
        const prevInSet =
          exIdx > 0 ? [`sub.part2.${set.questionWord}.${diff}.ex${exIdx}`] : [];
        const prevTier =
          exIdx > 0
            ? []
            : diff === "medium"
              ? [`sub.part2.${set.questionWord}.easy.ex${set.exercises.length}`]
              : diff === "hard"
                ? [`sub.part2.${set.questionWord}.medium.ex${set.exercises.length}`]
                : [];

        push({
          id: `sub.part2.${set.questionWord}.${diff}.ex${exIdx + 1}`,
          title: `Part 2 · ${set.labelVi} (${diffLabel}) — ${ex.title}`,
          href,
          kind: "subskill",
          parts: m.parts,
          skill: m.skill,
          tags: m.tags,
          bandMin,
          bandMax,
          estMinutes: m.estMinutes,
          rank: DIFFICULTY_RANK[diff] * 10 + exIdx,
          prereq: [...prevInSet, ...prevTier],
          evidence: {
            source: "subskill",
            // "part2" | "part2-medium" | "part2-hard" — lấy thẳng từ bộ đề
            part: set.part,
            questionWord: set.questionWord,
            exerciseIndex: exIdx,
            minScore: set.passThreshold ?? m.minScore,
            minExercises: 1,
          },
        });
      });
    }
  }
}

// ── Part 3/4 · 5 cấp × các drill ────────────────────────────────────────────
{
  const m = AREA_META.part3;
  for (const lv of PART3_LEVELS as unknown as {
    level: string;
    title: string;
    passThreshold: number;
    drills: { id: string; title?: string; label?: string }[];
  }[]) {
    if (!lv.drills?.length) {
      skipped.push(`part3 ${lv.level}: không có drill`);
      continue;
    }
    const [bandMin, bandMax] = bandFrom(PART3_LEVEL_BANDS, lv.level);
    const rank = Number(String(lv.level).replace("l", "")) || 1;
    lv.drills.forEach((drill, idx) => {
      push({
        id: `sub.part3.${lv.level}.${drill.id}`,
        title: `Part 3-4 · ${lv.title} — ${drill.title ?? drill.label ?? drill.id}`,
        href: `/subskills/listening/part3/${lv.level}/${drill.id}`,
        kind: "subskill",
        parts: m.parts,
        skill: m.skill,
        tags: m.tags,
        bandMin,
        bandMax,
        estMinutes: m.estMinutes,
        rank: rank * 10 + idx,
        prereq: [],
        evidence: {
          source: "subskill",
          part: part3AttemptKey(lv.level as never),
          questionWord: drill.id,
          minScore: lv.passThreshold ?? m.minScore,
          minExercises: 1,
        },
      });
    });
  }
}

// ── Part 5 · 12 thì × 6 cấp (chỉ thì nào đã có câu) ─────────────────────────
{
  const m = AREA_META.part5Tense;
  for (const tense of TENSES as unknown as {
    slug: string;
    name: string;
    importance: number;
    levels: { slug: string; name: string; passThreshold: number; questions?: unknown[] }[];
  }[]) {
    if (!tense.levels?.length) {
      skipped.push(`part5 ${tense.slug}: chưa có dữ liệu`);
      continue;
    }
    for (const lv of tense.levels) {
      if (!lv.questions?.length) {
        skipped.push(`part5 ${tense.slug}/${lv.slug}: cấp rỗng`);
        continue;
      }
      const [bandMin, bandMax] = bandFrom(LEVEL_BANDS, lv.slug);
      const rank = Number(lv.slug.replace("l", "")) || 1;
      push({
        id: `sub.part5.${tense.slug}.${lv.slug}`,
        title: `Part 5 · ${tense.name} — ${lv.name}`,
        href: `/subskills/reading/part5/${tense.slug}/${lv.slug}`,
        kind: "subskill",
        parts: m.parts,
        skill: m.skill,
        tags: m.tags,
        bandMin,
        bandMax,
        estMinutes: m.estMinutes,
        rank,
        prereq:
          rank > 1 ? [`sub.part5.${tense.slug}.l${rank - 1}`] : [],
        evidence: {
          source: "subskill",
          part: tenseToPartKey(tense.slug),
          questionWord: lv.slug,
          minScore: lv.passThreshold ?? m.minScore,
          minExercises: 1,
        },
      });
    }
  }
}

// ── Liên từ · 10 nhóm × 6 cấp (chỉ nhóm đã có câu) ──────────────────────────
{
  const m = AREA_META.connectors;
  for (const g of CONNECTOR_GROUPS as unknown as {
    slug: string;
    name: string;
    levels: { slug: string; name: string; passThreshold: number; questions?: unknown[] }[];
  }[]) {
    if (!g.levels?.length) {
      skipped.push(`connectors ${g.slug}: chưa có dữ liệu`);
      continue;
    }
    for (const lv of g.levels) {
      if (!lv.questions?.length) {
        skipped.push(`connectors ${g.slug}/${lv.slug}: cấp rỗng`);
        continue;
      }
      const [bandMin, bandMax] = bandFrom(LEVEL_BANDS, lv.slug);
      const rank = Number(lv.slug.replace("l", "")) || 1;
      push({
        id: `sub.conn.${g.slug}.${lv.slug}`,
        title: `Từ nối · ${g.name} — ${lv.name}`,
        href: `/subskills/reading/connectors/${g.slug}/${lv.slug}`,
        kind: "subskill",
        parts: m.parts,
        skill: m.skill,
        tags: m.tags,
        bandMin,
        bandMax,
        estMinutes: m.estMinutes,
        rank,
        prereq: rank > 1 ? [`sub.conn.${g.slug}.l${rank - 1}`] : [],
        evidence: {
          source: "subskill",
          part: connPartKey(g.slug),
          questionWord: lv.slug,
          minScore: lv.passThreshold ?? m.minScore,
          minExercises: 1,
        },
      });
    }
  }
}

// ── Động từ bất quy tắc ─────────────────────────────────────────────────────
{
  const m = AREA_META.verbs;
  for (const g of VERB_GROUPS as unknown as {
    slug: string;
    name: string;
    levels: { slug: string; name: string; passThreshold: number; questions?: unknown[] }[];
  }[]) {
    for (const lv of g.levels ?? []) {
      if (!lv.questions?.length) {
        skipped.push(`verbs ${g.slug}/${lv.slug}: cấp rỗng`);
        continue;
      }
      const [bandMin, bandMax] = bandFrom(LEVEL_BANDS, lv.slug);
      const rank = Number(lv.slug.replace("l", "")) || 1;
      push({
        id: `sub.verbs.${g.slug}.${lv.slug}`,
        title: `Động từ · ${g.name} — ${lv.name}`,
        href: `/subskills/verbs/${g.slug}/${lv.slug}`,
        kind: "subskill",
        parts: m.parts,
        skill: m.skill,
        tags: m.tags,
        bandMin,
        bandMax,
        estMinutes: m.estMinutes,
        rank,
        prereq: rank > 1 ? [`sub.verbs.${g.slug}.l${rank - 1}`] : [],
        evidence: {
          source: "subskill",
          part: verbPartKey(g.slug),
          questionWord: lv.slug,
          minScore: lv.passThreshold ?? m.minScore,
          minExercises: 1,
        },
      });
    }
  }
}

// ── Dịch Anh–Việt ───────────────────────────────────────────────────────────
{
  const m = AREA_META.translation;
  for (const topic of TOPIC_METAS as unknown as { slug: string; name: string }[]) {
    const cfg = getTopicConfig(topic.slug) as unknown as {
      levels: { slug: string; name: string; passThreshold?: number; questions?: unknown[] }[];
    } | null;
    if (!cfg?.levels?.length) {
      skipped.push(`translation ${topic.slug}: chưa có dữ liệu`);
      continue;
    }
    for (const lv of cfg.levels) {
      if (!lv.questions?.length) {
        skipped.push(`translation ${topic.slug}/${lv.slug}: cấp rỗng`);
        continue;
      }
      const [bandMin, bandMax] = bandFrom(LEVEL_BANDS, lv.slug);
      const rank = Number(lv.slug.replace("l", "")) || 1;
      push({
        id: `sub.translation.${topic.slug}.${lv.slug}`,
        title: `Dịch · ${topic.name} — ${lv.name}`,
        href: `/subskills/translation/${topic.slug}/${lv.slug}`,
        kind: "subskill",
        parts: m.parts,
        skill: m.skill,
        tags: m.tags,
        bandMin,
        bandMax,
        estMinutes: m.estMinutes,
        rank,
        prereq: rank > 1 ? [`sub.translation.${topic.slug}.l${rank - 1}`] : [],
        evidence: {
          source: "subskill",
          part: topicToPartKey(topic.slug),
          questionWord: lv.slug,
          minScore: lv.passThreshold ?? m.minScore,
          minExercises: 1,
        },
      });
    }
  }
}

// ── Chunking · nhánh Nghe ───────────────────────────────────────────────────
{
  const m = AREA_META.chunking;
  for (const lv of levelsOf("nghe") as unknown as {
    slug: string;
    title?: string;
    name?: string;
    passThreshold?: number;
  }[]) {
    const [bandMin, bandMax] = bandFrom(LEVEL_BANDS, lv.slug);
    const rank = Number(lv.slug.replace("l", "")) || 1;
    push({
      id: `sub.chunking.nghe.${lv.slug}`,
      title: `Chunking nghe · ${lv.title ?? lv.name ?? lv.slug}`,
      href: `/subskills/chunking/nghe/${lv.slug}`,
      kind: "subskill",
      parts: m.parts,
      skill: m.skill,
      tags: m.tags,
      bandMin,
      bandMax,
      estMinutes: m.estMinutes,
      rank,
      prereq: rank > 1 ? [`sub.chunking.nghe.l${rank - 1}`] : [],
      evidence: {
        source: "subskill",
        part: chunkPartKey("nghe"),
        questionWord: lv.slug,
        minScore: lv.passThreshold ?? m.minScore,
        minExercises: 1,
      },
    });
  }
}

// ── IPA ─────────────────────────────────────────────────────────────────────
{
  const m = AREA_META.ipa;
  for (const section of IPA_SECTIONS) {
    for (const diff of ["easy", "medium", "hard"] as const) {
      const count = ipaExerciseCount(section.key, diff);
      if (!count) {
        skipped.push(`ipa ${section.key}/${diff}: không có bài`);
        continue;
      }
      const [bandMin, bandMax] = bandFrom(DIFFICULTY_BANDS, diff);
      const diffLabel = diff === "easy" ? "Cơ bản" : diff === "medium" ? "Khá" : "Khó";
      push({
        id: `ipa.${section.key}.${diff}`,
        title: `Phát âm · ${section.label} — ${diffLabel}`,
        href:
          diff === "easy"
            ? `/subskills/ipa/${section.key}`
            : `/subskills/ipa/${section.key}?d=${diff}`,
        kind: "ipa",
        parts: m.parts,
        skill: m.skill,
        tags: m.tags,
        bandMin,
        bandMax,
        estMinutes: m.estMinutes,
        rank: DIFFICULTY_RANK[diff],
        prereq:
          diff === "easy"
            ? []
            : diff === "medium"
              ? [`ipa.${section.key}.easy`]
              : [`ipa.${section.key}.medium`],
        evidence: {
          source: "ipa",
          section: section.key,
          difficulty: diff,
          minScore: m.minScore,
          // Không bắt làm hết cả bộ 10 bài mới tính xong — quá nặng cho một việc.
          minExercises: Math.min(3, count),
        },
      });
    }
  }
}

// ── Thẻ ngữ pháp ────────────────────────────────────────────────────────────
{
  const m = AREA_META.grammar;
  for (const topic of GRAMMAR_TOPICS as unknown as {
    slug: string;
    name: string;
    testSizes: number[];
  }[]) {
    topic.testSizes.forEach((size, idx) => {
      const testNo = idx + 1;
      // Đề con càng về sau càng khó → chỉ mở cho tầm điểm cao hơn.
      const bandMin = idx < 2 ? 10 : idx < 6 ? 350 : 500;
      push({
        id: `grammar.${topic.slug}.${testNo}`,
        title: `Ngữ pháp · ${topic.name} — Đề ${testNo}`,
        href: `/grammar/${topic.slug}/${testNo}`,
        kind: "grammar",
        parts: m.parts,
        skill: m.skill,
        tags: m.tags,
        bandMin,
        bandMax: 990,
        estMinutes: grammarMinutes(size),
        rank: testNo,
        prereq: testNo > 1 ? [`grammar.${topic.slug}.${testNo - 1}`] : [],
        evidence: {
          source: "grammar",
          topicSlug: topic.slug,
          // grammar_attempts ghi từng CÂU và không ghi số thứ tự đề, nên điều
          // kiện nói theo câu: làm đủ số câu của đề này kể từ lúc được giao.
          // (Bản đầu đếm luỹ kế cả các đề trước — sai từ khi evidence có cửa sổ
          // thời gian, vì khi đó "đề 3" đòi 55 câu làm trong đúng tuần được giao.)
          minQuestions: size,
          minAccuracy: GRAMMAR_MIN_ACCURACY,
        },
      });
    });
  }
}

// ── Luyện từng part (Part 1, Part 2 — 9 bộ CA) ──────────────────────────────
{
  for (const entry of listPracticeTests()) {
    for (const part of [1, 2] as const) {
      const count = countByPart(entry, part);
      if (!count) {
        skipped.push(`practice ${entry.slug}/part${part}: không có câu`);
        continue;
      }
      const slug = practiceAttemptSlug(entry.testNumber, part);
      push({
        id: `practice.listening.part${part}.${entry.slug}`,
        title: `Luyện Part ${part} · ${entry.title}`,
        href: `/skills/listening/part${part}/${slug}`,
        kind: "part_practice",
        parts: [part as PartNumber],
        skill: "listening",
        tags: ["exam-format"],
        bandMin: 10,
        bandMax: 990,
        estMinutes: partPracticeMinutes(count),
        rank: entry.testNumber,
        prereq: [],
        evidence: {
          source: "part_practice",
          skill: "listening",
          part: part as PartNumber,
          testSlug: slug,
          minAccuracy: EXAM_STYLE_MIN_ACCURACY,
        },
      });
    }
  }
}

// ── Full test · mốc kiểm tra ────────────────────────────────────────────────
{
  const m = AREA_META.fullTest;
  for (const exam of EXAM_SETS) {
    if (!exam.available) continue;
    for (const test of listTests(exam.slug) as unknown as {
      slug: string;
      title: string;
      testNumber: number;
      locked?: boolean;
      missingAnswers?: unknown[];
    }[]) {
      if (test.missingAnswers?.length) {
        skipped.push(`fulltest ${test.slug}: thiếu đáp án`);
        continue;
      }
      // Đề đầu vào KHÔNG được giao lại làm mốc kiểm tra: học viên nhớ đáp án thì
      // điểm tháng sau tăng ảo và cả lộ trình đi sai hướng.
      if (exam.slug === BASELINE_EXAM_SLUG && test.slug === BASELINE_TEST_SLUG) {
        skipped.push(`fulltest ${test.slug}: là đề đầu vào, giữ riêng`);
        continue;
      }
      push({
        id: `fulltest.${exam.slug}.${test.slug}`,
        title: `Thi thử · ${test.title}`,
        href: `/skills/full-tests/${exam.slug}/${test.slug}`,
        kind: "full_test",
        parts: m.parts,
        skill: m.skill,
        tags: m.tags,
        bandMin: 10,
        bandMax: 990,
        estMinutes: m.estMinutes,
        rank: test.testNumber,
        prereq: [],
        evidence: {
          source: "full_test",
          examSlug: exam.slug,
          testSlug: test.slug,
        },
      });
    }
  }
}


items.sort((a, b) => a.id.localeCompare(b.id));
return { items, skipped };
}
