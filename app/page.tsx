import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Flame, BookCheck, ChevronRight, Headphones, Image, MessageSquare, Users, Megaphone, BookOpen } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let profile = null;
  let seriesList: any[] = [];
  let totalCompleted = 0;
  let seriesProgress: Record<string, { total: number; completed: number }> = {};

  try {
    const [profileData, seriesData, progressCounts] = await Promise.all([
      prisma.profile.findUnique({
        where: { id: user.id },
        select: { displayName: true, currentStreak: true },
      }),
      prisma.testSeries.findMany({
        orderBy: { orderIndex: "asc" },
        include: { testSets: { select: { id: true } } },
      }),
      prisma.userProgress.groupBy({
        by: ["lessonId"],
        where: { userId: user.id, status: "completed", score: { gte: 70 } },
        _count: true,
      }),
    ]);

    profile = profileData;
    seriesList = seriesData;
    totalCompleted = progressCounts.length;
    const completedLessonIds = new Set(progressCounts.map((p) => p.lessonId));

    const allTestSetIds = seriesList.flatMap((s: any) => s.testSets.map((t: any) => t.id));
    if (allTestSetIds.length > 0) {
      const lessons = await prisma.lesson.findMany({
        where: { part: { testSetId: { in: allTestSetIds } } },
        select: {
          id: true,
          part: { select: { testSet: { select: { id: true, seriesId: true } } } },
        },
      });
      for (const lesson of lessons) {
        const sid = lesson.part.testSet.seriesId;
        if (!seriesProgress[sid]) seriesProgress[sid] = { total: 0, completed: 0 };
        seriesProgress[sid].total++;
        if (completedLessonIds.has(lesson.id)) seriesProgress[sid].completed++;
      }
    }
  } catch (err) {
    console.error("DB error:", err);
  }

  const displayName = profile?.displayName ?? user.email?.split("@")[0] ?? "bạn";
  const streak = profile?.currentStreak ?? 0;

  const PARTS = [
    { part: 1, Icon: Image,        name: "Photographs",       desc: "6 câu / đề" },
    { part: 2, Icon: MessageSquare, name: "Question-Response", desc: "25 câu / đề" },
    { part: 3, Icon: Users,        name: "Conversations",     desc: "39 câu / đề" },
    { part: 4, Icon: Megaphone,    name: "Talks",             desc: "30 câu / đề" },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8f9ff" }}>
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main
        style={{ flex: 1, maxWidth: 1120, margin: "0 auto", width: "100%", padding: "40px 24px" }}
      >
        {/* Welcome */}
        <section style={{ marginBottom: 40 }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 style={{ fontSize: 40, fontWeight: 700, lineHeight: "48px", letterSpacing: "-0.02em", color: "#0b1c30", marginBottom: 8 }}>
                Xin chào, {displayName}! 👋
              </h1>
              <p style={{ fontSize: 18, lineHeight: "28px", color: "#3e4850", maxWidth: 520 }}>
                Luyện nghe chủ động — phương pháp hiệu quả nhất để nâng cấp kỹ năng nghe TOEIC của bạn mỗi ngày.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <StatCard
                icon={<Flame size={20} style={{ color: "#0ea5e9" }} />}
                label="Ngày Streak"
                value={`${streak} ngày`}
              />
              <StatCard
                icon={<BookCheck size={20} style={{ color: "#0ea5e9" }} />}
                label="Đã hoàn thành"
                value={`${totalCompleted} bài`}
              />
            </div>
          </div>
        </section>

        {/* Luyện tập theo Part */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <Headphones size={20} style={{ color: "#0ea5e9" }} />
            <h2 style={{ fontSize: 24, fontWeight: 600, lineHeight: "32px", color: "#0b1c30" }}>
              Luyện tập theo Part
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PARTS.map(({ part, Icon, name, desc }) => (
              <Link
                key={part}
                href={`/practice/part-${part}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: 24,
                  background: "#ffffff",
                  border: "1px solid #bec8d2",
                  borderRadius: 8,
                  textDecoration: "none",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
                className="group hover:-translate-y-0.5"
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: "rgba(14,165,233,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Icon size={22} style={{ color: "#0ea5e9" }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#0b1c30", marginBottom: 2 }}>Part {part}</p>
                <p style={{ fontSize: 14, color: "#3e4850", marginBottom: 4 }}>{name}</p>
                <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: "#6e7881", textTransform: "uppercase" }}>
                  {desc}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Chọn bộ đề */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={20} style={{ color: "#0ea5e9" }} />
              <h2 style={{ fontSize: 24, fontWeight: 600, lineHeight: "32px", color: "#0b1c30" }}>
                Chọn bộ đề
              </h2>
            </div>
            <span style={{ fontSize: 14, color: "#6e7881" }}>{seriesList.length} bộ đề</span>
          </div>

          {seriesList.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {seriesList.map((series) => {
                const prog = seriesProgress[series.id] ?? { total: 0, completed: 0 };
                const percent = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
                const testCount = series.testSets.length;

                return (
                  <Link
                    key={series.id}
                    href={`/series/${series.slug}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: 24,
                      background: "#ffffff",
                      border: "1px solid #bec8d2",
                      borderRadius: 8,
                      textDecoration: "none",
                      transition: "box-shadow 0.2s, transform 0.2s",
                    }}
                    className="group hover:-translate-y-0.5"
                  >
                    {/* Card header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 8,
                            background: "rgba(14,165,233,0.1)",
                            border: "1px solid rgba(14,165,233,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            flexShrink: 0,
                          }}
                        >
                          {series.icon}
                        </div>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0b1c30", lineHeight: "24px" }}>
                            {series.name}
                          </h3>
                          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: "#3e4850", textTransform: "uppercase", marginTop: 2 }}>
                            {series.publisher}{series.year ? ` · ${series.year}` : ""}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        style={{ color: "#6e7881", flexShrink: 0, marginTop: 4, transition: "color 0.2s" }}
                        className="group-hover:text-[#0ea5e9]"
                      />
                    </div>

                    {/* Description */}
                    {series.description && (
                      <p style={{ fontSize: 14, color: "#3e4850", lineHeight: "20px", marginBottom: 24 }}
                        className="line-clamp-2">
                        {series.description}
                      </p>
                    )}

                    {/* Progress */}
                    <div style={{ marginTop: "auto" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6e7881", fontWeight: 500, marginBottom: 8 }}>
                        <span>{testCount} đề thi</span>
                        <span>{prog.completed}/{prog.total} bài ≥70</span>
                      </div>
                      <div style={{ width: "100%", height: 6, background: "#dce9ff", borderRadius: 9999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${percent}%`, background: "#0ea5e9", borderRadius: 9999 }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0ea5e9" }}>{percent}%</span>
                        {percent === 0 ? (
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#0ea5e9", display: "flex", alignItems: "center", gap: 4 }}
                            className="group-hover:translate-x-0.5 transition-transform inline-flex">
                            Bắt đầu →
                          </span>
                        ) : percent === 100 ? (
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#16a34a" }}>✅ Hoàn thành</span>
                        ) : (
                          <span style={{ fontSize: 14, color: "#6e7881" }}>Đang học</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid rgba(190,200,210,0.3)",
        borderRadius: 8,
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      {icon}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: "#3e4850", textTransform: "uppercase" }}>
          {label}
        </p>
        <p style={{ fontSize: 24, fontWeight: 600, lineHeight: "32px", color: "#0ea5e9" }}>{value}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #bec8d2",
        borderRadius: 8,
        padding: 48,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0b1c30", marginBottom: 8 }}>Chưa có bộ đề nào</h3>
      <p style={{ fontSize: 14, color: "#3e4850" }}>Admin cần import nội dung để bắt đầu.</p>
    </div>
  );
}
