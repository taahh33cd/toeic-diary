"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { SubmissionsMap } from "@/lib/firebase/types";

export function useAllSubmissions() {
  const [raw, loading, error] = useObjectVal<Record<string, SubmissionsMap>>(
    ref(firebaseDb, "submissions")
  );
  return { allSubmissions: (raw ?? {}) as Record<string, SubmissionsMap>, loading, error };
}
