"use client";

import { useEffect, useRef } from "react";
import { ref, update } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import { useToast } from "@/components/shared/Toast";
import type { FbNotification, NotificationsMap } from "@/lib/firebase/types";

const VARIANT_MAP: Record<string, "info" | "success" | "warning" | "error"> = {
  homework: "info",
  booking_approved: "success",
  booking_declined: "warning",
  comment: "info",
  achievement: "success",
};

/**
 * Watches notifications/{code} in Firebase and fires in-app toasts for
 * any unread notifications that arrive after mount. Marks them read after
 * toasting so they don't re-fire on re-mount.
 */
export function useNotificationToasts(code: string | null | undefined) {
  const { toast } = useToast();
  const seenKeys = useRef<Set<string>>(new Set());
  const initialLoad = useRef(true);

  const [raw] = useObjectVal<NotificationsMap>(
    code ? ref(firebaseDb, `notifications/${code}`) : null
  );

  useEffect(() => {
    if (!raw || !code) return;

    // Skip the very first snapshot (page load) — only toast new arrivals.
    if (initialLoad.current) {
      // Seed seenKeys with all existing keys so we don't re-toast on mount.
      Object.keys(raw).forEach((k) => seenKeys.current.add(k));
      initialLoad.current = false;
      return;
    }

    const toMark: Record<string, boolean> = {};

    Object.entries(raw).forEach(([key, n]) => {
      const notif = n as FbNotification;
      if (seenKeys.current.has(key)) return;
      seenKeys.current.add(key);

      if (notif.read) return;

      toast(`${notif.title}${notif.body ? ` — ${notif.body}` : ""}`, {
        variant: VARIANT_MAP[notif.type] ?? "info",
        duration: 4500,
      });

      toMark[`notifications/${code}/${key}/read`] = true;
    });

    if (Object.keys(toMark).length > 0) {
      update(ref(firebaseDb), toMark).catch(() => {/* best-effort */});
    }
  }, [raw, code, toast]);
}
