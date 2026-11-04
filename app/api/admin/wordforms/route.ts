import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";

export const dynamic = "force-dynamic";

/**
 * Câu "chọn dạng từ" học viên đã báo sai.
 *
 * Dạng này do AI soạn nên chắc chắn có câu hỏng; báo xong nó tắt ngay, nhưng
 * phải có chỗ cho thầy xem lại — bỏ hẳn, hay khôi phục nếu học viên báo nhầm.
 */
export async function GET(req: NextRequest) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const status = req.nextUrl.searchParams.get("status") ?? "reported";
  try {
    const rows = await prisma.vocabWordForm.findMany({
      where: status === "all" ? {} : { status },
      orderBy: [{ reportCount: "desc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        wordKey: true,
        cloze: true,
        answer: true,
        distractors: true,
        status: true,
        reportCount: true,
        reportNote: true,
      },
    });

    // Số câu còn đang dùng — để thầy biết báo sai chiếm bao nhiêu phần
    const dangDung = await prisma.vocabWordForm.count({ where: { status: "ok" } });
    return NextResponse.json({ rows, dangDung });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin/wordforms GET]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}

const patchInput = z.object({
  id: z.string().min(1),
  /** "ok" khôi phục · "rejected" bỏ hẳn, lần sinh sau không dựng lại */
  status: z.enum(["ok", "rejected"]),
});

export async function PATCH(req: NextRequest) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let body: z.infer<typeof patchInput>;
  try {
    body = patchInput.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  try {
    const co = await prisma.vocabWordForm.findUnique({
      where: { id: body.id },
      select: { id: true },
    });
    if (!co) return NextResponse.json({ error: "Không tìm thấy câu hỏi" }, { status: 404 });

    await prisma.vocabWordForm.update({
      where: { id: body.id },
      data:
        // Khôi phục thì xoá sạch dấu vết báo sai, không thì câu vừa bật lại đã
        // mang sẵn reportCount và lần sau nhìn tưởng vẫn đang có vấn đề.
        body.status === "ok"
          ? { status: "ok", reportCount: 0, reportNote: null }
          : { status: "rejected" },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin/wordforms PATCH]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
