"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { HwViewedMap } from "@/lib/firebase/types";

/** Realtime map of hwId → { viewedAt, note? } for one student. */
export function useHwViewed(code: string | null | undefined) {
  const [hwViewed, loading] = useObjectVal<HwViewedMap>(
    code ? ref(firebaseDb, `hwViewed/${code}`) : null
  );
  return { hwViewed: (hwViewed ?? {}) as HwViewedMap, loading };
}
