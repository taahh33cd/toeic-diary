import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

const VALID_TYPES = ["single", "double", "triple"] as const;
type PassageType = (typeof VALID_TYPES)[number];

const TYPE_LABEL: Record<PassageType, string> = {
  single: "Đoạn đơn",
  double: "Đoạn đôi",
  triple: "Đoạn ba",
};

const TYPE_COLOR: Record<PassageType, string> = {
  single: "#0056b3",
  double: "#1a6b2a",
  triple: "#6a1b9a",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const label = TYPE_LABEL[type as PassageType] ?? "Reading";
  return { title: `${label} — Reading Practice` };
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

  const label = TYPE_LABEL[type as PassageType];
  const color = TYPE_COLOR[type as PassageType];

  const grouped =
    type === "single"
      ? groupByCategory(passages)
      : [{ category: null, items: passages }];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Link
          href="/reading-practice"
          style={{
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            marginBottom: "1.25rem",
          }}
        >
          ← Reading Practice
        </Link>

        <h1
          style={{
            fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: "0.4rem",
          }}
        >
          {label}
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "2rem" }}>
          {passages.length} bài · {Object.keys(bestScore).length} bài đã làm
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {grouped.map(({ category, items }) => {
            const catParam = category ? encodeURIComponent(category) : "all";
            return (
              <div key={category ?? "all"}>
                {category && (
                  <h2
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      marginBottom: "0.6rem",
                      borderLeft: `3px solid ${color}`,
                      paddingLeft: "0.6rem",
                    }}
                  >
                    {category}
                  </h2>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))",
                    gap: "0.6rem",
                  }}
                >
                  {items.map((p) => {
                    const score = bestScore[p.id];
                    const done = score != null;
                    const scoreColor =
                      score == null
                        ? "var(--text-muted)"
                        : score >= 80
                        ? "var(--accent-green)"
                        : score >= 50
                        ? "var(--accent-yellow)"
                        : "var(--accent-red)";

                    return (
                      <Link
                        key={p.id}
                        href={`/reading-practice/${type}/${p.id}?cat=${catParam}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.65rem 0.9rem",
                          background: done ? "var(--bg-elevated)" : "var(--bg-secondary)",
                          border: `1px solid ${done ? color + "33" : "var(--border)"}`,
                          borderRadius: "var(--radius-md)",
                          textDecoration: "none",
                          transition: "box-shadow 0.12s",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                            Bài {p.orderIndex}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {p._count.questions} câu
                          </div>
                        </div>
                        {done ? (
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: scoreColor }}>
                            {score}%
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>→</span>
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
