import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChevronRight } from "lucide-react";
import { isUsageExempt } from "@/lib/access";
import { UsageGate } from "@/components/shared/UsageGate";

const PARTS = [
  {
    part: 1,
    href: "/practice/part-1",
    icon: "📷",
    label: "Part 1",
    sub: "Photographs",
    desc: "Nghe và chọn câu mô tả đúng bức ảnh.",
    color: "#e55a6b",
    bg: "linear-gradient(135deg, rgba(229,90,107,0.12), rgba(229,90,107,0.04))",
    border: "rgba(229,90,107,0.3)",
  },
  {
    part: 2,
    href: "/practice/part-2",
    icon: "💬",
    label: "Part 2",
    sub: "Question–Response",
    desc: "Nghe câu hỏi, chọn đáp án phù hợp nhất.",
    color: "#d97706",
    bg: "linear-gradient(135deg, rgba(217,119,6,0.12), rgba(217,119,6,0.04))",
    border: "rgba(217,119,6,0.3)",
  },
  {
    part: 3,
    href: "/practice/part-3",
    icon: "🗣️",
    label: "Part 3",
    sub: "Conversations",
    desc: "Nghe hội thoại, trả lời 3 câu hỏi liên quan.",
    color: "#6366f1",
    bg: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.04))",
    border: "rgba(99,102,241,0.3)",
  },
  {
    part: 4,
    href: "/practice/part-4",
    icon: "📢",
    label: "Part 4",
    sub: "Talks",
    desc: "Nghe bài nói độc thoại, trả lời 3 câu hỏi liên quan.",
    color: "#10b981",
    bg: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))",
    border: "rgba(16,185,129,0.3)",
  },
];

export default async function PracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/practice");

  const profile = await prisma.profile
    .findUnique({ where: { id: user.id }, select: { displayName: true, role: true, studentCode: true, enrolledCourses: true, freeUsageSeconds: true } })
    .catch(() => null);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <UsageGate initialSeconds={profile?.freeUsageSeconds ?? 0} isExempt={isUsageExempt(profile)} />
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            🎧 Luyện tập theo Part
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Chọn Part để bắt đầu luyện nghe có mục tiêu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PARTS.map((p) => (
            <Link
              key={p.part}
              href={p.href}
              className="group flex items-center gap-5 px-6 py-5 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{
                background: p.bg,
                borderColor: p.border,
              }}
            >
              <span className="text-4xl shrink-0">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold" style={{ color: p.color }}>
                    {p.label}
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    {p.sub}
                  </span>
                </div>
                <p className="text-sm mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                  {p.desc}
                </p>
              </div>
              <ChevronRight
                size={20}
                className="shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: p.color, opacity: 0.7 }}
              />
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
