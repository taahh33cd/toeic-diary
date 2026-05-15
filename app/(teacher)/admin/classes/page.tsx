"use client";

import Link from "next/link";
import { useClasses } from "@/hooks/firebase/useClasses";

export default function ClassesPage() {
  const { classes, loading } = useClasses();

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        🏫 Lớp học
      </h1>

      {classes.length === 0 ? (
        <div
          className="rounded-xl p-8 border text-center"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-3">🏫</div>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            Chưa có lớp học
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Các lớp học sẽ xuất hiện ở đây khi được tạo trong Firebase.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/admin/classes/${cls.id}`}
              className="block rounded-xl p-4 border hover:opacity-80 transition-opacity"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-sm)",
                textDecoration: "none",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {cls.name}
                  </p>
                  {cls.desc && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {cls.desc}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    👥 {cls.members?.length ?? 0} học viên
                  </p>
                  {cls.weeklySchedule && cls.weeklySchedule.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {cls.weeklySchedule.map((session, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(196,98,45,0.08)",
                            color: "var(--accent-primary)",
                          }}
                        >
                          {session.day} · {session.time}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
