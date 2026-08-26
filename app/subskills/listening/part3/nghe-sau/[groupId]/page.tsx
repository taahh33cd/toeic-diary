import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPassage, passageLabel } from "@/lib/subskills/part3/passages";
import DeepListenClient from "@/components/subskills/DeepListenClient";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

type Props = { params: Promise<{ groupId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { groupId } = await params;
  const p = getPassage(groupId);
  return { title: p ? `Nghe sâu — ${passageLabel(p)}` : "Nghe sâu" };
}

export default async function NgheSauPassagePage({ params }: Props) {
  const { groupId } = await params;
  const passage = getPassage(groupId);
  if (!passage) notFound();

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
        <Link href="/subskills/listening/part3/nghe-sau" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Nghe sâu</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{passageLabel(passage)}</span>
      </div>

      <h1 style={{ fontSize: "clamp(1.1rem, 2.6vw, 1.35rem)", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.25, margin: "0 0 1.25rem" }}>
        {passageLabel(passage)}
      </h1>

      <DeepListenClient passage={passage} />
    </div>
  );
}
