import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { TOPIC_METAS } from "@/lib/subskills/translation";
import { TOPIC_VOCAB } from "@/lib/subskills/translation/vocab";
import { vocabKey, type VocabEntry, type VocabProgressMap } from "@/lib/subskills/translation/types";
import { VocabScreen } from "@/components/subskills/translation/VocabScreen";
import { CONTAINER, PAD_X } from "@/components/grammar/scale";
import { CONTAINER_MAX, FILL_SCREEN, FS } from "@/lib/ui/scale";

export const metadata: Metadata = { title: "Ôn từ chưa thuộc — Dịch Anh–Việt" };

/** Toàn bộ mục từ của khu dịch, tra ngược theo khoá đã lowercase */
function buildIndex(): Map<string, VocabEntry> {
  const map = new Map<string, VocabEntry>();
  for (const levels of Object.values(TOPIC_VOCAB)) {
    for (const entries of Object.values(levels)) {
      for (const e of entries ?? []) {
        const k = vocabKey(e.en);
        if (!map.has(k)) map.set(k, e);
      }
    }
  }
  return map;
}

export default async function TranslationVocabReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/subskills/translation/on-tap");

  const rows = await prisma.translationVocabProgress
    .findMany({
      where: { userId: user.id, OR: [{ known: false }, { wrongCount: { gt: 0 } }] },
      select: { word: true, known: true, wrongCount: true, seenCount: true },
      orderBy: [{ wrongCount: "desc" }, { updatedAt: "asc" }],
      take: 60,
    })
    .catch(() => []);

  const index = buildIndex();
  const entries: VocabEntry[] = [];
  const progress: VocabProgressMap = {};

  for (const r of rows) {
    const entry = index.get(r.word);
    if (!entry) continue; // từ đã bị gỡ khỏi data
    entries.push(entry);
    progress[r.word] = { known: r.known, wrongCount: r.wrongCount, seenCount: r.seenCount };
  }

  const totalVocab = index.size;

  if (entries.length === 0) {
    return (
      <div
        style={{
          ...CONTAINER,
          ...FILL_SCREEN,
          background: "var(--bg-primary)",
          padding: `clamp(1.5rem, 4vw, 2.5rem) ${PAD_X}`,
          boxSizing: "border-box",
        }}
      >
        <Link
          href="/subskills/translation"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: FS.sm,
            color: "var(--text-muted)",
            textDecoration: "none",
            marginBottom: "1.25rem",
          }}
        >
          <ArrowLeft size={14} /> Dịch Anh–Việt
        </Link>

        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "2rem 1.5rem",
            textAlign: "center",
          }}
        >
          <Sparkles size={26} style={{ color: "var(--accent-primary)" }} />
          <h1 style={{ fontSize: FS.lg, fontWeight: 700, color: "var(--text-primary)", margin: "0.6rem 0 0.4rem" }}>
            Chưa có từ nào cần ôn
          </h1>
          <p style={{ fontSize: FS.sm, color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>
            Khu dịch có {totalVocab} mục từ. Vào một level bất kỳ, học ở màn từ vựng rồi đánh dấu
            từ chưa thuộc — chúng sẽ dồn về đây.
          </p>
        </div>
      </div>
    );
  }

  const wrongOnes = entries.filter((e) => (progress[vocabKey(e.en)]?.wrongCount ?? 0) > 0).length;

  return (
    <>
      <div style={{ ...CONTAINER, padding: `1.25rem ${PAD_X} 0` }}>
        <div style={{ maxWidth: CONTAINER_MAX, margin: "0 auto" }}>
        <Link
          href="/subskills/translation"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: FS.sm,
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} /> Dịch Anh–Việt
        </Link>
        </div>
      </div>

      <VocabScreen
        entries={entries}
        topicSlug="on-tap"
        topicName="Dịch Anh–Việt"
        levelSlug="l1"
        levelName="Ôn tập"
        initialProgress={progress}
        heading="Ôn từ chưa thuộc"
        subheading={`${entries.length} mục từ đang cần ôn${
          wrongOnes > 0 ? `, trong đó ${wrongOnes} từ bạn từng trả lời sai` : ""
        }. Đánh dấu “đã thuộc” thì từ sẽ rời khỏi danh sách này.`}
      />
    </>
  );
}
