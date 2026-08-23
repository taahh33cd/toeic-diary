import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { vocabKey, type VocabProgressMap } from "@/lib/subskills/translation/types";

/** GET ?topic=<slug> — tiến độ từ vựng; bỏ `topic` để lấy toàn bộ khu dịch */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const topic = new URL(req.url).searchParams.get("topic");

  const rows = await prisma.translationVocabProgress
    .findMany({
      where: { userId: user.id, ...(topic ? { topicSlug: topic } : {}) },
      select: { word: true, known: true, wrongCount: true, seenCount: true },
    })
    .catch(() => []);

  const map: VocabProgressMap = {};
  for (const r of rows) {
    map[r.word] = { known: r.known, wrongCount: r.wrongCount, seenCount: r.seenCount };
  }
  return NextResponse.json(map);
}

type Update = {
  word: string;
  /** true/false = học viên tự đánh dấu; bỏ trống = không đổi */
  known?: boolean;
  /** cộng dồn khi trả lời sai trong quiz/điền từ */
  wrong?: boolean;
  /** cộng dồn số lần nhìn thấy từ */
  seen?: boolean;
};

/** POST — ghi tiến độ nhiều từ một lượt (gửi khi rời màn học từ) */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    topic?: string;
    level?: string;
    updates?: Update[];
  };

  const topic = body.topic?.trim();
  const level = body.level?.trim();
  const updates = Array.isArray(body.updates) ? body.updates : [];

  if (!topic || !level || updates.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (updates.length > 60) {
    return NextResponse.json({ error: "Too many updates" }, { status: 400 });
  }

  const clean = updates
    .filter((u) => typeof u?.word === "string" && u.word.trim())
    .map((u) => ({
      word: vocabKey(u.word),
      known: typeof u.known === "boolean" ? u.known : undefined,
      wrong: u.wrong === true,
      seen: u.seen === true,
    }));

  try {
    await prisma.$transaction(
      clean.map((u) =>
        prisma.translationVocabProgress.upsert({
          where: { userId_word: { userId: user.id, word: u.word } },
          create: {
            userId: user.id,
            topicSlug: topic,
            levelSlug: level,
            word: u.word,
            known: u.known ?? false,
            wrongCount: u.wrong ? 1 : 0,
            seenCount: u.seen ? 1 : 0,
          },
          // KHÔNG cập nhật topicSlug/levelSlug: màn ôn tập gửi topic="on-tap",
          // ghi đè sẽ làm mất thông tin từ này vốn thuộc nhóm/level nào.
          update: {
            ...(u.known === undefined ? {} : { known: u.known }),
            ...(u.wrong ? { wrongCount: { increment: 1 } } : {}),
            ...(u.seen ? { seenCount: { increment: 1 } } : {}),
          },
        }),
      ),
    );
  } catch (err) {
    console.error("[vocab-progress]", err instanceof Error ? err.message.slice(0, 200) : err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, saved: clean.length });
}
