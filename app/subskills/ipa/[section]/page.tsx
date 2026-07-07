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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // TEST account unlocks all difficulties.
  const profile = user
    ? await prisma.profile.findUnique({ where: { id: user.id }, select: { studentCode: true } }).catch(() => null)
    : null;
  const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

  // Fetch attempts across ALL difficulties of this section (drives both unlock
  // gating and the active tab's best/drafts).
  type Row = { difficulty: string; exerciseIndex: number; score: number; passed: boolean; itemIdx: number | null; correctCount: number | null; completedAt: Date };
  const attempts: Row[] = user
    ? await prisma.ipaAttempt
        .findMany({
          where: { userId: user.id, section },
          select: { difficulty: true, exerciseIndex: true, score: true, passed: true, itemIdx: true, correctCount: true, completedAt: true },
        })
        .catch(() => [] as Row[])
    : [];

  // Top score per difficulty → progressive unlock (≥80% opens the next level).
  const topScore: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  for (const a of attempts) {
    if (a.score > (topScore[a.difficulty] ?? 0)) topScore[a.difficulty] = a.score;
  }
  const mediumUnlocked = isTestUser || topScore.easy >= 80;
  const hardUnlocked = isTestUser || topScore.medium >= 80;
  const isUnlocked = (diff: string) => diff === "easy" || (diff === "medium" ? mediumUnlocked : hardUnlocked);
  const activeUnlocked = isUnlocked(difficulty);

  // Best score + resume drafts for the ACTIVE difficulty only.
  const best: Record<number, ExerciseProgress> = {};
  const latestCheckpoint: Record<number, { itemIdx: number; correctCount: number; at: Date }> = {};
  const latestComplete: Record<number, Date> = {};
  for (const a of attempts) {
    if (a.difficulty !== difficulty) continue;
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
          const locked = !isUnlocked(diff);
          return (
            <Link
              key={diff}
              href={`/subskills/ipa/${section}?d=${diff}`}
              style={{
                padding: "0.4rem 1rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600,
                textDecoration: "none", textTransform: "capitalize",
                display: "inline-flex", alignItems: "center", gap: "0.3rem",
                border: `1.5px solid ${active ? "var(--accent-primary)" : "var(--border)"}`,
                background: active ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: active ? "#fff" : locked ? "var(--text-muted)" : "var(--text-secondary)",
                opacity: locked && !active ? 0.7 : 1,
              }}
            >
              {locked && <span aria-hidden>🔒</span>}
              {diff}
            </Link>
          );
        })}
      </div>

      {!set ? (
        <div style={{ padding: "2rem 1.5rem", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "var(--radius-lg)", background: "var(--bg-secondary)", color: "var(--text-muted)", fontSize: "0.88rem" }}>
          Nội dung mức <strong style={{ textTransform: "capitalize" }}>{difficulty}</strong> đang được biên soạn — sắp có.
        </div>
      ) : !activeUnlocked ? (
        <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--bg-secondary)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔒</div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem", textTransform: "capitalize" }}>
            Mức {difficulty} đang khoá
          </div>
          <p style={{ margin: "0 auto 1.25rem", maxWidth: 380, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Đạt <strong>≥ 80%</strong> ở ít nhất một bài mức{" "}
            <strong>{difficulty === "medium" ? "Easy" : "Medium"}</strong> để mở khoá mức này.
          </p>
          <Link
            href={`/subskills/ipa/${section}?d=${difficulty === "medium" ? "easy" : "medium"}`}
            style={{ display: "inline-block", padding: "0.55rem 1.2rem", borderRadius: "var(--radius-md, 8px)", background: "var(--accent-primary)", color: "#fff", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}
          >
            ← Về mức {difficulty === "medium" ? "Easy" : "Medium"}
          </Link>
        </div>
      ) : (
        <IpaSectionClient
          section={section}
          difficulty={difficulty}
          passThreshold={set.passThreshold}
          exercises={set.exercises}
          best={best}
          drafts={drafts}
        />
      )}
    </div>
  );
}
