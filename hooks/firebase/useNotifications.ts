"use client";

import { ref, update } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { FbNotification, NotificationsMap } from "@/lib/firebase/types";
import { useCallback, useMemo } from "react";

/** Realtime notifications for one student, sorted newest-first. */
export function useNotifications(code: string | null | undefined) {
  const [raw, loading, error] = useObjectVal<NotificationsMap>(
    code ? ref(firebaseDb, `notifications/${code}`) : null
  );

  const notifications = useMemo(() => {
    if (!raw) return [];
    const data = raw as Record<string, FbNotification>;
    return Object.entries(data)
      .map(([ts, n]) => ({ ...n, _key: ts }))
      .sort((a, b) => b._key.localeCompare(a._key));
  }, [raw]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(
    (key: string) => {
      if (!code) return;
      void update(ref(firebaseDb, `notifications/${code}/${key}`), { read: true });
    },
    [code]
  );

  const markAllRead = useCallback(() => {
    if (!code) return;
    const updates: Record<string, unknown> = {};
    for (const n of notifications) {
      if (!n.read) updates[`${n._key}/read`] = true;
    }
    if (Object.keys(updates).length > 0) {
      void update(ref(firebaseDb, `notifications/${code}`), updates);
    }
  }, [code, notifications]);

  return { notifications, unreadCount, loading, error, markAsRead, markAllRead };
}
