import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getGroupConfig, isLevelUnlocked } from "@/lib/subskills/connectors";
import { groupToPartKey, type LevelSlug, type BestScore } from "@/lib/subskills/connectors/types";
import { ConnectorsLevelClient } from "@/components/subskills/reading/ConnectorsLevelClient";
import { FILL_SCREEN, FS } from "@/lib/ui/scale";

type Props = { params: Promise<{ group: string; level: string }> };

const VALID_LEVELS: LevelSlug[] = ["l1", "l2", "l3", "l4", "l5", "l6"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { group, level } = await params;
  const config = getGroupConfig(group);
  const levelConfig = config?.levels.find((l) => l.slug === level);
  return {
    title: config && levelConfig
      ? `${config.name} · ${levelConfig.name} — Liên từ & Từ nối`
      : "Liên từ & Từ nối",
  };
}

export default async function ConnectorLevelPage({ params }: Props) {
  const { group, level } = await params;

  if (!VALID_LEVELS.includes(level as LevelSlug)) notFound();

  const config = getGroupConfig(group);
  if (!config) notFound();

  const levelSlug = level as LevelSlug;
  const levelConfig = config.levels.find((l) => l.slug === levelSlug);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/subskills/reading/connectors/${group}/${level}`);

  const profile = await prisma.profile
    .findUnique({ where: { id: user.id }, select: { studentCode: true } })
    .catch(() => null);
  const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

  const partKey = groupToPartKey(group);
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

  const unlocked = isLevelUnlocked(levelSlug, best, isTestUser);

  // No content yet
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

  if (!unlocked) {
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
    <ConnectorsLevelClient
      groupSlug={group}
      groupName={config.name}
      partKey={partKey}
      levelSlug={levelSlug}
      levelName={levelConfig.name}
      levelInstruction={levelConfig.instruction}
      questions={levelConfig.questions}
      passages={levelConfig.passages ?? []}
      passThreshold={levelConfig.passThreshold}
      initialBest={best[levelSlug] ?? null}
      showTranslation={levelSlug !== "l6"}
    />
  );
}

function Notice({ emoji, message, group, groupName }: {
  emoji: string;
  message: string;
  group: string;
  groupName: string;
}) {
  return (
    <div style={{ ...FILL_SCREEN, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem", gap: "1rem" }}>
      <div style={{ fontSize: FS.xl }}>{emoji}</div>
      <p style={{ fontSize: FS.sm, color: "var(--text-muted)", textAlign: "center" }}>{message}</p>
      <Link
        href={`/subskills/reading/connectors/${group}`}
        style={{ fontSize: FS.sm, color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}
      >
        ← Quay lại {groupName}
      </Link>
    </div>
  );
}
