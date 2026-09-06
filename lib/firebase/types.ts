// ─── Student ─────────────────────────────────────────────────────────────────

export interface HwItem {
  text: string;
  link?: string;
  desc?: string;
}

export interface Homework {
  id: string;
  date: string;       // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  title?: string;     // optional display label
  vocab?: HwItem[];
  reading?: HwItem[];
  listening?: HwItem[];
  practice?: HwItem[];
  other?: HwItem[];
}

export interface StudentModule {
  id: string;
  name: string;
  type: string;
  status: "done" | "pending" | "current" | string;
  week?: number;
  weekName?: string;
}

export interface ScheduleItem {
  id?: string;
  date: string;
  title: string;
  time?: string;
  kind?: string;
}

export interface ToeicScore {
  score: number;
  date: string;       // YYYY-MM-DD
  testname?: string;
  note?: string;
  l?: number;   // Listening scaled score 0–495
  r?: number;   // Reading scaled score 0–495
  p1?: number;
  p2?: number;
  p3?: number;
  p4?: number;
  p5?: number;
  p6?: number;
  p7?: number;
}

/** Điểm TOEIC Speaking & Writing (path: students/{code}/swScores) */
export interface SwScore {
  total: number;      // s + w, 0–400
  date: string;       // YYYY-MM-DD
  s: number;          // Speaking 0–200
  w: number;          // Writing 0–200
  testname?: string;
  note?: string;
}

export interface ErrorDetail {
  content: string;
  paraphrase?: string;
  part?: string;
  qNum?: string;
  reviewed?: "yes" | "no";
}

export interface ListeningErrors {
  distractor?: number;
  miss_keyword?: number;
  inference?: number;
  no_read_q?: number;
  paraphrase?: number;
  graphic?: number;
  new_word?: number;
  speed?: number;
  accent?: number;
}

export interface ReadingErrors {
  vocabulary?: number;
  grammar?: number;
  text_logic?: number;
  detail_error?: number;
  inference_r?: number;
  cross_ref?: number;
  no_time?: number;
}

export interface ErrorLogEntry {
  date: string;
  testName?: string;
  sessionType?: "full" | "part" | string;
  savedAt?: string;
  lsTotal?: number;
  rdTotal?: number;
  listening?: ListeningErrors;
  reading?: ReadingErrors;
  details?: ErrorDetail[];
}

export interface ParaphraseEntry {
  source: string;
  target: string;
  part: number;
  addedDate: string;
  repCount: number;
  lastReview?: string;
}

// ─── Review Progress (path: students/{code}/reviewProgress/{scoreKey}/{partKey}/{stepId}) ──

/** scoreKey = `${date}_${testname || totalScore}` */
export type ReviewPartProgress = Record<string, boolean>; // stepId → done
export type ReviewScoreProgress = Record<string, ReviewPartProgress>; // partKey → steps
export type ReviewProgress = Record<string, ReviewScoreProgress>; // scoreKey → parts

export interface Student {
  id: string;
  name: string;
  currentWeek: number;
  note?: string;
  note_legacy?: string;
  comments?: Record<string, { text: string; ts: number }>;
  frozen?: boolean;
  scores?: ToeicScore[];
  swScores?: SwScore[];
  homework?: Homework[];
  modules?: StudentModule[];
  schedule?: ScheduleItem[];
  weeklySchedule?: ClassSession[];   // lịch học cố định (chỉ dùng khi HV không thuộc lớp)
  errorLog?: Record<string, ErrorLogEntry>;
  paraphraseLog?: Record<string, ParaphraseEntry>;
  reviewProgress?: ReviewProgress;
  teacherId?: string;
  courseType?: "group" | "per-session" | "package";
  pricePerSession?: number;
  totalFee?: number;
  paidAmount?: number;
}

// ─── Vocab (path: vocab/{studentCode}/{wordId}) ───────────────────────────────

export interface VocabWord {
  id: string;
  word: string;
  part: number;       // 1–7
  addedDate: string;  // YYYY-MM-DD
  repCount: number;
  ipa?: string;
  pos?: string;
  def?: string;
  vi?: string;
  example?: string;
  audioUrl?: string;
  lastReview?: string;
}

