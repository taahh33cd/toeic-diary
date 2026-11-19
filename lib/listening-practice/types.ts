// Kiểu dữ liệu bộ luyện nghe Part 1 / Part 2 — khớp output của
// scripts/listening-practice/import.ts

export type ListeningPart = 1 | 2;

/** Part có bộ luyện riêng ở /skills/listening/partN (Part 3 nằm ở ./part3.ts) */
export type PracticePart = 1 | 2 | 3;

/** Một thẻ đề ở trang danh sách — dùng chung cho mọi part */
export interface PracticeListItem {
  slug: string;
  testNumber: number;
  title: string;
  /** Dòng phụ dưới tên đề, vd "25 câu" */
  detail: string;
}

export interface PracticeOption {
  id: string;
  text: string;
}

export interface PracticeQuestion {
  number: number;
  part: ListeningPart;
  /** Script câu hỏi — chỉ hiện khi xem lại, không hiện lúc làm bài */
  prompt: string;
  options: PracticeOption[];
  answer: string;
  /** null = thiếu file audio gốc ⇒ câu bị khoá, không tính điểm */
  audio: string | null;
  image: string | null;
  /** Kích thước gốc của ảnh — UI dùng để không phóng to quá mức (ảnh nguồn 175–790px) */
  imageWidth?: number;
  imageHeight?: number;
}

export interface PracticeTest {
  slug: string;
  testNumber: number;
  title: string;
  /** Nhãn folder gốc — chỉ để đối chiếu, không hiện ra UI */
  source: string;
  questions: PracticeQuestion[];
}

export interface PracticeCatalogEntry {
  slug: string;
  testNumber: number;
  title: string;
  source: string;
  part1: number;
  part2: number;
  /** Số câu thiếu audio gốc */
  missingAudio: number[];
}

export interface PracticeCatalog {
  tests: PracticeCatalogEntry[];
}
