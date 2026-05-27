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

/** Reads attendance for all class members in one subscription. Normalizes both plain-string and {markedAt,status} formats. */
export function useClassAttendance(memberCodes: string[]) {
  const [raw, loading, error] = useObjectVal<Record<string, Record<string, RawAttendanceValue>>>(
    memberCodes.length > 0 ? ref(firebaseDb, "attendance") : null
  );

  const key = memberCodes.slice().sort().join(",");

  const attendance = useMemo(() => {
    if (!raw) return {} as Record<string, AttendanceMap>;
    const result: Record<string, AttendanceMap> = {};
    for (const code of memberCodes) {
      const studentRaw = raw[code];
      if (!studentRaw) { result[code] = {}; continue; }
      const normalized: AttendanceMap = {};
      for (const [date, val] of Object.entries(studentRaw)) {
        const status = normalizeStatus(val);
        if (status) normalized[date] = status;
      }
      result[code] = normalized;
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, key]);

  return { attendance, loading, error };
}
