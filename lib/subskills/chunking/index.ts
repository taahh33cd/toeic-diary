// Subskill Chunking — luyện cắt câu thành thought group ở cả hai đầu:
//   • nhánh NÓI  : đọc/nói thành cụm để khỏi vụn, khỏi ngắt giữa cụm
//   • nhánh NGHE : bắt nghĩa theo cụm thay vì nghe từng từ rời
//
// Cùng một quy ước ranh giới cho hai nhánh (xem `chunker.ts`), nên cụm học sinh
// tập đọc ở nhánh Nói đúng là cụm họ phải bắt ở nhánh Nghe.

import listenData from "@/lib/subskills/chunking/data/listen.json";
import { SPEAK_PASSAGES, SPEAK_SAMPLES, type SpeakPassage, type SpeakSample } from "./speak";

export type Branch = "noi" | "nghe";
export type LevelSlug = "l1" | "l2" | "l3";

export type ListenChunk = { text: string; start: number; end: number; pause: number };
export type ListenLine = { speaker: string | null; text: string; chunks: ListenChunk[] };
export type ListenPassage = {
  groupId: string;
  part: 3 | 4;
  label: string;
  audioUrl: string;
  duration: number;
  lines: ListenLine[];
};

export const LISTEN_PASSAGES = (listenData as { passages: ListenPassage[] }).passages;

/** Dạng bài của từng cấp — quyết định trình chạy nào được dùng. */
export type DrillKind =
  | "mark-boundary" // Nói L1: bấm vào khoảng trắng để cắt chunk
  | "match-meaning" // Nói L2: nối chunk với nghĩa Việt + chọn đỉnh nhấn
  | "read-aloud" // Nói L3: thu âm, Azure đo nhịp ngắt
  | "catch-chunk" // Nghe L1: nghe một chunk, chọn đúng cụm
  | "order-chunks" // Nghe L2: xếp chunk theo thứ tự nghe được
  | "chunk-dictation"; // Nghe L3: audio dừng cuối mỗi chunk, gõ lại

export type ChunkingLevel = {
  branch: Branch;
  slug: LevelSlug;
  name: string;
  goal: string;
  instruction: string;
  kind: DrillKind;
  passThreshold: number;
  /** Nhánh Nói: id đoạn trong `speak.ts`. Nhánh Nghe: groupId trong listen.json */
  sources: string[];
  /** Chỉ cấp 3 nhánh Nói — thêm bài mẫu nói tự do sau phần đọc to */
  sampleIds?: string[];
};

