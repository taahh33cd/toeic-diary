import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getVerbGroup, isLevelUnlocked } from "@/lib/subskills/verbs";
import { groupToPartKey, type LevelSlug, type BestScore } from "@/lib/subskills/verbs/types";
import { VerbsLevelClient } from "@/components/subskills/verbs/VerbsLevelClient";

type Props = { params: Promise<{ group: string; level: string }> };

const VALID_LEVELS: LevelSlug[] = ["l1", "l2", "l3", "l4", "l5", "l6"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { group, level } = await params;
  const config = getVerbGroup(group);
  const levelConfig = config?.levels.find((l) => l.slug === level);
  return {
    title: config && levelConfig
      ? `${config.name} · ${levelConfig.name} — Động từ bất quy tắc`
      : "Động từ bất quy tắc",
  };
}

export default async function VerbLevelPage({ params }: Props) {
  const { group, level } = await params;

  if (!VALID_LEVELS.includes(level as LevelSlug)) notFound();

  const config = getVerbGroup(group);
  if (!config) notFound();

  const levelSlug = level as LevelSlug;
  const levelConfig = config.levels.find((l) => l.slug === levelSlug);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/subskills/verbs/${group}/${level}`);

  const profile = await prisma.profile
    .findUnique({ where: { id: user.id }, select: { studentCode: true } })
    .catch(() => null);
  const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

  const partKey = groupToPartKey(group);
  const rawAttempts = await prisma.subskillAttempt
    .findMany({ where: { userId: user.id, part: partKey }, select: { questionWord: true, score: true, passed: true } })
    .catch(() => []);

  const best: Record<string, BestScore> = {};
  for (const a of rawAttempts) {
    const cur = best[a.questionWord];
    if (!cur || a.score > cur.score) best[a.questionWord] = { score: a.score, passed: a.passed };
  }

  if (!levelConfig || levelConfig.questions.length === 0) {
    return (
      <Notice
        emoji="🔧"
        message="Nội dung cho level này đang được soạn thảo. Vui lòng quay lại sau."
        group={group}
        groupName={config.name}
      />
    );
  }

  if (!isLevelUnlocked(levelSlug, best, isTestUser)) {
    const req = levelSlug === "l3" || levelSlug === "l4" ? "L2" : "L4";
    return (
      <Notice
        emoji="🔒"
        message={`Cần pass ${req} (≥ 80%) để mở khóa level này.`}
        group={group}
        groupName={config.name}
      />
    );
  }

  return (
    <VerbsLevelClient
      groupSlug={group}
      groupName={config.name}
      partKey={partKey}
      levelSlug={levelSlug}
      levelName={levelConfig.name}
      levelInstruction={levelConfig.instruction}
      questions={levelConfig.questions}
      passThreshold={levelConfig.passThreshold}
      initialBest={best[levelSlug] ?? null}
    />
  );
}

function Notice({ emoji, message, group, groupName }: {
  emoji: string; message: string; group: string; groupName: string;
}) {
  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem", gap: "1rem" }}>
      <div style={{ fontSize: "2rem" }}>{emoji}</div>
      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", textAlign: "center" }}>{message}</p>
      <Link
        href={`/subskills/verbs/${group}`}
        style={{ fontSize: "0.82rem", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}
      >
        ← Quay lại {groupName}
      </Link>
    </div>
  );
}
