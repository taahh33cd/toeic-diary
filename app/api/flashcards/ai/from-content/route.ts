import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireVocabUser } from "@/lib/vocab/guard";
import { checkLimit } from "@/lib/vocab/ratelimit";
import { layVanBan, listSources, rutTuVung, type ContentSource } from "@/lib/vocab/from-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NGUON = ["lesson", "reading", "error-log", "wrong-answers"] as const;

/** Liệt kê nguồn học viên chọn được (bài đã học, bài đọc đã làm, đề đã thi…). */
export async function GET(req: NextRequest) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const raw = new URL(req.url).searchParams.get("source");
  if (!raw || !NGUON.includes(raw as ContentSource)) {
    return NextResponse.json({ error: "Nguồn không hợp lệ" }, { status: 400 });
  }

  try {
    const options = await listSources(gate.userId, gate.studentCode, raw as ContentSource);
    return NextResponse.json({ options });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ai/from-content GET]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}

const input = z.object({
  source: z.enum(NGUON),
  ref: z.string().trim().min(1).max(200),
  count: z.number().int().min(3).max(25).optional(),
});

/**
 * Rút từ vựng từ một nội dung học viên đã học, trả về để họ xem và sửa trước
 * khi lưu. Không tự tạo bộ — AI chọn từ còn người quyết định giữ từ nào.
 */
export async function POST(req: NextRequest) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    );
  }
  const { source, ref, count } = parsed.data;

  const limit = await checkLimit("content", gate.userId);
  if (!limit.ok) return NextResponse.json({ error: limit.message }, { status: 429 });

  try {
    const { text, label } = await layVanBan(gate.userId, gate.studentCode, source, ref);
    if (!text.trim()) {
      // Phân biệt rõ hai tình huống: lượt thi không có câu nào sai là chuyện
      // bình thường, còn không lấy được nội dung mới là trục trặc.
      return NextResponse.json(
        {
          error:
            source === "wrong-answers"
              ? "Lượt này không có câu nào bạn trả lời sai — chọn lượt khác nhé."
              : "Không tìm thấy nội dung cho mục này",
        },
        { status: 404 }
      );
    }

    const cards = await rutTuVung(text, count ?? 12);
    if (cards.length === 0) {
      return NextResponse.json({ error: "AI không rút được từ nào từ nội dung này" }, { status: 502 });
    }

    return NextResponse.json({
      cards,
      label,
      sourceRef: ref,
      charsUsed: Math.min(text.length, 6000),
      remaining: limit.remaining,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ai/from-content POST]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
