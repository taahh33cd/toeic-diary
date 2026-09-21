import {
  ref,
  set,
  update,
  remove,
  get,
  push,
} from "firebase/database";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { firebaseDb, firebaseStorage } from "./client";
import type {
  Student,
  Homework,
  DayLink,
  Submission,
  Booking,
  Slot,
  Goal,
  ToeicScore,
  SwScore,
  VocabWord,
  AttendanceStatus,
  FbNotification,
  StudentModule,
  ScheduleItem,
  SchoolClass,
  ClassSession,
  ErrorLogEntry,
  ErrorDetail,
  ParaphraseEntry,
} from "./types";

// ─── Students ────────────────────────────────────────────────────────────────

export async function createStudent(
  code: string,
  data: { name: string; currentWeek: number; courseType?: Student["courseType"]; pricePerSession?: number }
): Promise<void> {
  await set(ref(firebaseDb, `students/${code}`), {
    id: code,
    name: data.name,
    currentWeek: data.currentWeek,
    ...(data.courseType ? { courseType: data.courseType } : {}),
    ...(data.pricePerSession != null ? { pricePerSession: data.pricePerSession } : {}),
  });
}

export async function deleteStudent(code: string): Promise<void> {
  await remove(ref(firebaseDb, `students/${code}`));
}

export async function updateStudent(
  code: string,
  partial: Partial<Student>
): Promise<void> {
  const cleaned = Object.fromEntries(
    Object.entries(partial as Record<string, unknown>).filter(([, v]) => v !== undefined)
  );
  await update(ref(firebaseDb, `students/${code}`), cleaned);
}

export async function setStudentFrozen(
  code: string,
  frozen: boolean
): Promise<void> {
  await set(ref(firebaseDb, `students/${code}/frozen`), frozen);
}

export async function setStudentNote(
  code: string,
  note: string
): Promise<void> {
  await set(ref(firebaseDb, `students/${code}/note`), note);
}

// ─── Scores ──────────────────────────────────────────────────────────────────

export async function setStudentScores(
  code: string,
  scores: ToeicScore[]
): Promise<void> {
  await set(ref(firebaseDb, `students/${code}/scores`), scores);
}

export async function pushStudentScore(
  code: string,
  score: ToeicScore
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/scores`));
  const existing: ToeicScore[] = snap.val() ?? [];
  const updated = [...existing, score].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  await set(ref(firebaseDb, `students/${code}/scores`), updated);
}

export async function deleteStudentScore(
  code: string,
  index: number
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/scores`));
  const existing: ToeicScore[] = snap.val() ?? [];
  existing.splice(index, 1);
  await set(ref(firebaseDb, `students/${code}/scores`), existing);
}

export async function updateStudentScore(
  code: string,
  index: number,
  score: ToeicScore
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/scores`));
  const existing: ToeicScore[] = snap.val() ?? [];
  existing[index] = score;
  const updated = [...existing].sort((a, b) => a.date.localeCompare(b.date));
  await set(ref(firebaseDb, `students/${code}/scores`), updated);
}

// ─── SW scores ───────────────────────────────────────────────────────────────

export async function pushStudentSwScore(
  code: string,
  score: SwScore
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/swScores`));
  const existing: SwScore[] = snap.val() ?? [];
  const updated = [...existing, score].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  await set(ref(firebaseDb, `students/${code}/swScores`), updated);
}

export async function deleteStudentSwScore(
  code: string,
  index: number
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/swScores`));
  const existing: SwScore[] = snap.val() ?? [];
  existing.splice(index, 1);
  await set(ref(firebaseDb, `students/${code}/swScores`), existing);
}

export async function updateStudentSwScore(
  code: string,
  index: number,
  score: SwScore
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/swScores`));
  const existing: SwScore[] = snap.val() ?? [];
  existing[index] = score;
  const updated = [...existing].sort((a, b) => a.date.localeCompare(b.date));
  await set(ref(firebaseDb, `students/${code}/swScores`), updated);
}

// ─── Homework ────────────────────────────────────────────────────────────────

export async function setHomework(
  code: string,
  homework: Homework[]
): Promise<void> {
  await set(ref(firebaseDb, `students/${code}/homework`), homework);
}

