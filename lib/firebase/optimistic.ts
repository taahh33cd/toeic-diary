"use client";

import { useCallback, useState } from "react";
import { update, ref, type DatabaseReference } from "firebase/database";
import { firebaseDb } from "@/lib/firebase/client";

export type MutationState = "idle" | "pending" | "error";

/**
 * Wraps a Firebase RTDB write so the caller can apply an optimistic local
 * snapshot, fire the network mutation, and roll back on failure.
 *
 * Usage:
 *   const { mutate, state, error } = useOptimisticUpdate<{ note: string }>();
 *   await mutate({
 *     path: `students/${code}`,
 *     patch: { note: "new" },
 *     onOptimistic: () => setLocalNote("new"),
 *     onRollback:   () => setLocalNote(prev),
 *   });
 *
 * For pure reads (the dashboard's current shape), this isn't needed —
 * `useObjectVal` already streams fresh data. Use this for forms.
 */
export function useOptimisticUpdate<T extends object = Record<string, unknown>>() {
  const [state, setState] = useState<MutationState>("idle");
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (args: {
      path: string;
      patch: Partial<T>;
      onOptimistic?: () => void;
      onRollback?: () => void;
    }) => {
      setState("pending");
      setError(null);
      args.onOptimistic?.();
      try {
        const r: DatabaseReference = ref(firebaseDb, args.path);
        await update(r, args.patch);
        setState("idle");
        return { ok: true as const };
      } catch (err) {
        args.onRollback?.();
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setState("error");
        return { ok: false as const, error: e };
      }
    },
    []
  );

  return { mutate, state, error, isPending: state === "pending" };
}
