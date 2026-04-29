"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { AttendanceMap } from "@/lib/firebase/types";

/** Realtime attendance map (date → status) for one student. */
export function useAttendance(code: string | null | undefined) {
  const [attendance, loading, error] = useObjectVal<AttendanceMap>(
    code ? ref(firebaseDb, `attendance/${code}`) : null
  );
  return { attendance: (attendance ?? {}) as AttendanceMap, loading, error };
}