export async function pushHomework(
  code: string,
  hw: Homework
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/homework`));
  const existing: Homework[] = snap.val() ?? [];
  await set(ref(firebaseDb, `students/${code}/homework`), [...existing, hw]);
  // fire-and-forget: notification failure must not block homework save
  sendNotification(code, {
    type: "homework",
    title: "📚 Bài tập mới từ giáo viên!",
    body: hw.title ?? "Thầy vừa giao bài tập mới. Kiểm tra ngay nhé!",
    createdAt: new Date().toISOString(),
  }).catch(console.error);
}

export async function updateHomework(
  code: string,
  hwId: string,
  hw: Homework
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/homework`));
  const existing: Homework[] = snap.val() ?? [];
  const idx = existing.findIndex((h) => h.id === hwId);
  if (idx === -1) {
    // Student doesn't have this hw yet (e.g. added to class after initial push) → upsert
    await set(ref(firebaseDb, `students/${code}/homework`), [...existing, hw]);
  } else {
    await set(ref(firebaseDb, `students/${code}/homework`), existing.map((h) => h.id === hwId ? hw : h));
  }
}

export async function deleteHomework(
  code: string,
  hwId: string
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/homework`));
  const existing: Homework[] = snap.val() ?? [];
  await set(
    ref(firebaseDb, `students/${code}/homework`),
    existing.filter((h) => h.id !== hwId)
  );
}

// ─── Day Links ───────────────────────────────────────────────────────────────

export async function saveDayLink(
  code: string,
  hwId: string,
  link: string
): Promise<DayLink> {
  const data: DayLink = { link, submittedAt: new Date().toISOString() };
  await set(ref(firebaseDb, `daylinks/${code}/${hwId}`), data);
  return data;
}

// ─── Submissions ─────────────────────────────────────────────────────────────

export async function saveSubmission(
  code: string,
  key: string,
  data: Submission
): Promise<void> {
  await set(ref(firebaseDb, `submissions/${code}/${key}`), data);
}

export async function removeSubmission(
  code: string,
  key: string
): Promise<void> {
  await remove(ref(firebaseDb, `submissions/${code}/${key}`));
}

// ─── Progress (path: progress/{code}/{date}) ──────────────────────────────────

export async function saveProgress(
  code: string,
  date: string,
  data: { done: number; total: number; updatedAt: string }
): Promise<void> {
  await set(ref(firebaseDb, `progress/${code}/${date}`), data);
}

// ─── Vocab ───────────────────────────────────────────────────────────────────

export async function saveVocabWord(
  code: string,
  word: Omit<VocabWord, "id">
): Promise<string> {
  const id = `v${Date.now()}`;
  await set(ref(firebaseDb, `vocab/${code}/${id}`), word);
  return id;
}

export async function updateVocabWord(
  code: string,
  id: string,
  partial: Partial<Omit<VocabWord, "id">>
): Promise<void> {
  await update(ref(firebaseDb, `vocab/${code}/${id}`), partial);
}

export async function deleteVocabWord(
  code: string,
  id: string
): Promise<void> {
  await remove(ref(firebaseDb, `vocab/${code}/${id}`));
}

/** Save forgotten word IDs from a study session (overwrites previous session). */
export async function saveForgottenWords(code: string, wordIds: string[]): Promise<void> {
  const map: Record<string, true> = {};
  for (const id of wordIds) map[id] = true;
  await set(ref(firebaseDb, `vocab_forgotten/${code}`), wordIds.length > 0 ? map : null);
}

/** Load forgotten word IDs from the previous session. */
export async function loadForgottenWords(code: string): Promise<string[]> {
  const snap = await get(ref(firebaseDb, `vocab_forgotten/${code}`));
  const val = snap.val() as Record<string, true> | null;
  return val ? Object.keys(val) : [];
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function createBooking(
  booking: Omit<Booking, "id">
): Promise<string> {
  const id = `b${Date.now()}`;
  await set(ref(firebaseDb, `bookings/${id}`), { ...booking, id });
  return id;
}

/** Lượt đặt còn giữ chỗ — chưa bị từ chối cũng chưa bị huỷ. */
export function isBookingActive(status: Booking["status"]): boolean {
  return status === "pending" || status === "approved";
}

/**
 * Mã học viên để gửi thông báo. Booking cũ lưu thẳng mã vào `studentId`,
 * booking mới lưu uid Supabase — với những booking cũ chưa có `studentCode` và
 * `studentId` là uid thì không xác định được mã, trả null để bỏ qua thông báo
 * thay vì ghi nhầm vào một nhánh không ai đọc.
 */
export function bookingNotifyCode(booking: Booking): string | null {
  if (booking.studentCode) return booking.studentCode;
  const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(booking.studentId);
  return looksLikeUuid ? null : booking.studentId || null;
}

/**
 * Đổi trạng thái booking. Truyền `slot` để cờ giữ chỗ trên khung giờ đi theo:
 * duyệt thì giữ chỗ, từ chối/huỷ thì nhả ra — NHƯNG chỉ khi không còn lượt đặt
 * nào khác đang giữ cùng khung giờ đó (`heldByOthers`). Bỏ qua điều kiện này là
 * nhả nhầm chỗ của người đã được duyệt, khiến khung giờ hiện lại là còn trống.
 * Chỉ teacher/admin ghi được `slots` nên hàm này chỉ dùng ở khu admin.
 */
export async function updateBookingStatus(
  id: string,
  status: Booking["status"],
  slot?: { id: string; heldByOthers: boolean },
  cancelReason?: string
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  // Ghi null để xoá lý do cũ khi một lượt bị huỷ rồi được duyệt lại.
  patch.cancelReason = status === "cancelled" ? cancelReason?.trim() || null : null;
  await update(ref(firebaseDb, `bookings/${id}`), patch);

  if (slot) {
    const stillTaken = isBookingActive(status) || slot.heldByOthers;
    await set(ref(firebaseDb, `slots/${slot.id}/taken`), stillTaken ? true : null);
  }
}

export async function updateBookingNote(
  id: string,
  note: string
): Promise<void> {
  await update(ref(firebaseDb, `bookings/${id}`), { note });
}

// ─── Slots ───────────────────────────────────────────────────────────────────

export async function createSlot(slot: Omit<Slot, "id">): Promise<string> {
  const id = `s${Date.now()}`;
  await set(ref(firebaseDb, `slots/${id}`), { ...slot, id });
  return id;
}

export async function deleteSlot(id: string): Promise<void> {
  await remove(ref(firebaseDb, `slots/${id}`));
}

/**
 * Tạo nhiều khung giờ trong MỘT lần ghi multi-path. Không lặp `createSlot` vì
 * mỗi lần ghi là một round-trip RTDB riêng: tạo lịch cả tháng (~40 slot) sẽ chậm
 * và có thể ghi dở dang nếu mất kết nối giữa chừng.
 */
export async function createSlotsBulk(
  slots: Omit<Slot, "id">[]
): Promise<string[]> {
  if (slots.length === 0) return [];
  const stamp = Date.now();
  const updates: Record<string, Slot> = {};
  const ids: string[] = [];

  slots.forEach((slot, i) => {
    const id = `s${stamp}_${i}`;
    // Không spread `slot`: `note: undefined` sẽ làm RTDB reject cả lệnh ghi.
    const entry: Slot = { id, date: slot.date, time: slot.time };
    if (slot.note) entry.note = slot.note;
    updates[id] = entry;
    ids.push(id);
  });

  await update(ref(firebaseDb, "slots"), updates);
  return ids;
}

/**
 * Ghi lại cờ giữ chỗ cho nhiều khung giờ. Khoá của `updates` là đường dẫn tương
 * đối dưới `slots`, ví dụ `s123/taken`; giá trị `null` nghĩa là nhả chỗ.
 */
export async function syncSlotTaken(
  updates: Record<string, boolean | null>
): Promise<void> {
  if (Object.keys(updates).length === 0) return;
  await update(ref(firebaseDb, "slots"), updates);
}

/** Xóa nhiều khung giờ trong một lần ghi. */
export async function deleteSlots(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const updates: Record<string, null> = {};
  for (const id of ids) updates[id] = null;
  await update(ref(firebaseDb, "slots"), updates);
}

// ─── Goal ────────────────────────────────────────────────────────────────────

/**
 * Ghi mục tiêu theo kiểu patch: chỉ những field được truyền vào mới thay đổi,
 * nên sửa mục tiêu S&W không xoá mục tiêu L&R và ngược lại. Field mang giá trị
 * `undefined` sẽ bị xoá khỏi node (dùng khi HV bỏ trống deadline).
 */
export async function setGoal(code: string, goal: Partial<Goal>): Promise<void> {
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(goal)) {
    patch[key] = value === undefined ? null : value;
  }
  patch.updatedAt = new Date().toISOString();
  await update(ref(firebaseDb, `goals/${code}`), patch);
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function setAttendance(
  code: string,
  date: string,
  status: AttendanceStatus | null
): Promise<void> {
  if (status === null) {
    await remove(ref(firebaseDb, `attendance/${code}/${date}`));
  } else {
    await set(ref(firebaseDb, `attendance/${code}/${date}`), status);
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function sendNotification(
  code: string,
  notification: Omit<FbNotification, "read">
): Promise<void> {
  const key = Date.now().toString();
  await set(ref(firebaseDb, `notifications/${code}/${key}`), {
    ...notification,
    read: false,
    createdAt: notification.createdAt ?? new Date().toISOString(),
  });
}

export async function markNotificationRead(
  code: string,
  key: string
): Promise<void> {
  await set(ref(firebaseDb, `notifications/${code}/${key}/read`), true);
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function pushComment(
  code: string,
  text: string
): Promise<void> {
  const now = Date.now();
  const commentKey = `c${now}`;
  const notifKey = `${now}_${Math.random().toString(36).slice(2, 5)}`;
  await update(ref(firebaseDb), {
    [`students/${code}/comments/${commentKey}`]: { text, ts: now },
    [`notifications/${code}/${notifKey}`]: {
      type: "comment",
      title: "Thầy Hiếu đã nhận xét",
      body: text.slice(0, 120),
      read: false,
      createdAt: new Date().toISOString(),
    },
  });
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export async function addModule(
  code: string,
  module: StudentModule
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/modules`));
  const existing: StudentModule[] = snap.val() ?? [];
  await set(ref(firebaseDb, `students/${code}/modules`), [...existing, module]);
}

