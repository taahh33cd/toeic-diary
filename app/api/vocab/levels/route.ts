import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireVocabUser } from "@/lib/vocab/guard";
import { LEVEL_BATCH, tagLevels } from "@/lib/vocab/lexicon";

export const dynamic = "force-dynamic";

const input = z.object({ words: z.array(z.string().trim().min(1).max(60)).min(1).max(LEVEL_BATCH) });

/**
 * Gắn cấp độ TOEIC cho các từ trong sổ chưa có cấp. Trang Sổ từ vựng gọi sau
 * khi tải danh sách; kết quả lưu vào vocab_lexicon nên mỗi từ chỉ gắn một lần
 * cho cả hệ thống.
 */
export async function POST(req: NextRequest) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Danh sách từ không hợp lệ" }, { status: 400 });

  try {
    return NextResponse.json(await tagLevels(parsed.data.words, gate.userId));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[vocab/levels]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
