import { VERBS } from "./data/verbs";
import { GROUP_SENTENCES } from "./data/sentences";
import {
  SHAPE_LABEL,
  SHAPE_HINT,
  type Verb,
  type VerbShape,
  type VerbGroupConfig,
  type VerbLevel,
  type VerbMatching,
  type VerbTyping,
  type LevelSlug,
  type BestScore,
} from "./types";

// ── Level metadata ───────────────────────────────────────────────────────────

export function buildLevelMeta(): Omit<VerbLevel, "questions">[] {
  return [
    {
      level: 1, slug: "l1",
      name: "Nhận diện dạng biến đổi",
      nameEn: "Pattern Recognition",
      description: "Động từ này thuộc dạng nào: không đổi, V2=V3, hay cả 3 khác?",
      instruction:
        "Bấm chọn một động từ rồi bấm vào cột đúng. Nhận ra DẠNG biến đổi là bước đầu để nhớ nhanh — thay vì học vẹt từng từ.",
      difficulty: "easy", passThreshold: 80,
    },
    {
      level: 2, slug: "l2",
      name: "Gõ V2 — Quá khứ đơn",
      nameEn: "Type the Past Simple",
      description: "Tự gõ dạng quá khứ đơn của động từ.",
      instruction:
        "Nhìn động từ nguyên mẫu và nghĩa, rồi TỰ GÕ dạng V2. Gõ ra được mới thực sự là nhớ — khác hẳn với việc chỉ nhận ra khi thấy đáp án.",
      difficulty: "easy", passThreshold: 80,
    },
    {
      level: 3, slug: "l3",
      name: "Gõ V3 — Quá khứ phân từ",
      nameEn: "Type the Past Participle",
      description: "Tự gõ dạng quá khứ phân từ — dạng TOEIC hay hỏi nhất.",
      instruction:
        "Gõ dạng V3. Đây là dạng dùng cho thì hoàn thành (have + V3) và câu bị động (be + V3) — chiếm phần lớn câu hỏi động từ trong Part 5.",
      difficulty: "medium", passThreshold: 80,
    },
    {
      level: 4, slug: "l4",
      name: "Gõ cả V2 + V3",
      nameEn: "Type Both Forms",
      description: "Gõ đủ cả hai dạng — phải đúng cả hai mới được tính điểm.",
      instruction:
        "Gõ cả V2 và V3. Phải đúng CẢ HAI ô mới được tính là đúng. Đây là bài kiểm tra thật sự xem bạn đã thuộc chưa.",
      difficulty: "medium", passThreshold: 80,
    },
    {
      level: 5, slug: "l5",
      name: "Điền vào câu",
      nameEn: "Fill in Context",
      description: "Chọn V2 hay V3 tuỳ ngữ cảnh câu, rồi gõ vào.",
      instruction:
        "Đọc câu và gõ dạng đúng của động từ trong ngoặc. Phải tự quyết định dùng V2 (quá khứ đơn) hay V3 (hoàn thành / bị động).",
      difficulty: "hard", passThreshold: 80,
    },
    {
      level: 6, slug: "l6",
      name: "TOEIC Part 5",
      nameEn: "Exam Style",
      description: "Câu hỏi đúng định dạng đề thi — không có gợi ý.",
      instruction:
        "Làm bài như trong phòng thi TOEIC thật. Không có bản dịch, không có động từ gợi ý.",
      difficulty: "hard", passThreshold: 80,
    },
  ];
}

// ── Group definitions ────────────────────────────────────────────────────────

type GroupMeta = {
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  sample: string;
  importance: 1 | 2 | 3;
};