export async function updateModuleStatus(
  code: string,
  moduleId: string,
  status: string
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/modules`));
  const existing: StudentModule[] = snap.val() ?? [];
  const updated = existing.map((m) => m.id === moduleId ? { ...m, status } : m);
  await set(ref(firebaseDb, `students/${code}/modules`), updated);
}

export async function deleteModule(
  code: string,
  moduleId: string
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/modules`));
  const existing: StudentModule[] = snap.val() ?? [];
  await set(
    ref(firebaseDb, `students/${code}/modules`),
    existing.filter((m) => m.id !== moduleId)
  );
}

// ─── Schedule ────────────────────────────────────────────────────────────────

export async function addScheduleItem(
  code: string,
  item: ScheduleItem
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/schedule`));
  const existing: ScheduleItem[] = snap.val() ?? [];
  const sorted = [...existing, item].sort((a, b) => a.date.localeCompare(b.date));
  await set(ref(firebaseDb, `students/${code}/schedule`), sorted);
}

export async function deleteScheduleItem(
  code: string,
  itemId: string
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/schedule`));
  const existing: ScheduleItem[] = snap.val() ?? [];
  await set(
    ref(firebaseDb, `students/${code}/schedule`),
    existing.filter((s) => s.id !== itemId)
  );
}

// ─── Classes ─────────────────────────────────────────────────────────────────

