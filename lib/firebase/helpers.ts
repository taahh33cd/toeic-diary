import {
  ref,
  set,
  update,
  remove,
  get,
  push,
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
} from "./types";

// ─── Students ────────────────────────────────────────────────────────────────

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
  status: AttendanceStatus
): Promise<void> {
  await set(ref(firebaseDb, `attendance/${code}/${date}`), status);
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
