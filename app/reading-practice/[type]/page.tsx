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

const TYPE_BG: Record<PassageType, string> = {
  single: "#e3f2fd",
  double: "#e8f5e9",
  triple: "#f3e5f5",
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
      select: { id: true, category: true, orderIndex: true },
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
  const bg = TYPE_BG[type as PassageType];

  if (type === "single") {
    // Group by category, show category cards
    const grouped = groupByCategory(passages);

    return (
      <div style={pageWrap}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <Link href="/reading-practice" style={backLink}>← Reading Practice</Link>
          <h1 style={pageTitle}>{label}</h1>
          <p style={pageSub}>{passages.length} bài · Chọn nhóm để bắt đầu luyện</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>
            {grouped.map(({ category, items }) => {
              const firstId = items[0].id;
              const doneCount = items.filter((p) => bestScore[p.id] != null).length;
              const avgScore =
                doneCount > 0
                  ? Math.round(
                      items
                        .filter((p) => bestScore[p.id] != null)
                        .reduce((s, p) => s + bestScore[p.id], 0) / doneCount
                    )
                  : null;
              const catParam = encodeURIComponent(category);
              const href = `/reading-practice/${type}/${firstId}?cat=${catParam}`;

              return (
                <Link
                  key={category}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 1.25rem",
                    background: "var(--bg-elevated)",
                    border: `1px solid ${doneCount > 0 ? color + "44" : "var(--border)"}`,
                    borderRadius: "var(--radius-lg)",
                    textDecoration: "none",
                    boxShadow: "var(--shadow-sm)",
                    gap: "1rem",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.2rem" }}>
                      {category}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {items.length} bài · {doneCount} đã làm
                    </div>
                    {doneCount > 0 && (
                      <div style={{ marginTop: 6, height: 4, background: "var(--bg-secondary)", borderRadius: 999, maxWidth: 200 }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.round((doneCount / items.length) * 100)}%`,
                            background: color,
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                    {avgScore != null && (
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: avgScore >= 80 ? "var(--accent-green)" : avgScore >= 50 ? "var(--accent-yellow)" : "var(--accent-red)",
                        }}
                      >
                        avg {avgScore}%
                      </span>
                    )}
                    <span
                      style={{
                        background: bg,
                        color,
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        padding: "6px 16px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Bắt đầu →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Double / Triple — single session for all passages
  const firstId = passages[0]?.id;
  const doneCount = passages.filter((p) => bestScore[p.id] != null).length;

  return (
    <div style={pageWrap}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <Link href="/reading-practice" style={backLink}>← Reading Practice</Link>
        <h1 style={pageTitle}>{label}</h1>
        <p style={pageSub}>{passages.length} bài · {doneCount} đã làm</p>

        {doneCount > 0 && (
          <div style={{ margin: "1rem 0", height: 6, background: "var(--bg-elevated)", borderRadius: 999 }}>
            <div
              style={{
                height: "100%",
                width: `${Math.round((doneCount / passages.length) * 100)}%`,
                background: color,
                borderRadius: 999,
              }}
            />
          </div>
        )}

        {firstId && (
          <Link
            href={`/reading-practice/${type}/${firstId}?cat=all`}
            style={{
              display: "inline-block",
              marginTop: "1.5rem",
              background: color,
              color: "white",
              fontWeight: 700,
              fontSize: "1rem",
              padding: "12px 32px",
              borderRadius: "var(--radius-lg)",
              textDecoration: "none",
            }}
          >
            Bắt đầu luyện {passages.length} bài →
          </Link>
        )}
      </div>
    </div>
  );
}

function groupByCategory(passages: { id: string; category: string | null; orderIndex: number }[]) {
  const map = new Map<string, typeof passages>();
  for (const p of passages) {
    const key = p.category ?? "Khác";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return [...map.entries()].map(([category, items]) => ({ category, items }));
}

// Shared styles
const pageWrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg-primary)",
  padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)",
};

const backLink: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "var(--text-muted)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.3rem",
  marginBottom: "1.25rem",
};

const pageTitle: React.CSSProperties = {
  fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
  fontWeight: 700,
  color: "var(--text-primary)",
  letterSpacing: "-0.02em",
  marginBottom: "0.4rem",
};

const pageSub: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "var(--text-muted)",
};