export async function createClass(data: {
  name: string;
  desc?: string;
  weeklySchedule?: ClassSession[];
}): Promise<string> {
  const id = `class_${Date.now()}`;
  const cls: SchoolClass = {
    id,
    name: data.name,
    members: [],
    ...(data.desc ? { desc: data.desc } : {}),
    ...(data.weeklySchedule?.length ? { weeklySchedule: data.weeklySchedule } : {}),
  };
  await set(ref(firebaseDb, `classes/${id}`), cls);
  return id;
}

export async function deleteClass(id: string): Promise<void> {
  await remove(ref(firebaseDb, `classes/${id}`));
}

export async function updateClass(
  id: string,
  partial: Partial<SchoolClass>
): Promise<void> {
  const cleaned = Object.fromEntries(
    Object.entries(partial as Record<string, unknown>).filter(([, v]) => v !== undefined)
  );
  await update(ref(firebaseDb, `classes/${id}`), cleaned);
}

export async function pushClassHomework(
  id: string,
  hw: Homework
): Promise<void> {
  const snap = await get(ref(firebaseDb, `classes/${id}/homework`));
  const existing: Homework[] = snap.val() ?? [];
  await set(ref(firebaseDb, `classes/${id}/homework`), [...existing, hw]);
}

export async function updateClassHomework(
  id: string,
  hwId: string,
  hw: Homework
): Promise<void> {
  const snap = await get(ref(firebaseDb, `classes/${id}/homework`));
  const existing: Homework[] = snap.val() ?? [];
  await set(
    ref(firebaseDb, `classes/${id}/homework`),
    existing.map((h) => h.id === hwId ? hw : h)
  );
}

