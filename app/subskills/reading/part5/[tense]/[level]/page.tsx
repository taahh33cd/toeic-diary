import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getTenseConfig, isLevelUnlocked } from "@/lib/subskills/reading";
import { tenseToPartKey, type LevelSlug, type BestScore } from "@/lib/subskills/reading/types";
import { Part5LevelClient } from "@/components/subskills/reading/Part5LevelClient";
import Link from "next/link";
import { FILL_SCREEN, FS } from "@/lib/ui/scale";

type Props = { params: Promise<{ tense: string; level: string }> };

const VALID_LEVELS: LevelSlug[] = ["l1", "l2", "l3", "l4", "l5", "l6"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tense, level } = await params;
  const config = getTenseConfig(tense);
  const levelConfig = config?.levels.find((l) => l.slug === level);
  return {
    title: config && levelConfig
      ? `${config.name} · ${levelConfig.name} — Part 5 Subskills`
      : "Part 5 Subskills",
  };
}

export default async function LevelQuizPage({ params }: Props) {
  const { tense, level } = await params;

  if (!VALID_LEVELS.includes(level as LevelSlug)) notFound();

  const config = getTenseConfig(tense);
  if (!config) notFound();

  const levelSlug = level as LevelSlug;
  const levelConfig = config.levels.find((l) => l.slug === levelSlug);

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/subskills/reading/part5/${tense}/${level}`);

  // Check TEST account
  const profile = await prisma.profile
    .findUnique({ where: { id: user.id }, select: { studentCode: true } })
    .catch(() => null);
  const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

  // Fetch this tense's attempts
  const partKey = tenseToPartKey(tense);
  const rawAttempts = await prisma.subskillAttempt
    .findMany({
      where: { userId: user.id, part: partKey },
      select: { questionWord: true, score: true, passed: true },
    })
    .catch(() => []);

  const best: Record<string, BestScore> = {};
  for (const a of rawAttempts) {
    const cur = best[a.questionWord];
    if (!cur || a.score > cur.score) {
      best[a.questionWord] = { score: a.score, passed: a.passed };
    }
  }

  // Unlock check
  const unlocked = isLevelUnlocked(levelSlug, best, isTestUser);

  // No content yet
  if (!levelConfig || levelConfig.questions.length === 0) {
    return (
      <div style={{ ...FILL_SCREEN, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem", gap: "1rem" }}>
        <div style={{ fontSize: FS.xl }}>🔧</div>
        <p style={{ fontSize: FS.sm, color: "var(--text-muted)", textAlign: "center" }}>
          Nội dung cho level này đang được soạn thảo. Vui lòng quay lại sau.
        </p>
        <Link href={`/subskills/reading/part5/${tense}`} style={{ fontSize: FS.sm, color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}>
          ← Quay lại {config.name}
        </Link>
      </div>
    );
  }

  // Locked
  if (!unlocked) {
    const req = levelSlug === "l3" || levelSlug === "l4" ? "L2" : "L4";
    return (
      <div style={{ ...FILL_SCREEN, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem", gap: "1rem" }}>
        <div style={{ fontSize: FS.xl }}>🔒</div>
        <p style={{ fontSize: FS.sm, color: "var(--text-muted)", textAlign: "center" }}>
          Cần pass {req} (≥ 80%) để mở khóa level này.
        </p>
        <Link href={`/subskills/reading/part5/${tense}`} style={{ fontSize: FS.sm, color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}>
          ← Quay lại {config.name}
        </Link>
      </div>
    );
  }

  return (
    <Part5LevelClient
      tenseSlug={tense}
      tenseName={config.name}
      partKey={partKey}
      levelSlug={levelSlug}
      levelName={levelConfig.name}
      levelInstruction={levelConfig.instruction}
      questions={levelConfig.questions}
      passThreshold={levelConfig.passThreshold}
      initialBest={best[levelSlug] ?? null}
      showTranslation={levelSlug !== "l6"}
      showGrammarHint={levelSlug === "l1" || levelSlug === "l2"}
    />
  );
}
