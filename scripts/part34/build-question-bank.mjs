// Gắn nhãn kho câu hỏi Part 3 + Part 4 từ 10 đề EST 2026.
//
// Mỗi bộ Part 3/4 luôn gồm đúng 3 câu, thứ tự cố định trong đề thi thật:
//   - câu 1 (first)  : theo tip thường hỏi nơi chốn / nghề nghiệp / lý do
//   - câu 2 (middle) : vấn đề xuyên suốt
//   - câu 3 (last)   : yêu cầu hoặc hành động tiếp theo
// => nhãn vị trí suy ra miễn phí từ index, không cần gắn tay.
//
// Nhãn chức năng gắn bằng regex; câu nào không khớp rơi vào "detail" với
// confidence = "low" và được liệt kê trong báo cáo để sửa tay sau.
//
// Chạy: node scripts/part34/build-question-bank.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA_DIR = join(ROOT, "lib", "full-tests", "data");
const OUT_DIR = join(ROOT, "scripts", "data", "part34");
const OUT_BANK = join(OUT_DIR, "question-bank.json");
const OUT_REPORT = join(OUT_DIR, "label-report.json");
const OVERRIDES = join(ROOT, "scripts", "part34", "label-overrides.json");

// ─────────────────────────────────────
// Bộ nhãn chức năng
// ─────────────────────────────────────

/**
 * Thứ tự QUAN TRỌNG — quét từ trên xuống, khớp đầu tiên thì dừng.
 * Nhãn đặc thù phải đứng trước nhãn tổng quát.
 */
