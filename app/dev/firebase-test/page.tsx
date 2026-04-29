"use client";

import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

const SAMPLE_CODE = "0336266328";

function StudentDetail() {
  const { student, loading, error } = useStudent(SAMPLE_CODE);
  if (loading) return <p>Loading student…</p>;
  if (error) return <pre style={{ color: "red" }}>{error.message}</pre>;
  if (!student) return <p>Not found.</p>;
  return (
    <div style={{ marginTop: 8, padding: 12, background: "#f5efe6", borderRadius: 8 }}>
      <strong>{student.name}</strong> — Tuần {student.currentWeek}
      <br />Điểm số: {(student.scores ?? []).length} bài ·
      Homework: {(student.homework ?? []).length} bài
    </div>
  );
}

function FirebaseAuthStatus() {
  const [fbUser, setFbUser] = useState<FirebaseUser | null | "loading">("loading");

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (u) => setFbUser(u));
  }, []);

  if (fbUser === "loading") return <p>Checking Firebase auth…</p>;
  if (!fbUser) return <p style={{ color: "#b00020" }}>❌ Not signed in to Firebase</p>;
  return (
    <div style={{ padding: 12, background: "#e8f5e9", borderRadius: 8 }}>
      <p>✅ Firebase UID: <code>{fbUser.uid}</code></p>
      <p>Provider: <code>{fbUser.providerData[0]?.providerId ?? "custom"}</code></p>
    </div>
  );
}

export default function FirebaseTestPage() {
  const { students, loading } = useAllStudents();

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui", maxWidth: 640 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>Firebase — Dev Test</h1>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>🔐 Firebase Auth State</h2>
        <p style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
          Sẽ có uid sau khi login qua Supabase (bridge tự động kích hoạt).
          Cần FIREBASE_SERVICE_ACCOUNT_JSON trong .env để hoạt động.
        </p>
        <FirebaseAuthStatus />
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>📋 useAllStudents()</h2>
        {loading ? <p>Loading…</p> : (
          <>
            <p>Count: <strong>{students.length}</strong></p>
            <ul>{students.slice(0, 5).map((s) => (
              <li key={s.id}><code>{s.id}</code> — {s.name}</li>
            ))}</ul>
          </>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>👤 useStudent("{SAMPLE_CODE}")</h2>
        <StudentDetail />
      </section>
    </main>
  );
}
