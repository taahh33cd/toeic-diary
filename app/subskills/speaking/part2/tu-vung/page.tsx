import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllVocab } from "@/lib/subskills/speaking-p2-vocab";
import VocabClient from "@/components/subskills/speaking/vocab/VocabClient";

export const metadata: Metadata = { title: "Phản xạ từ vựng — Speaking Part 2" };

export default async function VocabPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 900,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/speaking" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Speaking</Link>
        <span>›</span>
        <Link href="/subskills/speaking/part2" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Part 2</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Phản xạ từ vựng</span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
          Phản xạ từ vựng — trang phục &amp; hành động
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.6 }}>
          {getAllVocab().length} từ chọn theo tần suất xuất hiện trong chính kho ảnh Part 2 — học thẻ trước, rồi luyện bật ra từ trong 45 giây.
        </p>
      </div>

      <VocabClient userId={user?.id ?? null} />

      <div style={{ marginTop: "3rem", height: 1, background: "var(--border)" }} />
      <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
        TOEIC DICTATION DIARY
      </p>
    </div>
  );
}
