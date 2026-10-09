import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BRANCHES,
  CHUNKING_LEVELS,
  getLevel,
  getListenPassage,
  speakPassagesOf,
  speakSamplesOf,
  type Branch,
  type ListenPassage,
} from "@/lib/subskills/chunking";
import {
  buildCatchChunk,
  buildDictation,
  buildMarkBoundary,
  buildMatchMeaning,
  buildOrderChunks,
} from "@/lib/subskills/chunking/drills";
import CatchChunkClient from "@/components/subskills/chunking/CatchChunkClient";
import DictationClient from "@/components/subskills/chunking/DictationClient";
import MarkBoundaryClient from "@/components/subskills/chunking/MarkBoundaryClient";
import MatchMeaningClient from "@/components/subskills/chunking/MatchMeaningClient";
import OrderChunksClient from "@/components/subskills/chunking/OrderChunksClient";
import ReadAloudClient, {
  type ReadAloudSource,
} from "@/components/subskills/chunking/ReadAloudClient";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

type Props = { params: Promise<{ branch: string; level: string }> };

export function generateStaticParams() {
  return CHUNKING_LEVELS.map((l) => ({ branch: l.branch, level: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { branch, level } = await params;
  const lv = getLevel(branch as Branch, level);
  return { title: lv ? `${lv.name} — Chunking — Subskills` : "Chunking — Subskills" };
}

export default async function ChunkingLevelPage({ params }: Props) {
  const { branch, level } = await params;
  if (branch !== "noi" && branch !== "nghe") notFound();
  const lv = getLevel(branch, level);
  if (!lv) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = !!user;

  const listenPassages = lv.sources
    .map(getListenPassage)
    .filter((p): p is ListenPassage => !!p);

  let runner: React.ReactNode = null;
  if (lv.kind === "mark-boundary") {
    runner = (
      <MarkBoundaryClient
        items={buildMarkBoundary(speakPassagesOf(lv))}
        passThreshold={lv.passThreshold}
        signedIn={signedIn}
      />
    );
  } else if (lv.kind === "match-meaning") {
    runner = (
      <MatchMeaningClient
        items={buildMatchMeaning(speakPassagesOf(lv))}
        passThreshold={lv.passThreshold}
        signedIn={signedIn}
      />
    );
  } else if (lv.kind === "read-aloud") {
    const sources: ReadAloudSource[] = [
      ...speakPassagesOf(lv).map((p) => ({
        kind: "passage" as const,
        id: p.id,
        label: p.genreVi,
        chunks: p.sentences.flatMap((s) => s.chunks),
      })),
      ...speakSamplesOf(lv).map((s) => ({
        kind: "sample" as const,
        id: s.id,
        label: `${s.task === "q11" ? "Q11" : "Q5-7"} · ${s.topicVi}`,
        question: s.question,
        questionVi: s.questionVi,
        chunks: s.chunks,
      })),
    ];
    runner = <ReadAloudClient sources={sources} signedIn={signedIn} />;
  } else if (lv.kind === "catch-chunk") {
    runner = (
      <CatchChunkClient
        items={buildCatchChunk(listenPassages)}
        passThreshold={lv.passThreshold}
        signedIn={signedIn}
      />
    );
  } else if (lv.kind === "order-chunks") {
    runner = (
      <OrderChunksClient
        items={buildOrderChunks(listenPassages)}
        passThreshold={lv.passThreshold}
        signedIn={signedIn}
      />
    );
  } else {
    runner = (
      <DictationClient
        items={buildDictation(listenPassages)}
        passThreshold={lv.passThreshold}
        signedIn={signedIn}
      />
    );
  }

  return (
    <div
      className="page-enter"
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: "1.25rem",
          fontSize: FS.xs,
          color: "var(--text-muted)",
          flexWrap: "wrap",
        }}
      >
        <Link href="/subskills/chunking" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          Chunking
        </Link>
        <span>›</span>
        <span>{BRANCHES[branch].label}</span>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{lv.name}</span>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <h1
          style={{
            fontSize: "clamp(1.15rem, 2.6vw, 1.4rem)",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.25,
            margin: "0 0 0.4rem",
          }}
        >
          {BRANCHES[branch].emoji} {lv.name}
        </h1>
        <p style={{ margin: "0 0 0.5rem", fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.65 }}>
          {lv.instruction}
        </p>
        <p style={{ margin: 0, fontSize: FS.xs, color: "var(--text-muted)" }}>Đích: {lv.goal}</p>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      {runner}
    </div>
  );
}