export async function deleteClassHomework(
  id: string,
  hwId: string
): Promise<void> {
  const snap = await get(ref(firebaseDb, `classes/${id}/homework`));
  const existing: Homework[] = snap.val() ?? [];
  await set(
    ref(firebaseDb, `classes/${id}/homework`),
    existing.filter((h) => h.id !== hwId)
  );
}

export async function addClassMember(
  id: string,
  studentCode: string
): Promise<void> {
  const snap = await get(ref(firebaseDb, `classes/${id}/members`));
  const existing: string[] = snap.val() ?? [];
  if (!existing.includes(studentCode)) {
    await set(ref(firebaseDb, `classes/${id}/members`), [...existing, studentCode]);
  }
}

export async function removeClassMember(
  id: string,
  studentCode: string
): Promise<void> {
  const snap = await get(ref(firebaseDb, `classes/${id}/members`));
  const existing: string[] = snap.val() ?? [];
  await set(
    ref(firebaseDb, `classes/${id}/members`),
    existing.filter((c) => c !== studentCode)
  );
}

// ─── Error Log (path: students/{code}/errorLog/{sessionKey}) ─────────────────

export async function addErrorEntry(
  code: string,
  entry: Omit<ErrorLogEntry, "savedAt"> & { date?: string }
): Promise<string> {
  const key = `${Date.now()}`;
  const { date: entryDate, ...rest } = entry;
  const data: ErrorLogEntry = {
    date: entryDate ?? new Date().toISOString().slice(0, 10),
    savedAt: new Date().toISOString(),
    ...rest,
  };
  await set(ref(firebaseDb, `students/${code}/errorLog/${key}`), data);
  return key;
}

export async function deleteErrorEntry(
  code: string,
  key: string
): Promise<void> {
  await remove(ref(firebaseDb, `students/${code}/errorLog/${key}`));
}

export async function markDetailReviewed(
  code: string,
  sessionKey: string,
  detailIndex: number
): Promise<void> {
  await set(
    ref(firebaseDb, `students/${code}/errorLog/${sessionKey}/details/${detailIndex}/reviewed`),
    "yes"
  );
}

export async function updateErrorDetail(
  code: string,
  sessionKey: string,
  detailIndex: number,
  patch: Partial<ErrorDetail>
): Promise<void> {
  await update(
    ref(firebaseDb, `students/${code}/errorLog/${sessionKey}/details/${detailIndex}`),
    patch
  );
}

// ─── Paraphrase Log (path: students/{code}/paraphraseLog/{key}) ──────────────

export async function addParaphraseEntry(
  code: string,
  entry: Pick<ParaphraseEntry, "source" | "target" | "part">
): Promise<string> {
  const key = `pr${Date.now()}`;
  const data: ParaphraseEntry = {
    ...entry,
    addedDate: new Date().toISOString().slice(0, 10),
    repCount: 0,
  };
  await set(ref(firebaseDb, `students/${code}/paraphraseLog/${key}`), data);
  return key;
}

export async function reviewParaphraseEntry(
  code: string,
  key: string,
  repCount: number
): Promise<void> {
  await update(ref(firebaseDb, `students/${code}/paraphraseLog/${key}`), {
    repCount: repCount + 1,
    lastReview: new Date().toISOString().slice(0, 10),
  });
}

export async function deleteParaphraseEntry(
  code: string,
  key: string
): Promise<void> {
  await remove(ref(firebaseDb, `students/${code}/paraphraseLog/${key}`));
}

// ─── Review Progress (path: students/{code}/reviewProgress/{scoreKey}/{partKey}/{stepId}) ─

/** Build a stable key from a ToeicScore so progress survives score list reorders. */
export function buildScoreKey(score: ToeicScore): string {
  const name = score.testname?.trim().replace(/\s+/g, "_") ?? String(score.score);
  return `${score.date}_${name}`;
}

export async function setReviewStep(
  code: string,
  scoreKey: string,
  partKey: string,
  stepId: string,
  done: boolean
): Promise<void> {
  await set(
    ref(firebaseDb, `students/${code}/reviewProgress/${scoreKey}/${partKey}/${stepId}`),
    done
  );
}

export async function clearReviewProgress(
  code: string,
  scoreKey: string
): Promise<void> {
  await remove(ref(firebaseDb, `students/${code}/reviewProgress/${scoreKey}`));
}

// ─── Homework File Upload (Firebase Storage) ──────────────────────────────────

// ─── Hw Files (path: hwFiles/{studentCode}/{hwId}/{fileId}) ──────────────────

