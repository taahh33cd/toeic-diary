"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { Goal } from "@/lib/firebase/types";

/** Realtime goal data for one student (path: goals/{code}). */
export function useGoal(code: string | null | undefined) {
  const [goal, loading, error] = useObjectVal<Goal>(
    code ? ref(firebaseDb, `goals/${code}`) : null
  );
  return { goal: goal ?? null, loading, error };
}
