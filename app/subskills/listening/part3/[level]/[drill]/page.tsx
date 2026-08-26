import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PART3_LEVELS, getPart3Level } from "@/lib/subskills/part3";
import Part3DrillClient from "@/components/subskills/Part3DrillClient";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

type Props = { params: Promise<{ level: string; drill: string }> };

export function generateStaticParams() {
  return PART3_LEVELS.flatMap((l) => l.drills.map((d) => ({ level: l.level, drill: d.id })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level, drill } = await params;
  const lv = getPart3Level(level);
  const d = lv?.drills.find((x) => x.id === drill);
  return { title: d ? `${d.title} — ${lv!.title} — Listening Part 3 & 4` : "Subskills" };
}

export default async function Part3DrillPage({ params }: Props) {
  const { level, drill } = await params;
  const lv = getPart3Level(level);
  if (!lv) notFound();

  const drillIndex = lv.drills.findIndex((d) => d.id === drill);
  if (drillIndex === -1) notFound();
  const d = lv.drills[drillIndex];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem", fontSize: FS.xs, color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills/listening/part3" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Part 3 &amp; 4</Link>
        <span>›</span>
        <Link href={`/subskills/listening/part3/${lv.level}`} style={{ color: "var(--text-muted)", textDecoration: "none" }}>{lv.title}</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Bài {drillIndex + 1}</span>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "clamp(1.15rem, 2.6vw, 1.4rem)", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.25, margin: "0 0 0.4rem" }}>
          {d.title}
        </h1>
        <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.65 }}>{d.instruction}</p>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      <Part3DrillClient level={lv} drill={d} drillIndex={drillIndex} signedIn={!!user} />
    </div>
  );
}
