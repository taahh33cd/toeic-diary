"use client";

import { useNotificationToasts } from "@/hooks/firebase/useNotificationToasts";

/**
 * Invisible client component that watches Firebase notifications for the
 * current student and fires in-app toasts. Mount once inside the journal layout.
 */
export function NotificationWatcher({ studentCode }: { studentCode: string }) {
  useNotificationToasts(studentCode);
  return null;
}
