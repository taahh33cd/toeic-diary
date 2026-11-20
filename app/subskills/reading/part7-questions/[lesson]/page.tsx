import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findItem, getLesson, REVIEW_SLUG, TYPE_CARDS } from "@/lib/subskills/part7-questions";
import { getP7QProgress } from "@/lib/subskills/part7-questions/progress";
import { Part7QuestionsClient } from "@/components/subskills/reading/Part7QuestionsClient";
import { FILL_SCREEN, FS } from "@/lib/ui/scale";

type Props = { params: Promise<{ lesson: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lesson } = await params;
  const title = lesson === REVIEW_SLUG ? "Ôn câu sai" : getLesson(lesson)?.title;
  return { title: `${title ?? "Bài luyện"} — Đọc câu hỏi Part 7` };
}

export default async function Part7QuestionsLessonPage({ params }: Props) {
  const { lesson: slug } = await params;
  const lesson = slug === REVIEW_SLUG ? null : getLesson(slug);
  if (slug !== REVIEW_SLUG && !lesson) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/subskills/reading/part7-questions/${slug}`);

  const progress = await getP7QProgress(user.id);

  if (!lesson) {
    const items = progress.wrongIds.map((id) => findItem(id)?.item).filter((i) => !!i);
    if (items.length === 0) {
      return (
        <div style={{ ...FILL_SCREEN, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "3rem 1.5rem" }}>
          <div style={{ fontSize: FS.xl }}>🎉</div>
          <p style={{ fontSize: FS.sm, color: "var(--text-muted)", textAlign: "center" }}>Không còn câu nào sai. Làm thêm bài mới nhé!</p>
          <Link href="/subskills/reading/part7-questions" style={{ fontSize: FS.sm, color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>
            ← Đọc câu hỏi Part 7
          </Link>
        </div>
      );
    }
    return (
      <Part7QuestionsClient
        lessonSlug={REVIEW_SLUG}
        title="Ôn câu sai"
        items={items.slice(0, 20)}
        card={null}
        initialBest={null}
      />
    );
  }

  return (
    <Part7QuestionsClient
      lessonSlug={lesson.slug}
      title={lesson.title}
      items={lesson.items}
      card={lesson.type ? TYPE_CARDS[lesson.type] ?? null : null}
      initialBest={progress.best[lesson.slug] ?? null}
    />
  );
}
