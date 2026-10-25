/**
 * 5 "chương" của cuốn sổ /journal.
 *
 * 13 trang journal được gom thành 5 chương để điều hướng bớt rối — URL giữ
 * nguyên nên link/bookmark cũ không vỡ. Dùng chung cho tab chương (desktop)
 * và bottom nav (mobile) để hai nơi không bao giờ lệch nhau.
 */

import {
  IconHome, IconScore, IconJournal, IconVocab,
  IconTasks, IconSchedule, IconFee, IconSettings,
  IconProgress, IconTrophy, IconErrorLog, IconBooking,
} from "@/components/journal/Icons";

type IconFn = (props: { size?: number; className?: string }) => React.ReactElement;

export type ChapterPage = {
  href: string;
  labelVi: string;
  labelEn: string;
  Icon: IconFn;
  /** Khớp đúng pathname thay vì theo tiền tố (chỉ /journal cần). */
  exact?: boolean;
};

export type Chapter = {
  id: string;
  labelVi: string;
  labelEn: string;
  Icon: IconFn;
  pages: ChapterPage[];
};

export const CHAPTERS: Chapter[] = [
  {
    id: "today",
    labelVi: "Hôm nay",
    labelEn: "Today",
    Icon: IconHome,
    pages: [
      { href: "/journal", labelVi: "Hôm nay", labelEn: "Today", Icon: IconHome, exact: true },
    ],
  },
  {
    id: "progress",
    labelVi: "Tiến độ",
    labelEn: "Progress",
    Icon: IconScore,
    pages: [
      { href: "/journal/scores", labelVi: "Điểm số", labelEn: "Scores", Icon: IconScore },
      { href: "/journal/progress", labelVi: "Biểu đồ", labelEn: "Charts", Icon: IconProgress },
      { href: "/journal/achievements", labelVi: "Thành tựu", labelEn: "Achievements", Icon: IconTrophy },
    ],
  },
  {
    id: "notebook",
    labelVi: "Sổ ghi",
    labelEn: "Notebook",
    Icon: IconVocab,
    pages: [
      { href: "/journal/vocab", labelVi: "Từ vựng", labelEn: "Vocabulary", Icon: IconVocab },
      { href: "/journal/error-log", labelVi: "Sổ lỗi", labelEn: "Error log", Icon: IconErrorLog },
      { href: "/journal/submissions", labelVi: "Bài nộp", labelEn: "Submissions", Icon: IconJournal },
    ],
  },
  {
    id: "plan",
    labelVi: "Lịch & Việc",
    labelEn: "Plan",
    Icon: IconTasks,
    pages: [
      { href: "/journal/missions", labelVi: "Nhiệm vụ", labelEn: "Tasks", Icon: IconTasks },
      { href: "/journal/schedule", labelVi: "Lịch học", labelEn: "Schedule", Icon: IconSchedule },
      { href: "/journal/booking", labelVi: "Đặt lịch", labelEn: "Booking", Icon: IconBooking },
    ],
  },
  {
    id: "admin",
    labelVi: "Hành chính",
    labelEn: "Admin",
    Icon: IconFee,
    pages: [
      { href: "/journal/fee", labelVi: "Học phí", labelEn: "Fees", Icon: IconFee },
      { href: "/journal/settings", labelVi: "Cài đặt", labelEn: "Settings", Icon: IconSettings },
    ],
  },
];

function pageMatches(page: ChapterPage, pathname: string): boolean {
  return page.exact
    ? pathname === page.href
    : pathname === page.href || pathname.startsWith(page.href + "/");
}

/** Chương đang mở theo pathname. Trả null khi ở route journal lạ. */
export function activeChapter(pathname: string): Chapter | null {
  // Trang con khớp cụ thể trước, vì /journal là tiền tố của mọi route còn lại.
  for (const ch of CHAPTERS) {
    if (ch.pages.some((p) => pageMatches(p, pathname))) return ch;
  }
  return null;
}

export function activePage(pathname: string): ChapterPage | null {
  for (const ch of CHAPTERS) {
    const hit = ch.pages.find((p) => pageMatches(p, pathname));
    if (hit) return hit;
  }
  return null;
}

export { pageMatches };
