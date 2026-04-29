"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { Student } from "@/lib/firebase/types";
import { useMemo } from "react";

type StudentsMap = Record<string, Student>;

/**
 * Returns all students. Pass teacherId to filter to a specific teacher's students.
 * Pass null as teacherId to see all (admin view).
 */
export function useAllStudents(teacherId?: string | null) {
  const [raw, loading, error] = useObjectVal<StudentsMap>(
    ref(firebaseDb, "students")
  );

  const students = useMemo(() => {
    if (!raw) return [];
    const data = raw as Record<string, Student>;
    const all = Object.entries(data).map(([code, s]) => ({ ...s, id: code }));
    if (!teacherId) return all;
    return all.filter((s) => s.teacherId === teacherId);
  }, [raw, teacherId]);

  return { students, loading, error };
}
