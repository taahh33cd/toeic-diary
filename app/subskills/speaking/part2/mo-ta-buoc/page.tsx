import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  STEPS_SKILL,
  getStepTests,
  dbPartSteps,
} from "@/lib/subskills/speaking-p2-steps";
import SpeakingP2StepsClient from "@/components/subskills/speaking/SpeakingP2StepsClient";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

export const metadata: Metadata = { title: "Mô tả tranh theo 3 bước — Speaking Part 2" };

type BestMap = Record<string, { score: number; passed: boolean }>;

function buildBest(list: { questionWord: string; score: number; passed: boolean }[]): BestMap {
  const best: BestMap = {};
  for (const a of list) {
    if (!best[a.questionWord] || a.score > best[a.questionWord].score) {
      best[a.questionWord] = { score: a.score, passed: a.passed };
    }
  }
  return best;
}

export default async function SpeakingP2StepsPage() {
  const tests = getStepTests();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? await prisma.profile.findUnique({ where: { id: user.id }, select: { studentCode: true } }).catch(() => null)
    : null;
  const isTestUser = profile?.studentCode?.toUpperCase() === "TEST";

  const [easyRaw, mediumRaw, hardRaw] = user
    ? await Promise.all(
        (["easy", "medium", "hard"] as const).map((d) =>
          prisma.subskillAttempt
            .findMany({
              where: { userId: user.id, part: dbPartSteps(d) },
              select: { questionWord: true, score: true, passed: true },
            })
            .catch(() => []),
        ),
      )
    : [[], [], []];

  return (
    <div
      style={{
        ...FILL_SCREEN,
        background: "var(--bg-primary)",
        padding: `${PAD_Y} ${PAD_X}`,
        maxWidth: CONTAINER_MAX,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: FS.sm, color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/speaking" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Speaking</Link>
        <span>›</span>
        <Link href="/subskills/speaking/part2" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Part 2</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{STEPS_SKILL.labelVi}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
          {STEPS_SKILL.labelVi}
        </h1>
        <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-muted)", fontStyle: "italic" }}>
          {STEPS_SKILL.label} · {STEPS_SKILL.description}
        </p>
      </div>

      <SpeakingP2StepsClient
        allTests={tests}
        easyBest={buildBest(easyRaw)}
        mediumBest={buildBest(mediumRaw)}
        hardBest={buildBest(hardRaw)}
        isTestUser={isTestUser}
        userId={user?.id ?? null}
      />

      <div style={{ marginTop: "auto", height: 1, background: "var(--border)" }} />
      <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
        TOEIC DICTATION DIARY
      </p>
    </div>
  );
}
