"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { Booking, BookingStatus } from "@/lib/firebase/types";
import { useMemo } from "react";

type BookingsRaw = Record<string, Booking>;

interface BookingFilter {
  status?: BookingStatus | BookingStatus[];
  studentId?: string;
}

export function useBookings(filter?: BookingFilter) {
  const [raw, loading, error] = useObjectVal<BookingsRaw>(
    ref(firebaseDb, "bookings")
  );

  const bookings = useMemo(() => {
    if (!raw) return [];
    const data = raw as Record<string, Booking>;
    let list = Object.values(data);

    if (filter?.studentId) {
      list = list.filter((b) => b.studentId === filter.studentId);
    }
    if (filter?.status) {
      const statuses = Array.isArray(filter.status)
        ? filter.status
        : [filter.status];
      list = list.filter((b) => statuses.includes(b.status));
    }

    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [raw, filter?.studentId, filter?.status]);

  return { bookings, loading, error };
}
