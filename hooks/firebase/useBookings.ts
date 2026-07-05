"use client";

import { ref, query, orderByChild, equalTo } from "firebase/database";
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
  // Students may only read their own bookings — scope the query by studentId so
  // the security rule can enforce it. Admin (no studentId filter) reads all.
  const bookingsQuery = useMemo(
    () =>
      filter?.studentId
        ? query(ref(firebaseDb, "bookings"), orderByChild("studentId"), equalTo(filter.studentId))
        : ref(firebaseDb, "bookings"),
    [filter?.studentId]
  );

  const [raw, loading, error] = useObjectVal<BookingsRaw>(bookingsQuery);

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
