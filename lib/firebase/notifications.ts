import { ref, update, serverTimestamp } from "firebase/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { FbNotification } from "@/lib/firebase/types";

export type NotifType =
  | "homework"
  | "booking_approved"
  | "booking_declined"
  | "comment"
  | "achievement";

/**
 * Push a notification to a student's Firebase path.
 * Client-side only (uses firebaseDb).
 * For server-side writes, use the Firebase Admin SDK instead.
 */
export async function pushNotification(
  studentCode: string,
  type: NotifType,
  title: string,
  body?: string
): Promise<void> {
  const key = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const notif: FbNotification = {
    type,
    title,
    body: body ?? "",
    read: false,
    createdAt: new Date().toISOString(),
  };
  await update(ref(firebaseDb), {
    [`notifications/${studentCode}/${key}`]: notif,
  });
}

/** Convenience wrappers */
export const notify = {
  homework: (code: string, date: string) =>
    pushNotification(code, "homework", "Bài tập mới", `Bài ngày ${date} đã được giao`),

  bookingApproved: (code: string, date: string, time: string) =>
    pushNotification(code, "booking_approved", "Lịch học được xác nhận", `${date} lúc ${time}`),

  bookingDeclined: (code: string, date: string) =>
    pushNotification(code, "booking_declined", "Lịch học bị từ chối", `Buổi ${date} không khả dụng`),

  comment: (code: string, excerpt: string) =>
    pushNotification(code, "comment", "Thầy Hiếu đã nhận xét", excerpt),

  achievement: (code: string, name: string) =>
    pushNotification(code, "achievement", `Huy hiệu mới: ${name}`, "Bạn đã mở khóa thành tích mới!"),
};
