"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { VocabWord } from "@/lib/firebase/types";
import { useMemo } from "react";

type VocabRaw = Record<string, Omit<VocabWord, "id">>;

/**
 * Realtime vocab list for one student.
 * Sorted by addedDate desc (newest first).
 */
export function useVocab(code: string | null | undefined) {
  const [raw, loading, error] = useObjectVal<VocabRaw>(
    code ? ref(firebaseDb, `vocab/${code}`) : null
  );

  const words = useMemo(() => {
    if (!raw) return [];
    const data = raw as Record<string, Omit<VocabWord, "id">>;
    return Object.entries(data)
      .map(([id, w]) => ({ ...w, id }))
      .sort((a, b) => (b.addedDate ?? "").localeCompare(a.addedDate ?? ""));
  }, [raw]);

  return { words, loading, error };
}