const LABEL_RULES = [
  {
    label: "graphic",
    labelVi: "Nhìn bảng biểu",
    patterns: [/look at the (graphic|chart|map|list|table|sign|schedule)/i],
  },
  {
    label: "implication",
    labelVi: "Hàm ý câu nói",
    patterns: [
      /what does the (man|woman|speaker) (mean|imply)/i,
      /why does the (man|woman|speaker) say/i,
      /what does the (man|woman|speaker) imply when/i,
      /what does the (man|woman|speaker) mean when (he|she) says/i,
    ],
  },
  {
    label: "next_action",
    labelVi: "Hành động tiếp theo / yêu cầu",
    patterns: [
      /will .{0,30}\b(do|happen)\b.{0,20}next/i,
      /will .{0,40}\bnext\s*\??$/i,
      /what will the (man|woman|speaker|speakers|listeners)/i,
      /^what will \w+ (most likely )?do\b/i,
      /(what|how|why) does the (man|woman|speaker) (suggest|recommend|propose|offer|ask|request|instruct|invite|encourage|remind|want)/i,
      /(how|what|where|when|why) (can|should|must|will) the listeners/i,
      /what are the listeners (asked|invited|encouraged|instructed|told|advised)/i,
      /what does the (man|woman|speaker) say (he|she|they) (will|needs? to|has to|have to|is going to|are going to|plans? to|wants? to|should)/i,
      /what does the (man|woman|speaker) say (he|she|they) is (planning|going)/i,
      /what (does|do) the (man|woman|speaker|speakers) (plan|agree|decide|intend|offer) to do/i,
      /what are the speakers (going to|planning to|preparing to) do/i,
      /\blisteners? (should|can|must|need to|are advised to)\b/i,
      /(what|why|how) should the listeners?/i,
      /what is the (man|woman|listener) (asked|instructed|advised) to do/i,
      /what task does the (man|woman) ask/i,
    ],
  },
  {
    label: "problem",
    labelVi: "Vấn đề / lo ngại",
    patterns: [
      /what (is|was) the problem/i,
      /what problem/i,
      /(concerned|worried) about/i,
      /what is the (man|woman|speaker) (concerned|worried)/i,
      /what (issue|difficulty|complaint)/i,
      /why is .{0,30}\b(delayed|unavailable|closed|cancell?ed)\b/i,
      /what caused/i,
    ],
  },
  {
    label: "purpose",
    labelVi: "Mục đích / chủ đề",
    patterns: [
      /what is the (main )?(purpose|topic|subject|focus)/i,
      /what (are|is) the (speakers?|man|woman) (mainly )?(discussing|talking about)/i,
      /what is the (talk|announcement|message|broadcast|conversation|podcast|meeting|tour|presentation|workshop) (mainly )?about/i,
      /what is the focus of/i,
      /\bare the speakers (mainly )?discussing/i,
      /what .{0,20}(event|project|task) (are|is) the (speakers?|man|woman) (planning|preparing|discussing|organizing)/i,
      /why is the (man|woman|speaker) (calling|visiting|contacting)/i,
      /what is the (man|woman|speaker) (calling|announcing) about/i,
      /why is the (man|woman|speaker) (in|at) /i,
      /what is being (announced|advertised|introduced)/i,
      /what is the reason for the (call|visit|meeting)/i,
    ],
  },
  {
    label: "place_business",
    labelVi: "Nơi chốn / loại hình công ty",
    patterns: [
      /^where /i,
      /where (most likely )?(are|is|does|do|did)/i,
      /what (type|kind|sort) of \w* ?(business|company|organization|store|shop|facility|industry|establishment|product)/i,
      /where does (this|the) (conversation|talk|announcement) take place/i,
      /what (industry|business|field) (is|are|do|does|was|were)/i,
      /what (industry|business|field) (do|does) the (speakers?|men|man|woman)/i,
      /what (field|industry) does the (man|woman|speaker)/i,
      /what does the (speakers?'?s?|man'?s|woman'?s) (company|business|store|organization) (sell|make|produce|provide|offer)/i,
      /what does the (man|woman|speaker) say the company (sells|makes|produces)/i,
    ],
  },
  {
    label: "identity",
    labelVi: "Danh tính / nghề nghiệp",
    patterns: [
      /^who /i,
      /who (most likely )?(is|are|does|did)/i,
      /what (most likely )?is the (man|woman|speaker)'?s? (job|profession|occupation|position|role|area of expertise|field)/i,
      /what is the (man|woman|speaker)'?s? (job|profession|occupation|position|role)/i,
      /(which|what) department does the (man|woman|speaker)/i,
      /for whom does/i,
      /who (is|are) the (listeners|audience)/i,
      /how do the speakers know each other/i,
    ],
  },
  {
    // Nhãn tổng quát nhưng vẫn tính là bắt được — đây là những khuôn "hỏi chi
    // tiết" xuất hiện dày đặc trong đề, không phải câu chưa gắn nhãn.
    label: "detail",
    labelVi: "Chi tiết cụ thể",
    patterns: [
      /^according to the (speaker|man|woman|speakers|conversation|announcement|talk)/i,
      /what does the (man|woman|speaker) say about/i,
      /what (is|are) (mentioned|indicated|stated|said|reported) about/i,
      /what does the (man|woman|speaker) (mention|indicate|state|note|emphasize|point out|share|add)/i,
      // Bao quát: mọi câu còn lại bắt đầu bằng từ để hỏi đều là hỏi chi tiết.
      // Gắn confidence "medium" (xem classify) để vẫn audit lại được.
      /^(what|when|where|why|which|who|how)\b/i,
      /^according to\b/i,
    ],
  },
];

const FALLBACK_LABEL = "detail";
const FALLBACK_LABEL_VI = "Chi tiết cụ thể";

/** Nhãn được tip coi là "hợp format" ở từng vị trí */
const TIP_EXPECTED = {
  first: ["place_business", "identity", "purpose"],
  middle: ["problem"],
  last: ["next_action"],
};

const POSITIONS = ["first", "middle", "last"];

// ─────────────────────────────────────
// Gắn nhãn
// ─────────────────────────────────────

function classify(prompt) {
  if (!prompt) return { label: FALLBACK_LABEL, labelVi: FALLBACK_LABEL_VI, confidence: "low" };
  const text = prompt.trim();
  for (const rule of LABEL_RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      // "detail" là nhãn bao quát — nhận diện chắc chắn kém hơn nhãn đặc thù.
      return {
        label: rule.label,
        labelVi: rule.labelVi,
        confidence: rule.label === FALLBACK_LABEL ? "medium" : "high",
      };
    }
  }
  return { label: FALLBACK_LABEL, labelVi: FALLBACK_LABEL_VI, confidence: "low" };
}

function loadOverrides() {
  if (!existsSync(OVERRIDES)) return {};
  return JSON.parse(readFileSync(OVERRIDES, "utf8"));
}

// ─────────────────────────────────────
// Build
// ─────────────────────────────────────

const overrides = loadOverrides();
const groups = [];
const unlabeled = [];

