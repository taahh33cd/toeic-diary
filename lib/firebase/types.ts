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
  status: "done" | "pending" | string;
}

export interface ScheduleItem {
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
  p1?: number;
  p2?: number;
  p3?: number;
  p4?: number;
  p5?: number;
  p6?: number;
  p7?: number;
}

export interface ErrorLogEntry {
  date: string;
  category: "Listening" | "Reading" | string;
  errorType: string;
  detail?: string;
  testRef?: string;
}

export interface ParaphraseEntry {
  source: string;
  target: string;
  part: number;
  addedDate: string;
  repCount: number;
  lastReview?: string;
}

export interface Student {
  id: string;
  name: string;
  currentWeek: number;
  note?: string;
  note_legacy?: string;
  comments?: Record<string, { text: string; ts: number }>;
  frozen?: boolean;
  scores?: ToeicScore[];
  homework?: Homework[];
  modules?: StudentModule[];
  schedule?: ScheduleItem[];
  errorLog?: Record<string, ErrorLogEntry>;
  paraphraseLog?: Record<string, ParaphraseEntry>;
  // Added for new platform
  teacherId?: string;
}

// ─── Vocab (path: vocab/{studentCode}/{wordId}) ───────────────────────────────

export interface VocabWord {
  id: string;         // key from Firebase (injected client-side)
  word: string;
  part: number;       // 1–7
  addedDate: string;  // YYYY-MM-DD
  repCount: number;
  ipa?: string;
  pos?: string;       // n / v / adj / adv / ...
  def?: string;
  vi?: string;        // Vietnamese translation
  example?: string;
  audioUrl?: string;
  lastReview?: string;
}

// ─── DayLinks (path: daylinks/{studentCode}/{hwId}) ──────────────────────────

export interface DayLink {
  link: string;
  submittedAt: string; // ISO
}

// DayLinks map: hwId → DayLink
export type DayLinksMap = Record<string, DayLink>;

// ─── Submissions (path: submissions/{studentCode}/{key}) ─────────────────────

export interface Submission {
  ticked?: boolean;
  url?: string;
  updatedAt?: string;
}

export type SubmissionsMap = Record<string, Submission>;

// ─── Goal (path: goals/{studentCode}) ────────────────────────────────────────

export interface Goal {
  target: number;
  deadline?: string;
  studentId: string;
  studentName: string;
  updatedAt: string;
}

// ─── Booking (path: bookings/{id}) ───────────────────────────────────────────

export type BookingStatus = "pending" | "approved" | "declined";

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
}

// ─── Slot (path: slots/{id}) ─────────────────────────────────────────────────

export interface Slot {
  id: string;
  date: string;       // YYYY-MM-DD
  time: string;
  note?: string;
}

// ─── Class (path: classes/{id}) ──────────────────────────────────────────────

export interface ClassSession {
  day: string;        // "Monday" | "Tuesday" | ...
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

// attendance[date] → status
export type AttendanceMap = Record<string, AttendanceStatus>;

// ─── Notification (path: notifications/{studentCode}/{timestamp}) ─────────────
// Named FbNotification to avoid collision with browser built-in Notification API

export interface FbNotification {
  type: string;
  title: string;
  body: string;
  read?: boolean;
  createdAt?: string;
}

export type NotificationsMap = Record<string, FbNotification>;
