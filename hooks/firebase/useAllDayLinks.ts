"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { DayLinksMap } from "@/lib/firebase/types";

export function useAllDayLinks() {
  const [raw, loading, error] = useObjectVal<Record<string, DayLinksMap>>(
    ref(firebaseDb, "daylinks")
  );
  return { allDayLinks: (raw ?? {}) as Record<string, DayLinksMap>, loading, error };
}
