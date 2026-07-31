import type { Metadata } from "next";
import Link from "next/link";
import { countPhrases } from "@/lib/subskills/writing-part2/theory";
import WritingP2Theory from "@/components/subskills/writing/WritingP2Theory";

export const metadata: Metadata = { title: "Lý thuyết & mẫu câu — Writing Part 2" };

export default function WritingP2TheoryPage() {
  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 860,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/writing" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Writing</Link>
        <span>›</span>
        <Link href="/subskills/writing/part2" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Part 2</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Lý thuyết</span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          Writing · Part 2 · Lý thuyết
        </p>
        <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
          Kho mẫu câu e-mail
        </h1>
        <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
          {countPhrases()} mẫu câu chia theo 7 nhóm chức năng — từ xưng hô đầu thư đến lời chào cuối.
          Đọc xong chuyển sang tab <strong style={{ color: "var(--text-primary)" }}>Làm quiz</strong> để kiểm tra xem đã thuộc chưa.
        </p>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      <WritingP2Theory />

      <div style={{ marginTop: "3rem", height: 1, background: "var(--border)" }} />
      <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
    </div>
  );
}
