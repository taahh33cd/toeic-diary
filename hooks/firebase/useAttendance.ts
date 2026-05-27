"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { AttendanceMap, AttendanceStatus } from "@/lib/firebase/types";
import { useMemo } from "react";

type RawAttendanceValue = AttendanceStatus | { markedAt?: string; status: AttendanceStatus };

function normalizeStatus(val: unknown): AttendanceStatus | undefined {
  if (typeof val === "string") return val as AttendanceStatus;
  if (val && typeof val === "object" && "status" in val) {
    return (val as { status: AttendanceStatus }).status;
  }
  return undefined;
}

/** Realtime attendance map (date → status) for one student. Normalizes both plain-string and {markedAt,status} formats. */
export function useAttendance(code: string | null | undefined) {
  const [raw, loading, error] = useObjectVal<Record<string, RawAttendanceValue>>(
    code ? ref(firebaseDb, `attendance/${code}`) : null
  );

  const attendance = useMemo((): AttendanceMap => {
    if (!raw) return {};
    const result: AttendanceMap = {};
    for (const [date, val] of Object.entries(raw)) {
      const status = normalizeStatus(val);
      if (status) result[date] = status;
    }
    return result;
  }, [raw]);

  return { attendance, loading, error };
}
