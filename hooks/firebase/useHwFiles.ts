"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { HwFilesMap } from "@/lib/firebase/types";

/** Realtime map of hwId → { fileId → { url, uploadedAt, name? } } for one student. */
export function useHwFiles(code: string | null | undefined) {
  const [hwFiles, loading] = useObjectVal<HwFilesMap>(
    code ? ref(firebaseDb, `hwFiles/${code}`) : null
  );
  return { hwFiles: (hwFiles ?? {}) as HwFilesMap, loading };
}