const GROUP_META: GroupMeta[] = [
  {
    slug: "khong-doi",
    name: "Không đổi",
    nameEn: "No Change (V1 = V2 = V3)",
    description:
      "Cả ba dạng viết giống hệt nhau. Lỗi hay gặp nhất là thêm '-ed' vào (costed, putted) — hoàn toàn sai.",
    sample: "cut – cut – cut",
    importance: 3,
  },
  {
    slug: "v2v3-duoi-t",
    name: "V2 = V3, đuôi -t",
    nameEn: "V2 = V3 ending in -t",
    description:
      "V2 và V3 giống nhau và đều kết thúc bằng -t. Gồm hai cụm dễ nhớ: -ought/-aught (buy, teach, catch) và -d đổi thành -t (send, build, spend).",
    sample: "buy – bought – bought",
    importance: 3,
  },
  {
    slug: "v2v3-doi-nguyen-am",
    name: "V2 = V3, đổi nguyên âm",
    nameEn: "V2 = V3 with vowel change",
    description:
      "V2 và V3 giống nhau, chỉ đổi nguyên âm bên trong. Nhóm đông nhất và chứa nhiều động từ tần suất cao nhất của TOEIC.",
    sample: "find – found – found",
    importance: 3,
  },
  {
    slug: "ba-dang-khac-1",
    name: "Cả 3 khác — nhóm i/a/u và -own",
    nameEn: "All Different — i/a/u & -own",
    description:
      "Ba dạng khác nhau theo hai quy luật rất đều: i–a–u (begin–began–begun) và -ow/-ew/-own (know–knew–known).",
    sample: "begin – began – begun",
    importance: 2,
  },
  {
    slug: "ba-dang-khac-2",
    name: "Cả 3 khác — V3 đuôi -en",
    nameEn: "All Different — V3 ends in -en",
    description:
      "Ba dạng khác nhau, và V3 luôn kết thúc bằng -en/-n. Đây là nhóm hay bị dùng sai nhất trong câu bị động và thì hoàn thành.",
    sample: "take – took – taken",
    importance: 3,
  },
  {
    slug: "dac-biet",
    name: "Đặc biệt & dễ nhầm",
    nameEn: "Special & Confusable",
    description:
      "Các động từ không theo quy luật nào (go, do, be), nhóm V1 = V3 (come–came–come), và cặp bẫy kinh điển lie / lay.",
    sample: "go – went – gone",
    importance: 3,
  },
];

// ── Generators: L1–L4 sinh tự động từ bảng động từ ───────────────────────────

/** Sắp xếp: tần suất cao lên trước, giữ thứ tự ổn định */
function byFrequency(a: Verb, b: Verb): number {
  if (b.freq !== a.freq) return b.freq - a.freq;
  return a.v1.localeCompare(b.v1);
}

function acceptedV2(v: Verb): string[] {
  return v.acceptV2 ?? [v.v2];
}
function acceptedV3(v: Verb): string[] {
  return v.acceptV3 ?? [v.v3];
}

/**
 * L1 — matching: xếp động từ vào đúng dạng biến đổi.
 * Mỗi câu lấy 4 động từ của nhóm + 2 động từ tương phản (dạng khác) để
 * bảng luôn có ít nhất 2 cột, tránh trường hợp mọi từ rơi vào một cột.
 */