export const CHUNKING_LEVELS: ChunkingLevel[] = [
  {
    branch: "noi",
    slug: "l1",
    name: "Thấy được chunk",
    goal: "Nhìn một câu dài mà cắt ngay ra được các cụm nghĩa",
    instruction:
      "Bấm vào khoảng trắng giữa hai từ để cắt câu thành cụm. Cắt trước giới từ, trước liên từ, sau dấu câu; đừng cắt giữa 'a / three o'clock appointment' hay giữa 'will / be'.",
    kind: "mark-boundary",
    passThreshold: 75,
    sources: ["voice-mail", "airport-announce", "museum-tour"],
  },
  {
    branch: "noi",
    slug: "l2",
    name: "Nghĩa của cụm & đỉnh nhấn",
    goal: "Hiểu cả cụm một lượt, và biết nhấn vào đâu trong cụm",
    instruction:
      "Hai việc cho mỗi cụm: chọn nghĩa tiếng Việt của CẢ CỤM (không dịch từng từ), rồi bấm vào từ nhận đỉnh nhấn — thường là từ nội dung cuối cụm.",
    kind: "match-meaning",
    passThreshold: 75,
    sources: ["traffic-report", "speaker-intro", "advertisement"],
  },
  {
    branch: "noi",
    slug: "l3",
    name: "Đọc & nói theo chunk",
    goal: "Nói trôi từng cụm, không lắp giữa cụm",
    instruction:
      "Đọc to cả đoạn, ngắt đúng chỗ đã học. Bản thu được đo ba thứ: có dừng ở các chỗ ngắt lớn không, có kéo dài từ cuối mỗi cụm không (đây là cách tiếng Anh đánh dấu ranh giới cụm), và có ngắt sai giữa lòng cụm không.",
    kind: "read-aloud",
    passThreshold: 70,
    sources: ["voice-mail", "advertisement"],
    sampleIds: ["q5-7-store", "q5-7-transport", "q11-remote", "q11-training"],
  },
  {
    branch: "nghe",
    slug: "l1",
    name: "Bắt một cụm",
    goal: "Nghe một cụm rời mà nhận ra ranh giới của nó",
    instruction:
      "Mỗi câu chỉ phát ĐÚNG một cụm. Bốn phương án chỉ khác nhau ở chỗ cắt — chọn cụm có ranh giới đúng như bạn nghe.",
    kind: "catch-chunk",
    passThreshold: 75,
    sources: [
      "est-2026-test-1-q32-34",
      "est-2026-test-1-q35-37",
      "est-2026-test-1-q38-40",
      "est-2026-test-1-q44-46",
      "est-2026-test-1-q47-49",
    ],
  },
  {
    branch: "nghe",
    slug: "l2",
    name: "Xếp cụm theo thứ tự",
    goal: "Nghe cả dòng mà giữ được trật tự các cụm trong đầu",
    instruction:
      "Nghe cả dòng rồi bấm các cụm theo đúng thứ tự nghe được. Nghe lại thoải mái, nhưng đừng đọc từng từ — bám vào cụm.",
    kind: "order-chunks",
    passThreshold: 75,
    sources: [
      "est-2026-test-1-q53-55",
      "est-2026-test-1-q62-64",
      "est-2026-test-1-q71-73",
      "est-2026-test-1-q74-76",
      "est-2026-test-1-q77-79",
    ],
  },
  {
    branch: "nghe",
    slug: "l3",
    name: "Gõ lại từng cụm",
    goal: "Giữ nguyên một cụm trong đầu đủ lâu để viết lại",
    instruction:
      "Audio dừng ở cuối mỗi cụm. Gõ lại đúng cụm vừa nghe. Chấm theo cụm: sai một từ chức năng vẫn tính, thiếu từ nội dung thì không.",
    kind: "chunk-dictation",
    passThreshold: 70,
    sources: [
      "est-2026-test-1-q80-82",
      "est-2026-test-1-q83-85",
      "est-2026-test-1-q86-88",
      "est-2026-test-1-q89-91",
      "est-2026-test-1-q92-94",
    ],
  },
];

export const BRANCHES: Record<Branch, { label: string; emoji: string; blurb: string }> = {
  noi: {
    label: "Nói theo chunk",
    emoji: "🗣",
    blurb: "Đọc to và nói thành cụm — chữa tật ngắt sai chỗ, nói vụn, nhấn đều như máy đọc",
  },
  nghe: {
    label: "Nghe theo chunk",
    emoji: "🎧",
    blurb: "Bắt nghĩa theo cụm trong hội thoại Part 3 và độc thoại Part 4, thay vì nghe từng từ rời",
  },
};

export function getLevel(branch: Branch, slug: string): ChunkingLevel | undefined {
  return CHUNKING_LEVELS.find((l) => l.branch === branch && l.slug === slug);
}

export function levelsOf(branch: Branch): ChunkingLevel[] {
  return CHUNKING_LEVELS.filter((l) => l.branch === branch);
}

export function getListenPassage(groupId: string): ListenPassage | undefined {
  return LISTEN_PASSAGES.find((p) => p.groupId === groupId);
}

export function speakPassagesOf(level: ChunkingLevel): SpeakPassage[] {
  return level.sources
    .map((id) => SPEAK_PASSAGES.find((p) => p.id === id))
    .filter((p): p is SpeakPassage => !!p);
}

export function speakSamplesOf(level: ChunkingLevel): SpeakSample[] {
  return (level.sampleIds ?? [])
    .map((id) => SPEAK_SAMPLES.find((s) => s.id === id))
    .filter((s): s is SpeakSample => !!s);
}

/** Khoá lưu điểm trong bảng subskill_attempts */
export function attemptPart(branch: Branch): string {
  return `chunking-${branch}`;
}
