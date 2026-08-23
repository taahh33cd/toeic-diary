import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getTopicConfig, isLevelUnlocked } from "@/lib/subskills/translation";
import {
  topicToPartKey,
  vocabKey,
  type TransLevelSlug,
  type BestScore,
  type VocabProgressMap,
} from "@/lib/subskills/translation/types";
import { TranslationLevelClient } from "@/components/subskills/translation/TranslationLevelClient";

type Props = { params: Promise<{ topic: string; level: string }> };

const VALID_LEVELS: TransLevelSlug[] = ["l1", "l2", "l3", "l4", "l5", "l6"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic, level } = await params;
  const config = getTopicConfig(topic);
  const lv = config?.levels.find((l) => l.slug === level);
  return {
    title: config && lv ? `${config.name} · ${lv.name} — Dịch Anh–Việt` : "Dịch Anh–Việt",
  };
}

export default async function TranslationLevelPage({ params }: Props) {
  const { topic, level } = await params;
  if (!VALID_LEVELS.includes(level as TransLevelSlug)) notFound();

  const config = getTopicConfig(topic);
  if (!config) notFound();

  const levelSlug = level as TransLevelSlug;
  const levelConfig = config.levels.find((l) => l.slug === levelSlug);
  if (!levelConfig) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/subskills/translation/${topic}/${level}`);

  const profile = await prisma.profile
    .findUnique({ where: { id: user.id }, select: { studentCode: true } })
    .catch(() => null);
  const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

  const partKey = topicToPartKey(topic);
  const attempts = await prisma.subskillAttempt
    .findMany({
      where: { userId: user.id, part: partKey },
      select: { questionWord: true, score: true, passed: true },
    })
    .catch(() => []);

  const best: Record<string, BestScore> = {};
  for (const a of attempts) {
    const cur = best[a.questionWord];
    if (!cur || a.score > cur.score) best[a.questionWord] = { score: a.score, passed: a.passed };
  }

  if (!isLevelUnlocked(levelSlug, best, isTestUser)) {
    redirect(`/subskills/translation/${topic}`);
  }

  // Tiến độ từ vựng — chỉ lấy đúng các từ của level này
  const words = levelConfig.vocab.map((v) => vocabKey(v.en));
  const vocabRows = words.length
    ? await prisma.translationVocabProgress
        .findMany({
          where: { userId: user.id, word: { in: words } },
          select: { word: true, known: true, wrongCount: true, seenCount: true },
        })
        .catch(() => [])
    : [];

  const vocabProgress: VocabProgressMap = {};
  for (const r of vocabRows) {
    vocabProgress[r.word] = { known: r.known, wrongCount: r.wrongCount, seenCount: r.seenCount };
  }

  return (
    <TranslationLevelClient
      topicSlug={topic}
      topicName={config.name}
      partKey={partKey}
      levelSlug={levelSlug}
      levelName={levelConfig.name}
      levelInstruction={levelConfig.instruction}
      questions={levelConfig.questions}
      passThreshold={levelConfig.passThreshold}
      initialBest={best[levelSlug] ?? null}
      vocab={levelConfig.vocab}
      vocabProgress={vocabProgress}
    />
  );
}