// ─── DayLinks (path: daylinks/{studentCode}/{hwId}) ──────────────────────────

export interface DayLink {
  link: string;
  submittedAt: string;
}

export type DayLinksMap = Record<string, DayLink>;

// ─── Submissions (path: submissions/{studentCode}/{key}) ─────────────────────

export interface Submission {
  ticked?: boolean;
  url?: string;
  updatedAt?: string;
}

export type SubmissionsMap = Record<string, Submission>;

// ─── HwFiles (path: hwFiles/{studentCode}/{hwId}/{fileId}) ───────────────────

export interface HwFile {
  url: string;
  uploadedAt: string;
  name?: string;
  publicId?: string;
}
export type HwFilesForHw = Record<string, HwFile>;
export type HwFilesMap = Record<string, HwFilesForHw>;

// ─── HwViewed (path: hwViewed/{studentCode}/{hwId}) ──────────────────────────

export interface HwViewed {
  viewedAt: string;
  note?: string;
}

export type HwViewedMap = Record<string, HwViewed>;

// ─── Goal (path: goals/{studentCode}) ────────────────────────────────────────

/** Kỳ thi học viên đang nhắm tới. Thiếu ⇒ "lr" (dữ liệu trước khi có S&W). */
export type ExamType = "lr" | "sw";

export interface Goal {
  /** Kỳ thi đang chọn — quyết định mục tiêu nào hiển thị ở dashboard/missions. */
  examType?: ExamType;
  /** L&R: tổng 10–990. Thiếu khi HV chỉ đặt mục tiêu S&W. */
  target?: number;
  deadline?: string;
  /** S&W: Speaking 0–200. */
  swTargetS?: number;
  /** S&W: Writing 0–200. */
  swTargetW?: number;
  swDeadline?: string;
  studentId: string;
  studentName: string;
  updatedAt: string;
}

// ─── Booking (path: bookings/{id}) ───────────────────────────────────────────

/**
 * `declined` = giáo viên không nhận buổi đó; `cancelled` = buổi đã nhận nhưng
 * bị huỷ sau (thường do học viên bận đột xuất). Tách hai cái vì học viên đọc
 * "Đã từ chối" cho một buổi chính mình xin huỷ là sai bản chất.
 */
export type BookingStatus = "pending" | "approved" | "declined" | "cancelled";

export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  slotId: string;
  date: string;       // YYYY-MM-DD
  time: string;
  note?: string;
  status: BookingStatus;
  createdAt: string;
  /** Lý do huỷ, chỉ có khi status = "cancelled". */
  cancelReason?: string;
  /**
   * Mã học viên. Booking cũ lưu thẳng mã vào `studentId`, booking mới lưu uid
   * Supabase — cần trường riêng này để gửi thông báo (đánh theo mã học viên).
   */
  studentCode?: string;
}

// ─── Slot (path: slots/{id}) ─────────────────────────────────────────────────

export interface Slot {
  id: string;
  date: string;       // YYYY-MM-DD
  time: string;
  note?: string;
  /**
   * Đã có học viên giữ chỗ (booking pending hoặc approved). Khung giờ là lịch
   * 1-1 nên chỉ nhận một người. Cờ này nằm trên `slots` — node duy nhất mọi HV
   * đọc được — vì rules chặn HV đọc booking của người khác.
   */
  taken?: boolean;
}

// ─── Class (path: classes/{id}) ──────────────────────────────────────────────

export interface ClassSession {
  day: string;
  time: string;
  room?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  desc?: string;
  members: string[];   // studentCode[]
  homework?: Homework[];
  weeklySchedule?: ClassSession[];
}

// ─── Attendance (path: attendance/{studentCode}/{date}) ──────────────────────

export type AttendanceStatus = "present" | "absent" | "late";

export type AttendanceMap = Record<string, AttendanceStatus>;

// ─── Notification (path: notifications/{studentCode}/{timestamp}) ─────────────

export interface FbNotification {
  type: string;
  title: string;
  body: string;
  read?: boolean;
  createdAt?: string;
}

export type NotificationsMap = Record<string, FbNotification>;
