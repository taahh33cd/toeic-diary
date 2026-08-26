import type { Metadata } from "next";
import Link from "next/link";
import { listPassages, passageLabel, DEEP_STEPS } from "@/lib/subskills/part3/passages";
import DeepListenList, { type DeepListRow } from "@/components/subskills/DeepListenList";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

export const metadata: Metadata = { title: "Nghe sâu — Listening Part 3 & 4" };

type Props = { searchParams: Promise<{ part?: string; test?: string }> };

export default async function NgheSauPage({ searchParams }: Props) {
  const { part, test } = await searchParams;
  const partFilter = part === "3" ? 3 : part === "4" ? 4 : undefined;
  const testFilter = test ? Number(test) : undefined;

  const passages = listPassages(partFilter).filter((p) =>
    testFilter ? p.testNumber === testFilter : true
  );

  const rows: DeepListRow[] = passages.map((p) => ({
    groupId: p.groupId,
    label: passageLabel(p),
    part: p.part,
    lineCount: p.lines.length,
    keywordCount: p.keywords.length,
    firstPrompt: p.questions[0]?.prompt ?? "",
  }));

  const tests = [...new Set(listPassages().map((p) => p.testNumber))].sort((a, b) => a - b);

  function chip(label: string, href: string, active: boolean) {
    return (
      <Link
        key={href}
        href={href}
        style={{
          padding: "0.35rem 0.75rem",
          borderRadius: 999,
          fontSize: FS.xs,
          fontWeight: active ? 700 : 500,
          textDecoration: "none",
          border: `1px solid ${active ? "var(--accent-primary)" : "var(--border)"}`,
          background: active ? "var(--accent-primary)" : "var(--bg-elevated)",
          color: active ? "#fff" : "var(--text-muted)",
        }}
      >
        {label}
      </Link>
    );
  }

  const base = "/subskills/listening/part3/nghe-sau";
  const qs = (next: Record<string, string | undefined>) => {
    const merged = { part, test, ...next };
    const s = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return s ? `${base}?${s}` : base;
  };

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
        <Link href="/subskills/listening" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Listening</Link>
        <span>›</span>
        <Link href="/subskills/listening/part3" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Part 3 &amp; 4</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Nghe sâu</span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.25rem, 3vw, 1.6rem)", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, margin: "0 0 0.5rem" }}>
          Nghe sâu — quy trình 5 bước
        </h1>
        <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.7 }}>
          Bài trắc nghiệm rèn phản xạ, còn khu này rèn nền. Mỗi đoạn đi hết một vòng: làm đề
          khi chưa biết gì, tra từ, nghe kèm chữ và đọc theo nhiều lượt, rồi nghe chay đến khi
          hiểu trọn. Tiến độ lưu ngay trên máy, thoát giữa chừng không mất.
        </p>
      </div>

      <ol
        style={{
          margin: "0 0 1.75rem",
          padding: "0.85rem 1rem 0.85rem 2.2rem",
          borderRadius: "var(--radius-lg, 12px)",
          border: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          fontSize: FS.sm,
          color: "var(--text-secondary)",
          lineHeight: 1.8,
        }}
      >
        {DEEP_STEPS.map((s) => (
          <li key={s.id}>
            <strong style={{ color: "var(--text-primary)" }}>{s.title}</strong> — {s.hint}
          </li>
        ))}
      </ol>

      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
        {chip("Cả hai part", qs({ part: undefined }), !partFilter)}
        {chip("Part 3", qs({ part: "3" }), partFilter === 3)}
        {chip("Part 4", qs({ part: "4" }), partFilter === 4)}
      </div>

      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {chip("Mọi đề", qs({ test: undefined }), !testFilter)}
        {tests.map((t) => chip(`Đề ${t}`, qs({ test: String(t) }), testFilter === t))}
      </div>

      <DeepListenList rows={rows} />

      <div style={{ width: "100%", marginTop: "auto", paddingTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          TOEIC DICTATION DIARY
        </p>
      </div>
    </div>
  );
}