function buildL1(groupVerbs: Verb[]): VerbMatching[] {
  const groupShapes = new Set(groupVerbs.map((v) => v.shape));
  const contrast = VERBS.filter(
    (v) => !groupShapes.has(v.shape) && v.freq === 3,
  );
  // Nhóm đã có nhiều dạng (ví dụ "Đặc biệt") thì không cần từ tương phản.
  const needContrast = groupShapes.size < 2;

  const questions: VerbMatching[] = [];
  for (let i = 0; i < 20; i++) {
    const picked: Verb[] = [];
    const push = (v: Verb | undefined) => {
      if (v && !picked.some((p) => p.v1 === v.v1)) picked.push(v);
    };

    const g = groupVerbs.length;
    push(groupVerbs[i % g]);
    push(groupVerbs[(i + 7) % g]);
    push(groupVerbs[(i + 13) % g]);
    if (!needContrast) push(groupVerbs[(i + 17) % g]);

    if (needContrast && contrast.length > 0) {
      const c = contrast.length;
      push(contrast[i % c]);
      push(contrast[(i + 5) % c]);
      push(contrast[(i + 9) % c]);
    } else {
      push(groupVerbs[(i + 3) % g]);
      push(groupVerbs[(i + 11) % g]);
    }

    const shapes = Array.from(new Set(picked.map((v) => v.shape)));
    const ORDER: VerbShape[] = ["AAA", "ABB", "ABA", "ABC"];
    shapes.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));

    questions.push({
      kind: "matching",
      id: `vb-${groupVerbs[0].group}-l1-q${String(i + 1).padStart(2, "0")}`,
      instruction: "Xếp mỗi động từ vào đúng dạng biến đổi của nó.",
      buckets: shapes.map((s) => ({ id: s, label: SHAPE_LABEL[s], hint: SHAPE_HINT[s] })),
      items: picked.map((v) => ({ text: v.v1, bucket: v.shape })),
      explanation: picked
        .map((v) => `${v.v1} – ${v.v2} – ${v.v3} (${SHAPE_LABEL[v.shape]})`)
        .join(" · "),
    });
  }
  return questions;
}

/** L2 / L3 / L4 — typing */
function buildTyping(
  groupVerbs: Verb[],
  fields: ("v2" | "v3")[],
  levelKey: string,
): VerbTyping[] {
  return [...groupVerbs].sort(byFrequency).map((v, i) => ({
    kind: "typing" as const,
    id: `vb-${v.group}-${levelKey}-q${String(i + 1).padStart(2, "0")}`,
    v1: v.v1,
    vi: v.vi,
    fields,
    accepted: {
      ...(fields.includes("v2") ? { v2: acceptedV2(v) } : {}),
      ...(fields.includes("v3") ? { v3: acceptedV3(v) } : {}),
    },
    display: { v2: v.v2, v3: v.v3 },
    note: v.note,
  }));
}

function buildLevels(groupSlug: string, groupVerbs: Verb[]): VerbLevel[] {
  const meta = buildLevelMeta();
  const withQuestions = (slug: LevelSlug, questions: VerbLevel["questions"]) => {
    const m = meta.find((x) => x.slug === slug)!;
    return { ...m, questions };
  };

  // L5 / L6 cần câu ngữ cảnh nên phải soạn tay; nhóm nào chưa soạn thì để rỗng.
  const sentences = GROUP_SENTENCES[groupSlug];

  return [
    withQuestions("l1", buildL1(groupVerbs)),
    withQuestions("l2", buildTyping(groupVerbs, ["v2"], "l2")),
    withQuestions("l3", buildTyping(groupVerbs, ["v3"], "l3")),
    withQuestions("l4", buildTyping(groupVerbs, ["v2", "v3"], "l4")),
    withQuestions("l5", sentences?.l5 ?? []),
    withQuestions("l6", sentences?.l6 ?? []),
  ];
}

// ── Exported group configs ───────────────────────────────────────────────────

export const VERB_GROUPS: VerbGroupConfig[] = GROUP_META.map((m) => {
  const verbs = VERBS.filter((v) => v.group === m.slug);
  return { ...m, verbs, levels: buildLevels(m.slug, verbs) };
});

// ── Lookup helpers ───────────────────────────────────────────────────────────

export function getVerbGroup(slug: string): VerbGroupConfig | undefined {
  return VERB_GROUPS.find((g) => g.slug === slug);
}

export function getLevelUnlockReq(levelSlug: LevelSlug): LevelSlug | null {
  if (levelSlug === "l1" || levelSlug === "l2") return null;
  if (levelSlug === "l3" || levelSlug === "l4") return "l2";
  return "l4";
}

export function isLevelUnlocked(
  levelSlug: LevelSlug,
  best: Record<string, BestScore>,
  isTestUser: boolean,
): boolean {
  if (isTestUser) return true;
  const req = getLevelUnlockReq(levelSlug);
  if (!req) return true;
  return best[req]?.passed === true;
}

export { VERBS };
