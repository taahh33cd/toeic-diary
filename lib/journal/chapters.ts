/**
 * 5 "chương" của cuốn sổ /journal.
 *
 * Các trang journal được gom thành 5 chương để điều hướng bớt rối — URL giữ
 * nguyên nên link/bookmark cũ không vỡ. Dùng chung cho tab chương (desktop)
 * và bottom nav (mobile) để hai nơi không bao giờ lệch nhau.
 *
 * /journal/error-log và /journal/booking không có mặt ở đây vì chúng chỉ là
 * redirect sang /journal/scores và /journal/schedule — đưa vào chỉ mục thì
 * bấm xong tab sẽ sáng sai chỗ. Link cũ vẫn chạy như trước.
 */

import {
  IconHome, IconScore, IconJournal, IconVocab,
  IconTasks, IconSchedule, IconFee, IconSettings,
  IconProgress, IconTrophy, IconErrorLog, IconBooking,
} from "@/components/journal/Icons";

type IconFn = (props: { size?: number; className?: string }) => React.ReactElement;

export type ChapterPage = {
  /** Đường dẫn đầy đủ, có thể kèm ?tab=. */
  href: string;
  /** Pathname dùng để so khớp (href bỏ phần query). */
  pathname: string;
  labelVi: string;
  labelEn: string;
  Icon: IconFn;
  /** Khớp đúng pathname thay vì theo tiền tố (chỉ /journal cần). */
  exact?: boolean;
  /** Giá trị ?tab= của trang dùng nhiều mục trong cùng một route. */
  tab?: string;
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
      { href: "/journal", pathname: "/journal", labelVi: "Hôm nay", labelEn: "Today", Icon: IconHome, exact: true },
    ],
  },
  {
    id: "progress",
    labelVi: "Tiến độ",
    labelEn: "Progress",
    Icon: IconScore,
    pages: [
      { href: "/journal/scores", pathname: "/journal/scores", labelVi: "Điểm số", labelEn: "Scores", Icon: IconScore },
      { href: "/journal/scores?tab=errorlog", pathname: "/journal/scores", tab: "errorlog", labelVi: "Nhật ký lỗi", labelEn: "Error log", Icon: IconErrorLog },
      { href: "/journal/scores?tab=paraphrase", pathname: "/journal/scores", tab: "paraphrase", labelVi: "Paraphrase", labelEn: "Paraphrase", Icon: IconJournal },
      { href: "/journal/progress", pathname: "/journal/progress", labelVi: "Biểu đồ", labelEn: "Charts", Icon: IconProgress },
      { href: "/journal/achievements", pathname: "/journal/achievements", labelVi: "Thành tựu", labelEn: "Achievements", Icon: IconTrophy },
    ],
  },
  {
    id: "notebook",
    labelVi: "Sổ ghi",
    labelEn: "Notebook",
    Icon: IconVocab,
    pages: [
      { href: "/journal/vocab", pathname: "/journal/vocab", labelVi: "Từ vựng", labelEn: "Vocabulary", Icon: IconVocab },
      { href: "/journal/submissions", pathname: "/journal/submissions", labelVi: "Bài nộp", labelEn: "Submissions", Icon: IconJournal },
    ],
  },
  {
    id: "plan",
    labelVi: "Lịch & Việc",
    labelEn: "Plan",
    Icon: IconTasks,
    pages: [
      { href: "/journal/missions", pathname: "/journal/missions", labelVi: "Nhiệm vụ", labelEn: "Tasks", Icon: IconTasks },
      { href: "/journal/schedule", pathname: "/journal/schedule", labelVi: "Lịch học", labelEn: "Schedule", Icon: IconSchedule },
      { href: "/journal/schedule?tab=booking", pathname: "/journal/schedule", tab: "booking", labelVi: "Đặt lịch", labelEn: "Booking", Icon: IconBooking },
    ],
  },
  {
    id: "admin",
    labelVi: "Hành chính",
    labelEn: "Admin",
    Icon: IconFee,
    pages: [
      { href: "/journal/fee", pathname: "/journal/fee", labelVi: "Học phí", labelEn: "Fees", Icon: IconFee },
      { href: "/journal/settings", pathname: "/journal/settings", labelVi: "Cài đặt", labelEn: "Settings", Icon: IconSettings },
    ],
  },
];

function pageMatches(page: ChapterPage, pathname: string, tab?: string | null): boolean {
  const pathOk = page.exact
    ? pathname === page.pathname
    : pathname === page.pathname || pathname.startsWith(page.pathname + "/");
  if (!pathOk) return false;
  // Trang chia nhiều mục trong cùng route: mục gốc khớp khi URL không có ?tab=
  return page.tab ? tab === page.tab : !tab;
}

/** Chương đang mở theo pathname. Trả null khi ở route journal lạ. */
export function activeChapter(pathname: string): Chapter | null {
  // Chỉ xét pathname: chương không đổi khi học viên nhảy giữa các ?tab=.
  for (const ch of CHAPTERS) {
    if (ch.pages.some((p) => pageMatches(p, pathname, undefined) || p.pathname === pathname)) {
      return ch;
    }
  }
  return null;
}

export { pageMatches };
