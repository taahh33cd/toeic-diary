import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireVocabUser } from "@/lib/vocab/guard";
import { moTaLoi } from "@/lib/vocab/deck";
import { checkLimit } from "@/lib/vocab/ratelimit";
import { enrichWords } from "@/lib/vocab/enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Tra từ điển + Gemini cho tới 50 từ có thể mất kha khá thời gian. */
export const maxDuration = 60;

const input = z.object({
  words: z.array(z.string().trim().min(1).max(120)).min(1).max(50, "Mỗi lượt tối đa 50 từ"),
});

/**
 * Điền nghĩa tiếng Việt, IPA, loại từ, định nghĩa và câu ví dụ cho danh sách từ
 * học viên dán vào.
 *
 * Không ghi gì xuống DB — chỉ trả dữ liệu để màn tạo bộ hiện lên cho học viên
 * sửa trước khi lưu. AI đoán sai thì họ sửa, chứ không âm thầm vào kho từ.
 */
export async function POST(req: NextRequest) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: moTaLoi(parsed.error) },
      { status: 400 }
    );
  }

  const limit = await checkLimit("enrich", gate.userId);
  if (!limit.ok) return NextResponse.json({ error: limit.message }, { status: 429 });

  try {
    const words = await enrichWords(parsed.data.words);
    return NextResponse.json({ words, remaining: limit.remaining });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/ai/enrich]", msg);
    return NextResponse.json({ error: `Không điền được: ${msg}` }, { status: 500 });
  }
}
