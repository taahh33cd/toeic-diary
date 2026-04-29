"use client";

import { ref } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import type { SchoolClass } from "@/lib/firebase/types";
import { useMemo } from "react";

type ClassesRaw = Record<string, SchoolClass>;

/** Realtime list of all classes. */
export function useClasses() {
  const [raw, loading, error] = useObjectVal<ClassesRaw>(
    ref(firebaseDb, "classes")
  );

  const classes = useMemo(() => {
    if (!raw) return [];
    const data = raw as Record<string, SchoolClass>;
    return Object.values(data);
  }, [raw]);

  return { classes, loading, error };
}

/** Realtime single class by id. */
export function useClass(id: string | null | undefined) {
  const [schoolClass, loading, error] = useObjectVal<SchoolClass>(
    id ? ref(firebaseDb, `classes/${id}`) : null
  );
  return { schoolClass: schoolClass ?? null, loading, error };
}
