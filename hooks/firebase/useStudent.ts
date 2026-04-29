"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { Student } from "@/lib/firebase/types";

export function useStudent(code: string | null | undefined) {
  const [student, loading, error] = useObjectVal<Student>(
    code ? ref(firebaseDb, `students/${code}`) : null
  );
  return { student: student ?? null, loading, error };
}