for (let n = 1; n <= 10; n++) {
  const test = JSON.parse(readFileSync(join(DATA_DIR, `est-2026-test-${n}.json`), "utf8"));

  for (const g of test.groups) {
    if (g.part !== 3 && g.part !== 4) continue;

    if (g.questions.length !== 3) {
      console.warn(
        `! ${test.slug} part ${g.part} câu ${g.questionStart}-${g.questionEnd}: ` +
          `${g.questions.length} câu (chờ 3) — bỏ qua`
      );
      continue;
    }

    const groupId = `${test.slug}-q${g.questionStart}-${g.questionEnd}`;

    const questions = g.questions.map((q, i) => {
      const position = POSITIONS[i];
      const overrideKey = `${test.slug}#${q.number}`;
      const auto = classify(q.prompt);
      const overridden = overrides[overrideKey];

      const label = overridden ?? auto.label;
      const labelVi =
        LABEL_RULES.find((r) => r.label === label)?.labelVi ??
        (label === FALLBACK_LABEL ? FALLBACK_LABEL_VI : label);
      const confidence = overridden ? "manual" : auto.confidence;

      if (confidence === "low") {
        unlabeled.push({ key: overrideKey, position, prompt: q.prompt });
      }

      return {
        number: q.number,
        position,
        label,
        labelVi,
        confidence,
        matchesTip: TIP_EXPECTED[position].includes(label),
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
        translation: q.explanation?.translation ?? null,
        reasoning: q.explanation?.reasoning ?? null,
      };
    });

    groups.push({
      groupId,
      testSlug: test.slug,
      testNumber: test.testNumber,
      part: g.part,
      questionStart: g.questionStart,
      questionEnd: g.questionEnd,
      audioUrl: g.audio ? `${test.audioBase}/${g.audio}` : null,
      image: g.image ?? null,
      transcript: g.transcript ?? null,
      keywords: g.keywords ?? [],
      questions,
    });
  }
}

// ─────────────────────────────────────
// Thống kê — kiểm chứng tip
// ─────────────────────────────────────

const allQuestions = groups.flatMap((g) => g.questions);

const byPosition = {};
for (const position of POSITIONS) {
  const qs = allQuestions.filter((q) => q.position === position);
  const counts = {};
  for (const q of qs) counts[q.label] = (counts[q.label] ?? 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const followsTip = qs.filter((q) => q.matchesTip).length;

  byPosition[position] = {
    total: qs.length,
    followsTip,
    followsTipPct: Math.round((followsTip / qs.length) * 1000) / 10,
    labels: Object.fromEntries(
      sorted.map(([label, count]) => [
        label,
        { count, pct: Math.round((count / qs.length) * 1000) / 10 },
      ])
    ),
  };
}

const tally = (c) => allQuestions.filter((q) => q.confidence === c).length;
const highConf = tally("high");
const mediumConf = tally("medium");
const lowConf = tally("low");

const report = {
  generatedFrom: "est-2026 test 1-10",
  groups: groups.length,
  questions: allQuestions.length,
  groupsPart3: groups.filter((g) => g.part === 3).length,
  groupsPart4: groups.filter((g) => g.part === 4).length,
  groupsMissingTranscript: groups.filter((g) => !g.transcript).length,
  groupsMissingAudio: groups.filter((g) => !g.audioUrl).length,
  labelCoverage: {
    /** Khớp luật đặc thù (7 nhãn ngoài "detail") */
    high: highConf,
    /** Rơi vào "detail" qua luật bao quát */
    medium: mediumConf,
    /** Không nhận ra — cần gắn tay qua label-overrides.json */
    low: lowConf,
    manual: tally("manual"),
    specificPct: Math.round((highConf / allQuestions.length) * 1000) / 10,
  },
  byPosition,
  needsManualLabel: unlabeled,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_BANK, JSON.stringify({ groups }, null, 1), "utf8");
writeFileSync(OUT_REPORT, JSON.stringify(report, null, 1), "utf8");

console.log(`Bộ: ${report.groups} (P3 ${report.groupsPart3} / P4 ${report.groupsPart4})`);
console.log(`Câu: ${report.questions}`);
console.log(`Thiếu transcript: ${report.groupsMissingTranscript} | thiếu audio: ${report.groupsMissingAudio}`);
console.log(
  `Nhãn: đặc thù ${highConf} (${report.labelCoverage.specificPct}%) | detail ${mediumConf} | chưa nhận ra ${lowConf}`
);
for (const position of POSITIONS) {
  const p = byPosition[position];
  console.log(`  ${position.padEnd(6)} theo tip ${p.followsTipPct}% — ${Object.entries(p.labels).slice(0, 4).map(([l, v]) => `${l} ${v.pct}%`).join(", ")}`);
}
console.log(`\n-> ${OUT_BANK}`);
console.log(`-> ${OUT_REPORT}`);
