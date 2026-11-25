/**
 * lib/homework/library.ts — phần dùng chung (client + server) của khung soạn BTVN.
 *
 * Kho bài = danh mục của Lộ trình (lib/roadmap/catalog). Ở đây chỉ có kiểu dữ
 * liệu gọn gửi xuống trình duyệt và mấy hàm thuần: xếp bài vào mục nào, nhận ra
 * một link có phải của web mình không.
 */

import type { CatalogItem } from "@/lib/roadmap/types";

export type HwCatKey = "vocab" | "listening" | "reading" | "practice" | "other";

export const HW_CATS: { key: HwCatKey; label: string; color: string; hint?: string }[] = [
  { key: "vocab", label: "Từ vựng", color: "#3B82F6" },
  { key: "reading", label: "Đọc", color: "#10B981" },
  { key: "listening", label: "Nghe", color: "#F97316" },
  { key: "other", label: "Khác", color: "#8B5CF6" },
  {
    key: "practice",
    label: "Đề luyện thi",
    color: "#EF4444",
    hint: "Học viên mở đề → làm → nộp link → nhập điểm ở Tab Điểm số",
  },
];

/** Một bài trong kho, bản gọn gửi xuống client (không kèm điều kiện chấm). */
export type LibItem = {
  id: string;
  title: string;
  href: string;
  kind: CatalogItem["kind"];
  skill: CatalogItem["skill"];
  parts: number[];
  bandMin: number;
  bandMax: number;
  minutes: number;
};

export function toLibItem(c: CatalogItem): LibItem {
  return {
    id: c.id,
    title: c.title,
    href: c.href,
    kind: c.kind,
    skill: c.skill,
    parts: c.parts,
    bandMin: c.bandMin,
    bandMax: c.bandMax,
    minutes: c.estMinutes,
  };
}

export const KIND_LABEL: Record<LibItem["kind"], string> = {
  subskill: "Kỹ năng",
  part_practice: "Luyện part",
  full_test: "Full test",
  grammar: "Ngữ pháp",
  ipa: "Phát âm",
  submission: "Nói/Viết",
  shadow: "Shadowing",
};

/** Bài trong kho nên nằm ở mục nào của BTVN. */
export function sectionForLib(item: Pick<LibItem, "kind" | "skill">): HwCatKey {
  if (item.kind === "full_test") return "practice";
  if (item.skill === "listening") return "listening";
  if (item.skill === "reading") return "reading";
  return "other";
}

/** Tên miền của web, để nhận ra link dán vào là bài nội bộ. */
const OWN_HOSTS = ["toeic-dictation-diary.vercel.app", "localhost"];

/**
 * Link của web mình thì trả đường dẫn tương đối (`/path?query`, bỏ `#…`);
 * link ngoài hoặc không phải URL thì trả null.
 */
export function internalPath(raw: string, currentHost?: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (s.startsWith("/") && !s.startsWith("//")) return s.split("#")[0];
  try {
    const u = new URL(s);
    const host = u.hostname;
    if (OWN_HOSTS.includes(host) || (currentHost && host === currentHost)) {
      return u.pathname + u.search;
    }
  } catch {
    // không phải URL
  }
  return null;
}

export function isHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Đường dẫn bộ flashcard dạng `/flashcards/d/{slug}` → slug. */
export function deckSlugFromPath(path: string): string | null {
  const m = path.match(/^\/flashcards\/d\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Ngày hôm nay theo giờ VN, dạng YYYY-MM-DD. */
export function vnTodayKey(now = new Date()): string {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Buổi học kế tiếp SAU ngày `from` (không tính chính ngày đó), theo lịch tuần.
 * Dùng làm hạn nộp mặc định: làm xong trước buổi sau. Không có lịch thì null.
 */
export function nextSessionDate(from: string, days: string[]): string | null {
  const set = new Set(days);
  if (set.size === 0) return null;
  const base = new Date(from + "T00:00:00Z");
  for (let i = 1; i <= 7; i++) {
    const d = new Date(base.getTime() + i * 86_400_000);
    if (set.has(WEEKDAYS[d.getUTCDay()])) return d.toISOString().slice(0, 10);
  }
  return null;
}

/** "2026-12-02" → "T4 02/12" */
export function fmtDayShort(key: string): string {
  const d = new Date(key + "T00:00:00Z");
  const wd = d.getUTCDay();
  const thu = wd === 0 ? "CN" : `T${wd + 1}`;
  return `${thu} ${key.slice(8, 10)}/${key.slice(5, 7)}`;
}
