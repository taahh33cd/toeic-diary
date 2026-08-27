import type { Metadata } from "next";
import Link from "next/link";
import { SAMPLE_PAIRS } from "@/lib/subskills/writing-part3/samples";
import WritingP3SamplesClient from "@/components/subskills/writing/WritingP3SamplesClient";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

export const metadata: Metadata = { title: "Thư viện bài mẫu — Writing Part 3" };

export default function WritingP3SamplesPage() {
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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: FS.sm, color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/writing" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Writing</Link>
        <span>›</span>
        <Link href="/subskills/writing/part3" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Part 3</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Thư viện bài mẫu</span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: FS.xs, color: "var(--accent-primary)", letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.35rem" }}>
          {SAMPLE_PAIRS.length} cặp · mỗi dạng đề một cặp
        </p>
        <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
          Thư viện bài mẫu
        </h1>
        <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-muted)", fontStyle: "italic" }}>
          Mức 3 và mức 5 đặt cạnh nhau, cùng một đề — để thấy khoảng cách nằm ở đâu.
        </p>
      </div>

      <WritingP3SamplesClient />

      <div style={{ marginTop: "auto", height: 1, background: "var(--border)" }} />
      <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
    </div>
  );
}
