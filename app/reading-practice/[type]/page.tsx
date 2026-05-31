import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

const VALID_TYPES = ["single", "double", "triple"] as const;
type PassageType = (typeof VALID_TYPES)[number];

const TYPE_META: Record<PassageType, { label: string; roman: string; sub: string }> = {
  single: { label: "Đoạn đơn", roman: "I",   sub: "Single Passage" },
  double: { label: "Đoạn đôi", roman: "II",  sub: "Double Passage" },
  triple: { label: "Đoạn ba",  roman: "III", sub: "Triple Passage" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const meta = TYPE_META[type as PassageType];
  return { title: meta ? `${meta.label} — Reading Practice` : "Reading Practice" };
}

export default async function ReadingTypeListPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!VALID_TYPES.includes(type as PassageType)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [passages, attempts] = await Promise.all([
    prisma.readingPassage.findMany({
      where: { type },
      orderBy: { orderIndex: "asc" },
      select: {
        id: true,
        category: true,
        orderIndex: true,
        _count: { select: { questions: true } },
      },
    }),
    user
      ? prisma.readingAttempt.findMany({
          where: { userId: user.id },
          select: { passageId: true, score: true },
        })
      : Promise.resolve([]),
  ]);

  const bestScore: Record<string, number> = {};
  for (const a of attempts) {
    if (bestScore[a.passageId] == null || a.score > bestScore[a.passageId]) {
      bestScore[a.passageId] = a.score;
    }
  }

  const meta = TYPE_META[type as PassageType];
  const grouped =
    type === "single"
      ? groupByCategory(passages)
      : [{ category: null, items: passages }];

  const totalDone = Object.keys(bestScore).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 2rem)",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Back */}
        <Link
          href="/reading-practice"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            textDecoration: "none",
            letterSpacing: "0.04em",
            marginBottom: "2rem",
          }}
        >
          ← Reading Practice
        </Link>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginBottom: "0.3rem" }}>
            <span
              style={{
                fontFamily: "var(--font-reading-display)",
                fontSize: "0.9rem",
                color: "var(--border)",
                fontWeight: 700,
              }}
            >
              {meta.roman}
            </span>
            <h1
              style={{
                fontFamily: "var(--font-reading-display)",
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {meta.label}
            </h1>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              {meta.sub}
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {passages.length} bài &nbsp;·&nbsp; {totalDone} đã hoàn thành
          </p>
          {totalDone > 0 && (
            <div style={{ marginTop: "0.6rem", height: 3, maxWidth: 200, background: "var(--border)", borderRadius: 999 }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.round((totalDone / passages.length) * 100)}%`,
                  background: "var(--accent-primary)",
                  borderRadius: 999,
                }}
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", marginBottom: "2rem" }} />

        {/* Grouped list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {grouped.map(({ category, items }) => {
            const catParam = category ? encodeURIComponent(category) : "all";
            const catDone = items.filter((p) => bestScore[p.id] != null).length;

            return (
              <div key={category ?? "all"}>
                {category && (
                  <div style={{ marginBottom: "0.8rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--accent-primary)",
                        }}
                      >
                        {category}
                      </span>
                      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                        {catDone}/{items.length}
                      </span>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(160px, 100%), 1fr))",
                    gap: "0.5rem",
                  }}
                >
                  {items.map((p, idx) => {
                    const score = bestScore[p.id];
                    const done = score != null;
                    const scoreColor =
                      score == null ? "var(--text-muted)"
                      : score >= 80 ? "var(--accent-green)"
                      : score >= 50 ? "var(--accent-yellow)"
                      : "var(--accent-red)";

                    return (
                      <Link
                        key={p.id}
                        href={`/reading-practice/${type}/${p.id}?cat=${catParam}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.6rem 0.85rem",
                          background: done ? "var(--bg-secondary)" : "var(--bg-primary)",
                          border: `1px solid ${done ? "var(--accent-primary)" : "var(--border)"}`,
                          borderRadius: "var(--radius-md)",
                          textDecoration: "none",
                          opacity: 1,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              marginBottom: "0.1rem",
                            }}
                          >
                            Bài {p.orderIndex}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                            {p._count.questions} câu
                          </div>
                        </div>
                        {done ? (
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: scoreColor }}>
                            {score}%
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.7rem", color: "var(--border)" }}>→</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function groupByCategory(
  passages: { id: string; category: string | null; orderIndex: number; _count: { questions: number } }[]
) {
  const map = new Map<string, typeof passages>();
  for (const p of passages) {
    const key = p.category ?? "Khác";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return [...map.entries()].map(([category, items]) => ({ category, items }));
}
