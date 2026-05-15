"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { AttendanceMap } from "@/lib/firebase/types";
import { useMemo } from "react";

type AllAttendance = Record<string, AttendanceMap>;

/** Reads attendance for all class members in one subscription. */
export function useClassAttendance(memberCodes: string[]) {
  const [raw, loading, error] = useObjectVal<AllAttendance>(
    memberCodes.length > 0 ? ref(firebaseDb, "attendance") : null
  );

  const key = memberCodes.slice().sort().join(",");

  const attendance = useMemo(() => {
    if (!raw) return {} as Record<string, AttendanceMap>;
    const result: Record<string, AttendanceMap> = {};
    for (const code of memberCodes) {
      result[code] = (raw[code] as AttendanceMap) ?? {};
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, key]);

  return { attendance, loading, error };
}
