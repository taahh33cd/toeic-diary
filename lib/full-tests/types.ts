// Kiểu dữ liệu đề full test — khớp output của scripts/full-tests/build_est2026.py

export type PartNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface GlossaryTerm {
  term: string;
  pos: string;
  ipa: string;
  meaning: string;
}

export interface Explanation {
  translation?: string | null;
  reasoning?: string | null;
  glossary?: GlossaryTerm[];
  /** Có khi không tách được trường nào — UI render nguyên khối */
  raw?: string;
}

export interface FullTestQuestion {
  number: number;
  part: PartNumber;
  /** Part 1/2 không có đề bài; Part 6 chỗ trống nằm trong passage */
  prompt: string | null;
  /** Part 2 chỉ có 3 phương án A-C */
  options: Record<string, string> | null;
  /** false với Part 1/2 — trong lúc thi không hiện chữ, chỉ hiện khi review */
  showText: boolean;
  /** Đề bài trong docx gốc là placeholder ảnh ⇒ không làm được */
  broken: boolean;
  answer: string | null;
  explanation: Explanation | null;
}

export interface Passage {
  label: string;
  text: string;
}

/** Một nhóm = một đơn vị chia sẻ audio/ảnh/passage giữa nhiều câu */
export interface FullTestGroup {
  part: PartNumber;
  questionStart: number;
  questionEnd: number;
  /** Tên file mp3, ghép với audioBase; chỉ có ở Part 1-4 */
  audio?: string;
  image?: string | null;
  transcript?: string | null;
  keywords?: GlossaryTerm[];
  /** Part 6/7 */
  intro?: string;
  passages?: Passage[];
  questions: FullTestQuestion[];
}

export interface FullTestStats {
  questions: number;
  answered: number;
  missingAnswers: number[];
  brokenQuestions: number[];
}

export interface FullTest {
  examSlug: string;
  examTitle: string;
  testNumber: number;
  slug: string;
  title: string;
  audioBase: string;
  locked: boolean;
  lockReason: string | null;
  stats: FullTestStats;
  groups: FullTestGroup[];
  warnings: string[];
}

export interface CatalogEntry extends FullTestStats {
  slug: string;
  testNumber: number;
  title: string;
  locked: boolean;
  lockReason: string | null;
}

export interface Catalog {
  examSlug: string;
  examTitle: string;
  tests: CatalogEntry[];
}
