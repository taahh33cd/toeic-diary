"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { useMemo } from "react";
import { firebaseDb } from "@/lib/firebase/client";
import type { Homework } from "@/lib/firebase/types";

/**
 * Realtime listener for a student's homework array.
 * Sorted newest-first by date.
 */
export function useHomework(code: string | null | undefined) {
  const [raw, loading, error] = useObjectVal<Homework[]>(
    code ? ref(firebaseDb, `students/${code}/homework`) : null
  );

  const homework = useMemo(
    () => (raw ? [...raw].sort((a, b) => b.date.localeCompare(a.date)) : []),
    [raw]
  );

  return { homework, loading, error };
}
