import {
  ref,
  set,
  update,
  remove,
  get,
} from "firebase/database";
import { firebaseDb } from "./client";
import type {
  Student,
  Homework,
  DayLink,
  Submission,
  Booking,
  Slot,
  Goal,
  ToeicScore,
  VocabWord,
  AttendanceStatus,
  FbNotification,
  StudentModule,
  ScheduleItem,
  SchoolClass,
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
  await update(ref(firebaseDb, `students/${code}`), partial);
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
  await sendNotification(code, {
    type: "homework",
    title: "📚 Bài tập mới từ giáo viên!",
    body: hw.title ?? "Thầy vừa giao bài tập mới. Kiểm tra ngay nhé!",
    createdAt: new Date().toISOString(),
  });
}

export async function updateHomework(
  code: string,
  hwId: string,
  hw: Homework
): Promise<void> {
  const snap = await get(ref(firebaseDb, `students/${code}/homework`));
  const existing: Homework[] = snap.val() ?? [];
  await set(
    ref(firebaseDb, `students/${code}/homework`),
    existing.map((h) => h.id === hwId ? hw : h)
  );
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

export async function updateBookingStatus(
  id: string,
  status: Booking["status"]
): Promise<void> {
  await set(ref(firebaseDb, `bookings/${id}/status`), status);
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

// ─── Goal ────────────────────────────────────────────────────────────────────

export async function setGoal(code: string, goal: Goal): Promise<void> {
  await set(ref(firebaseDb, `goals/${code}`), {
    ...goal,
    updatedAt: new Date().toISOString(),
  });
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

export async function deleteClass(id: string): Promise<void> {
  await remove(ref(firebaseDb, `classes/${id}`));
}

export async function updateClass(
  id: string,
  partial: Partial<SchoolClass>
): Promise<void> {
  await update(ref(firebaseDb, `classes/${id}`), partial);
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
