import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BRANCHES,
  SPRINT_LEVELS,
  TOPICS,
  attemptPart,
  buildComboItems,
  buildComposeItems,
  buildFrameItems,
  buildOrderItems,
  buildPickItems,
  getLevel,
  getTopic,
} from "@/lib/subskills/sentence-sprint";
import type { Branch } from "@/lib/subskills/sentence-sprint/types";
import FrameClient from "@/components/subskills/sentence-sprint/FrameClient";
import OrderClient from "@/components/subskills/sentence-sprint/OrderClient";
import PickClient from "@/components/subskills/sentence-sprint/PickClient";
import SpeakComposeClient, {
  type SpeakTask,
} from "@/components/subskills/sentence-sprint/SpeakComposeClient";
import WriteComposeClient from "@/components/subskills/sentence-sprint/WriteComposeClient";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

type Props = { params: Promise<{ topic: string; branch: string; level: string }> };

/** ComposeItem mang thêm collocations mà nhánh Nói không dùng — bỏ ở đây. */
function toTask(c: {
  id: string;
  words: string[];
  vi: string[];
  situation: string;
  model: string;
  minSentences: number;
}): SpeakTask {
  return {
    id: c.id,
    words: c.words,
    vi: c.vi,
    situation: c.situation,
    model: c.model,
    minSentences: c.minSentences,
  };
}

export function generateStaticParams() {
  return TOPICS.flatMap((t) =>
    SPRINT_LEVELS.map((l) => ({ topic: t.slug, branch: l.branch, level: l.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic, branch, level } = await params;
  const t = getTopic(topic);
  const lv = branch === "viet" || branch === "noi" ? getLevel(branch, level) : undefined;
  return { title: t && lv ? `${lv.name} · ${t.name} — Đặt câu nhanh` : "Đặt câu nhanh" };
}

export default async function SentenceSprintLevelPage({ params }: Props) {
  const { topic, branch, level } = await params;
  if (branch !== "viet" && branch !== "noi") notFound();

  const t = getTopic(topic);
  const lv = getLevel(branch as Branch, level);
  if (!t || !lv) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = !!user;

  const partKey = attemptPart(t.slug, lv.branch);
  const backHref = `/subskills/sentence-sprint/${t.slug}`;
  const common = {
    seconds: lv.seconds,
    passThreshold: lv.passThreshold,
    partKey,
    levelSlug: lv.slug,
    backHref,
    signedIn,
  };

  let runner: React.ReactNode;
  if (lv.kind === "frame") {
    runner = <FrameClient items={buildFrameItems(t, lv)} {...common} />;
  } else if (lv.kind === "pick") {
    runner = <PickClient items={buildPickItems(t, lv)} {...common} />;
  } else if (lv.kind === "order") {
    runner = <OrderClient items={buildOrderItems(t, lv)} {...common} />;
  } else if (lv.kind === "write-one") {
    runner = <WriteComposeClient items={buildComposeItems(t, lv, true)} {...common} />;
  } else if (lv.kind === "write-combo") {
    runner = <WriteComposeClient items={buildComboItems(t, lv, 1, "few")} {...common} />;
  } else {
    // Bốn cấp nhánh Nói dùng cùng một trình chạy, chỉ khác nguồn đề và tham số.
    let tasks: SpeakTask[];
    let mode: "frame" | "free" = "free";
    if (lv.kind === "speak-frame") {
      mode = "frame";
      tasks = buildFrameItems(t, lv).map((f) => ({
        id: f.id,
        words: [f.word],
        vi: [f.vi],
        frame: f.frame,
        situation: "",
        model: f.model,
        minSentences: 1,
      }));
    } else if (lv.kind === "speak-chain") {
      tasks = buildComboItems(t, lv, 2, "many").map(toTask);
    } else if (lv.kind === "speak-two") {
      tasks = buildComboItems(t, lv, 1, "few").map(toTask);
    } else {
      // speak-word: chỉ hiện từ trơ. speak-situation: thêm tình huống.
      tasks = buildComposeItems(t, lv, lv.kind === "speak-situation").map(toTask);
    }
    runner = (
      <SpeakComposeClient
        tasks={tasks}
        mode={mode}
        thinkSeconds={lv.thinkSeconds ?? 5}
        {...common}
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
        <Link href="/subskills/sentence-sprint" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          Đặt câu nhanh
        </Link>
        <span>›</span>
        <Link href={backHref} style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          {t.name}
        </Link>
        <span>›</span>
        <span>{BRANCHES[lv.branch].label}</span>
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
          {BRANCHES[lv.branch].emoji} {lv.name}
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