export async function addHwFile(
  code: string,
  hwId: string,
  url: string,
  name?: string,
  publicId?: string
): Promise<string> {
  const newRef = push(ref(firebaseDb, `hwFiles/${code}/${hwId}`));
  await set(newRef, {
    url,
    uploadedAt: new Date().toISOString(),
    ...(name ? { name } : {}),
    ...(publicId ? { publicId } : {}),
  });
  return newRef.key!;
}

export async function deleteOldDayLink(
  code: string,
  hwId: string,
  hwDate: string,
  storageUrl?: string
): Promise<void> {
  await remove(ref(firebaseDb, `daylinks/${code}/${hwId}`));
  await remove(ref(firebaseDb, `submissions/${code}/${hwDate}/url`));
  if (storageUrl?.startsWith("https://firebasestorage.googleapis.com")) {
    try {
      const match = storageUrl.match(/\/o\/(.+?)\?/);
      if (match) await deleteObject(storageRef(firebaseStorage, decodeURIComponent(match[1])));
    } catch { /* file may already be gone */ }
  }
}

export async function deleteHwFile(
  code: string,
  hwId: string,
  fileId: string,
  storageUrl?: string,
  publicId?: string
): Promise<void> {
  await remove(ref(firebaseDb, `hwFiles/${code}/${hwId}/${fileId}`));
  // Nhận xét gắn với file đã xoá thì cũng bỏ, tránh hiện mồ côi bên học viên.
  // Tách khỏi lệnh trên để nếu sau này siết quyền ghi hwViewed thì việc xoá file vẫn chạy.
  try {
    await remove(ref(firebaseDb, `hwViewed/${code}/${hwId}/fileNotes/${fileId}`));
  } catch { /* không xoá được nhận xét thì cũng không chặn xoá file */ }
  if (publicId) {
    const resourceType = storageUrl?.includes("/video/") ? "video" : "image";
    try {
      await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId, resourceType }),
      });
    } catch { /* deletion failure is non-critical */ }
  } else if (storageUrl?.startsWith("https://firebasestorage.googleapis.com")) {
    try {
      const match = storageUrl.match(/\/o\/(.+?)\?/);
      if (match) await deleteObject(storageRef(firebaseStorage, decodeURIComponent(match[1])));
    } catch { /* file may already be gone */ }
  }
}

// ─── Hw Viewed (path: hwViewed/{studentCode}/{hwId}) ─────────────────────────

export async function markHwViewed(
  code: string,
  hwId: string,
  note?: string
): Promise<void> {
  await update(ref(firebaseDb, `hwViewed/${code}/${hwId}`), {
    viewedAt: new Date().toISOString(),
    ...(note !== undefined ? { note: note || null } : {}),
  });
}

/**
 * Nhận xét của GV cho MỘT file minh chứng (ảnh/video) của một buổi BTVN.
 * `fileId` là key trong `hwFiles/{code}/{hwId}`, hoặc `"__legacy__"` cho bài nộp
 * kiểu cũ (một link duy nhất). Text rỗng ⇒ xoá nhận xét.
 * Lưu nhận xét đồng thời đánh dấu buổi đó là đã xem.
 */
export async function saveHwFileNote(
  code: string,
  hwId: string,
  fileId: string,
  text: string,
  hwLabel?: string
): Promise<void> {
  const trimmed = text.trim();
  const now = Date.now();
  const iso = new Date(now).toISOString();
  const payload: Record<string, unknown> = {
    [`hwViewed/${code}/${hwId}/viewedAt`]: iso,
    [`hwViewed/${code}/${hwId}/fileNotes/${fileId}`]: trimmed ? { text: trimmed, ts: now } : null,
  };
  if (trimmed) {
    const notifKey = `${now}_${Math.random().toString(36).slice(2, 5)}`;
    payload[`notifications/${code}/${notifKey}`] = {
      type: "hw-note",
      title: hwLabel ? `Thầy Hiếu đã nhận xét bài nộp ${hwLabel}` : "Thầy Hiếu đã nhận xét bài nộp",
      body: trimmed.slice(0, 120),
      read: false,
      createdAt: iso,
    };
  }
  await update(ref(firebaseDb), payload);
}

export function uploadHomeworkFile(
  studentCode: string,
  hwId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const path = `homework/${studentCode}/${hwId}/${Date.now()}_${file.name}`;
  const sRef = storageRef(firebaseStorage, path);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(sRef, file);
    task.on(
      "state_changed",
      snap => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}

