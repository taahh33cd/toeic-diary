import type { Metadata } from "next";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LESSONS, REVIEW_SLUG, TYPE_ORDER } from "@/lib/subskills/part7-questions";
import { getP7QProgress, type P7QProgress } from "@/lib/subskills/part7-questions/progress";
import {
  KW_LAYERS,
  P7Q_TYPES,
  STEP_LABEL,
  type KwLayer,
  type P7QLesson,
} from "@/lib/subskills/part7-questions/types";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

export const metadata: Metadata = { title: "Đọc câu hỏi Part 7 — Reading Subskills" };

const card = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "1rem 1.1rem",
} as const;

const sectionTitle = {
  fontSize: FS.xs,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  margin: "0 0 0.6rem",
} as const;

export default async function Part7QuestionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const progress = user ? await getP7QProgress(user.id) : null;

  const typedLessons = TYPE_ORDER.map((type) => ({
    type,
    lessons: LESSONS.filter((l) => l.type === type),
  }));
  const mixed = LESSONS.filter((l) => l.type === null);

  return (
    <div style={{ ...FILL_SCREEN, background: "var(--bg-primary)", padding: `${PAD_Y} ${PAD_X}`, maxWidth: CONTAINER_MAX, margin: "0 auto", boxSizing: "border-box" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1.5rem", fontSize: FS.xs, color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>/</span>
        <Link href="/subskills/reading" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Reading</Link>
        <span>/</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Đọc câu hỏi Part 7</span>
      </div>

      <h1 style={{ fontSize: FS.lg, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.35rem" }}>
        Đọc câu hỏi Part 7
      </h1>
      <p style={{ fontSize: FS.sm, color: "var(--text-muted)", lineHeight: 1.65, margin: "0 0 1.5rem", maxWidth: 760 }}>
        Hiểu sai câu hỏi thì đọc bài kỹ đến mấy cũng chọn sai. Mỗi câu luyện 4 bước: <strong>dịch đúng</strong> →{" "}
        <strong>đánh dấu từ khoá</strong> → <strong>nhận diện dạng</strong> → <strong>chọn chiến lược</strong>, rồi xem chỗ căn cứ trong bài.
        Câu hỏi lấy từ đề EST 2024 và EST 2026.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <Legend />
        {progress && progress.doneCount > 0 && <Report progress={progress} />}
      </div>

      <h2 style={sectionTitle}>Học theo dạng</h2>
      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "2rem" }}>
        {typedLessons.map(({ type, lessons }) => (
          <div key={type} style={{ ...card, display: "grid", gap: "0.6rem", opacity: lessons.length ? 1 : 0.6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", alignItems: "baseline" }}>
              <div style={{ fontWeight: 700, fontSize: FS.md, color: "var(--text-primary)" }}>{P7Q_TYPES[type].name}</div>
              <div style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>{P7Q_TYPES[type].signal}</div>
            </div>
            {lessons.length ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.6rem" }}>
                {lessons.map((l) => <LessonLink key={l.slug} lesson={l} best={progress?.best[l.slug]} />)}
              </div>
            ) : (
              <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>Đang soạn nội dung</span>
            )}
          </div>
        ))}
      </div>

      <h2 style={sectionTitle}>Bài tổng hợp (trộn dạng)</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.6rem" }}>
        {mixed.map((l) => <LessonLink key={l.slug} lesson={l} best={progress?.best[l.slug]} />)}
      </div>
    </div>
  );
}

function LessonLink({ lesson, best }: { lesson: P7QLesson; best?: { score: number; passed: boolean } }) {
  return (
    <Link
      href={`/subskills/reading/part7-questions/${lesson.slug}`}
      style={{
        display: "grid",
        gap: "0.3rem",
        padding: "0.8rem 0.9rem",
        borderRadius: 10,
        border: `1.5px solid ${best?.passed ? "var(--accent-green)" : "var(--border)"}`,
        background: "var(--bg-secondary)",
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
        <span style={{ fontWeight: 700, fontSize: FS.sm, color: "var(--text-primary)" }}>{lesson.title}</span>
        <span style={{ fontSize: FS.xs, fontWeight: 700, color: best ? (best.passed ? "var(--accent-green)" : "var(--accent-yellow)") : "var(--text-muted)" }}>
          {best ? `${best.score}%` : `${lesson.items.length} câu`}
        </span>
      </div>
      <span style={{ fontSize: FS.xs, color: "var(--text-muted)", lineHeight: 1.5 }}>{lesson.description}</span>
    </Link>
  );
}

function Legend() {
  const examples: Record<KwLayer, string> = {
    q: "What · Why · When · What color",
    t: "purpose · NOT · indicated · most likely · tên văn bản (e-mail, article…)",
    c: "tên người / công ty · số · ngày · danh từ / động từ chính",
  };
  return (
    <div style={{ ...card, display: "grid", gap: "0.55rem" }}>
      <div style={sectionTitle}>Từ khoá 3 lớp</div>
      {(Object.keys(KW_LAYERS) as KwLayer[]).map((k) => (
        <div key={k} style={{ display: "flex", gap: "0.6rem", alignItems: "baseline" }}>
          <span style={{ flexShrink: 0, fontSize: FS.xs, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: KW_LAYERS[k].bg, borderBottom: `2px solid ${KW_LAYERS[k].color}`, color: "var(--text-primary)" }}>
            {KW_LAYERS[k].label}
          </span>
          <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>{examples[k]}</span>
        </div>
      ))}
      <p style={{ fontSize: FS.xs, color: "var(--text-secondary)", margin: "0.2rem 0 0", lineHeight: 1.6 }}>
        Lớp <strong>Dạng</strong> cho biết làm kiểu gì, lớp <strong>Nội dung</strong> cho biết dò chỗ nào. Câu chỉ có Dạng mà không có Nội dung → đọc ý chính hoặc loại trừ.
      </p>
    </div>
  );
}

function Report({ progress }: { progress: P7QProgress }) {
  const steps = progress.steps.filter((s) => s.total > 0);
  const weakest = [...steps].sort((a, b) => a.correct / a.total - b.correct / b.total)[0];
  return (
    <div style={{ ...card, display: "grid", gap: "0.6rem" }}>
      <div style={sectionTitle}>Kết quả của bạn · {progress.doneCount} câu đã làm</div>
      {steps.map((s) => {
        const pct = Math.round((s.correct / s.total) * 100);
        return (
          <div key={s.key} style={{ display: "grid", gridTemplateColumns: "8.5rem 1fr 3rem", gap: "0.5rem", alignItems: "center", fontSize: FS.xs }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: s === weakest ? 700 : 400 }}>{STEP_LABEL[s.key]}</span>
            <div style={{ height: 6, borderRadius: 99, background: "var(--bg-secondary)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? "var(--accent-green)" : pct >= 60 ? "var(--accent-yellow)" : "var(--accent-red)" }} />
            </div>
            <span style={{ textAlign: "right", color: "var(--text-muted)" }}>{pct}%</span>
          </div>
        );
      })}
      {progress.types.length > 1 && (
        <div style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>
          Theo dạng: {progress.types.map((t) => `${P7Q_TYPES[t.type].name} ${t.avg}%`).join(" · ")}
        </div>
      )}
      {weakest && weakest.correct < weakest.total && (
        <div style={{ fontSize: FS.xs, color: "var(--text-secondary)" }}>
          Bước yếu nhất: <strong>{STEP_LABEL[weakest.key]}</strong>
        </div>
      )}
      {progress.wrongIds.length > 0 && (
        <Link
          href={`/subskills/reading/part7-questions/${REVIEW_SLUG}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", justifySelf: "start", fontSize: FS.sm, fontWeight: 600, color: "var(--accent-primary)", textDecoration: "none" }}
        >
          <RotateCcw size={14} /> Làm lại {progress.wrongIds.length} câu còn sai
        </Link>
      )}
    </div>
  );
}
