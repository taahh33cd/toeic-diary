"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { SubmissionsMap } from "@/lib/firebase/types";

/** Realtime map of submission keys → { ticked, url, updatedAt } for one student. */
export function useSubmissions(code: string | null | undefined) {
  const [submissions, loading, error] = useObjectVal<SubmissionsMap>(
    code ? ref(firebaseDb, `submissions/${code}`) : null
  );
  return { submissions: (submissions ?? {}) as SubmissionsMap, loading, error };
}
