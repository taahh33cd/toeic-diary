import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { parseStressOverride } from "@/lib/shadow/prosody";
import { ShadowAdmin, type AdminLesson } from "./_client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shadow · từ nhấn & câu ⭐" };

type Props = { searchParams: Promise<{ test?: string; part?: string }> };

/**
 * Sửa tay đường ngữ điệu (từ đỉnh nhấn) và câu ⭐ của khu Shadow, theo đề × Part.
 * Quyền: layout admin đã chặn; API ghi kiểm lại bằng requireGrader.
 */
export default async function AdminShadowPage({ searchParams }: Props) {
  const sp = await searchParams;
  const testSets = await prisma.testSet.findMany({
    orderBy: [{ series: { orderIndex: "asc" } }, { orderIndex: "asc" }],
    select: { name: true, slug: true },
  });
  const test = testSets.find((t) => t.slug === sp.test)?.slug ?? testSets[0]?.slug ?? "";
  const part = [1, 2, 3, 4].includes(Number(sp.part)) ? Number(sp.part) : 1;

  const [lessons, overridden] = await Promise.all([
    test
      ? prisma.lesson.findMany({
          where: { part: { partNumber: part, testSet: { slug: test } } },
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            title: true,
            correctOption: true,
            sentences: {
              orderBy: { orderIndex: "asc" },
              select: { id: true, content: true, optionLabel: true, speaker: true, stressOverride: true, isStarred: true },
            },
          },
        })
      : [],
    prisma.sentence.count({
      where: { OR: [{ isStarred: { not: null } }, { stressOverride: { not: Prisma.DbNull } }] },
    }).catch(() => 0),
  ]);

  const data: AdminLesson[] = lessons.map((l) => ({
    id: l.id,
    title: l.title,
    correctOption: l.correctOption,
    sentences: l.sentences.map((s) => ({
      id: s.id,
      content: s.content,
      optionLabel: s.optionLabel,
      speaker: s.speaker,
      stressOverride: parseStressOverride(s.stressOverride),
      isStarred: s.isStarred,
    })),
  }));

  return (
    <ShadowAdmin
      key={`${test}-${part}`}
      testSets={testSets}
      test={test}
      part={part}
      lessons={data}
      overriddenTotal={overridden}
    />
  );
}
