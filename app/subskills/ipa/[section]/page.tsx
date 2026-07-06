import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { getIpaSet, isIpaSection, IPA_DIFFICULTIES } from "@/lib/subskills/ipa";
import { IpaSectionClient, type ExerciseProgress, type ExerciseDraft } from "@/components/subskills/ipa/IpaSectionClient";

type Props = { params: Promise<{ section: string }>; searchParams: Promise<{ d?: string }> };

const SECTION_LABEL: Record<string, string> = {
  vowels: "Vowels — Nguyên âm đơn",
  diphthongs: "Diphthongs — Nguyên âm đôi",
  consonants: "Consonants — Phụ âm",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  return { title: `${SECTION_LABEL[section] ?? "IPA"} — Subskills` };
}

export default async function IpaSectionPage({ params, searchParams }: Props) {
  const { section } = await params;
  if (!isIpaSection(section)) notFound();

  const { d } = await searchParams;
  const difficulty = d === "hard" ? "hard" : d === "medium" ? "medium" : "easy";
  const set = getIpaSet(section, difficulty);

  // Best score + resume drafts for this section+difficulty
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  type Row = { exerciseIndex: number; score: number; passed: boolean; itemIdx: number | null; correctCount: number | null; completedAt: Date };
  const attempts: Row[] = user
    ? await prisma.ipaAttempt
        .findMany({
          where: { userId: user.id, section, difficulty },
          select: { exerciseIndex: true, score: true, passed: true, itemIdx: true, correctCount: true, completedAt: true },
        })
        .catch(() => [] as Row[])
    : [];

  const best: Record<number, ExerciseProgress> = {};
  const latestCheckpoint: Record<number, { itemIdx: number; correctCount: number; at: Date }> = {};
  const latestComplete: Record<number, Date> = {};
  for (const a of attempts) {
    if (!best[a.exerciseIndex] || a.score > best[a.exerciseIndex].score) {
      best[a.exerciseIndex] = { score: a.score, passed: a.passed };
    }
    if (a.itemIdx !== null && a.correctCount !== null) {
      const cur = latestCheckpoint[a.exerciseIndex];
      if (!cur || a.completedAt > cur.at) latestCheckpoint[a.exerciseIndex] = { itemIdx: a.itemIdx, correctCount: a.correctCount, at: a.completedAt };
    } else {
      const cur = latestComplete[a.exerciseIndex];
      if (!cur || a.completedAt > cur) latestComplete[a.exerciseIndex] = a.completedAt;
    }
  }
  const drafts: Record<number, ExerciseDraft> = {};
  for (const [k, cp] of Object.entries(latestCheckpoint)) {
    const ei = Number(k);
    const done = latestComplete[ei];
    if (!done || cp.at > done) drafts[ei] = { itemIdx: cp.itemIdx, correctCount: cp.correctCount };
  }

  return (
    <div style={{ minHeight: "100%", background: "var(--bg-primary)", padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)", maxWidth: 760, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/ipa" style={{ color: "var(--text-muted)", textDecoration: "none" }}>IPA</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{SECTION_LABEL[section]}</span>
      </div>

      <h1 style={{ fontSize: "clamp(1.2rem, 3vw, 1.6rem)", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 1rem" }}>{SECTION_LABEL[section]}</h1>

      {/* Difficulty tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {IPA_DIFFICULTIES.map((diff) => {
          const active = diff === difficulty;
          return (
            <Link
              key={diff}
              href={`/subskills/ipa/${section}?d=${diff}`}
              style={{
                padding: "0.4rem 1rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600,
                textDecoration: "none", textTransform: "capitalize",
                border: `1.5px solid ${active ? "var(--accent-primary)" : "var(--border)"}`,
                background: active ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: active ? "#fff" : "var(--text-secondary)",
              }}
            >
              {diff}
            </Link>
          );
        })}
      </div>

      {set ? (
        <IpaSectionClient
          section={section}
          difficulty={difficulty}
          passThreshold={set.passThreshold}
          exercises={set.exercises}
          best={best}
          drafts={drafts}
        />
      ) : (
        <div style={{ padding: "2rem 1.5rem", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "var(--radius-lg)", background: "var(--bg-secondary)", color: "var(--text-muted)", fontSize: "0.88rem" }}>
          Nội dung mức <strong style={{ textTransform: "capitalize" }}>{difficulty}</strong> đang được biên soạn — sắp có.
        </div>
      )}
    </div>
  );
}
