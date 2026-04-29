"use client";

import { useFirebaseAuthBridge } from "@/hooks/firebase/useFirebaseAuthBridge";

/**
 * Mounts the Supabase ↔ Firebase auth bridge.
 * Include once in the root layout (inside <body>).
 * Renders no UI — purely a side-effect component.
 */
export function FirebaseBridgeProvider() {
  useFirebaseAuthBridge();
  return null;
}
