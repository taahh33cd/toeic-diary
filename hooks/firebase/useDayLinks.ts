"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { DayLinksMap } from "@/lib/firebase/types";

/** Realtime map of hwId → { link, submittedAt } for one student. */
export function useDayLinks(code: string | null | undefined) {
  const [dayLinks, loading, error] = useObjectVal<DayLinksMap>(
    code ? ref(firebaseDb, `daylinks/${code}`) : null
  );
  return { dayLinks: dayLinks ?? {}, loading, error };
}
