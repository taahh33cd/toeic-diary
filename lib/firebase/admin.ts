import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getDatabase, type Database } from "firebase-admin/database";

/**
 * Firebase Admin SDK — server-side only.
 * Used for creating Custom Tokens in /api/firebase-token.
 *
 * Requires env var: FIREBASE_SERVICE_ACCOUNT_JSON
 * (JSON string of the service account key downloaded from Firebase Console)
 */

let adminApp: App;

function getAdminApp(): App {
  if (getApps().find((a) => a.name === "admin")) {
    return getApps().find((a) => a.name === "admin")!;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not set. " +
        "Download it from Firebase Console → Project Settings → Service accounts → Generate new private key."
    );
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  return initializeApp(
    {
      credential: cert(serviceAccount),
      databaseURL:
        "https://quanlyhocvien-b1796-default-rtdb.asia-southeast1.firebasedatabase.app",
    },
    "admin" // named app so it doesn't conflict with client SDK
  );
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Database {
  return getDatabase(getAdminApp());
}
