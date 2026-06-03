"use client";

import { useEffect, useState } from "react";
import { ref, onValue, update, query, orderByChild, limitToLast } from "firebase/database";
import { firebaseDb } from "@/lib/firebase/client";

export interface AdminNotif {
  id: string;
  title: string;
  body: string;
  url: string;
  createdAt: number;
  read: boolean;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotif[]>([]);

  useEffect(() => {
    const q = query(
      ref(firebaseDb, "adminNotifications"),
      orderByChild("createdAt"),
      limitToLast(50)
    );
    const unsub = onValue(q, (snap) => {
      if (!snap.exists()) { setNotifications([]); return; }
      const items: AdminNotif[] = [];
      snap.forEach((child) => {
        items.push({ id: child.key!, ...(child.val() as Omit<AdminNotif, "id">) });
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(items);
    });
    return () => unsub();
  }, []);

  const markAsRead = (id: string) => {
    update(ref(firebaseDb, `adminNotifications/${id}`), { read: true });
  };

  const markAllRead = () => {
    const updates: Record<string, boolean> = {};
    notifications.filter((n) => !n.read).forEach((n) => {
      updates[`adminNotifications/${n.id}/read`] = true;
    });
    if (Object.keys(updates).length > 0) {
      update(ref(firebaseDb), updates);
    }
  };

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAsRead,
    markAllRead,
  };
}
