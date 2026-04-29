"use client";

import { useEffect, useRef } from "react";
import { signInWithCustomToken, signOut, onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { createClient } from "@/lib/supabase/client";

/**
 * useFirebaseAuthBridge
 *
 * Keeps Firebase Auth in sync with Supabase Auth.
 *
 * - When Supabase user logs IN  → fetch /api/firebase-token → signInWithCustomToken
 * - When Supabase user logs OUT → Firebase signOut
 *
 * Mount this once in the root layout (client component).
 * Safe to call multiple times — effects are guarded.
 */
export function useFirebaseAuthBridge() {
  const isBridging = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          // Sign out of Firebase when Supabase session ends
          try {
            await signOut(firebaseAuth);
          } catch {
            // ignore — already signed out
          }
          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (isBridging.current) return;
          isBridging.current = true;

          try {
            const res = await fetch("/api/firebase-token", {
              method: "POST",
              credentials: "include", // send Supabase cookies
            });

            if (!res.ok) {
              const { error } = await res.json().catch(() => ({ error: res.statusText }));
              console.warn("[FirebaseAuthBridge] token fetch failed:", error);
              return;
            }

            const { token } = await res.json();
            await signInWithCustomToken(firebaseAuth, token);
          } catch (err) {
            console.warn("[FirebaseAuthBridge] error:", err);
          } finally {
            isBridging.current = false;
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}

/**
 * Helper: sign out of both Supabase and Firebase simultaneously.
 * Use this instead of calling supabase.auth.signOut() directly.
 */
export async function signOutAll() {
  const supabase = createClient();
  await Promise.allSettled([
    supabase.auth.signOut(),
    signOut(firebaseAuth),
  ]);
}
