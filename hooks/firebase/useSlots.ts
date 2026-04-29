"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { Slot } from "@/lib/firebase/types";
import { useMemo } from "react";

type SlotsRaw = Record<string, Slot>;

/** Realtime list of all available slots, sorted by date asc. */
export function useSlots() {
  const [raw, loading, error] = useObjectVal<SlotsRaw>(
    ref(firebaseDb, "slots")
  );

  const slots = useMemo(() => {
    if (!raw) return [];
    const data = raw as Record<string, Slot>;
    return Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
  }, [raw]);

  return { slots, loading, error };
}
