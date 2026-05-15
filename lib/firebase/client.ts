import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "placeholder",
  authDomain: "quanlyhocvien-b1796.firebaseapp.com",
  databaseURL:
    "https://quanlyhocvien-b1796-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quanlyhocvien-b1796",
  storageBucket: "quanlyhocvien-b1796.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "placeholder",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "placeholder",
};

export const firebaseApp: FirebaseApp =
  getApps()[0] ?? initializeApp(config);

export const firebaseDb: Database = getDatabase(firebaseApp);
export const firebaseAuth: Auth = getAuth(firebaseApp);
