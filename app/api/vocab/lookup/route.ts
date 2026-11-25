import { NextResponse, type NextRequest } from "next/server";
import { requireVocabUser } from "@/lib/vocab/guard";
import { prisma } from "@/lib/db/prisma";
import { lookupEn, lookupVi } from "@/lib/vocab/lexicon";
import { normalizeWord } from "@/lib/vocab/normalize";

export const dynamic = "force-dynamic";

/**
 * Tra từ cho Sổ từ vựng.
 *   GET ?q=negotiate&dir=en  → một mục từ điển (nghĩa, ví dụ, cụm, họ từ, cấp)
 *   GET ?q=hợp đồng&dir=vi   → 2–4 từ tiếng Anh tương ứng
 * Chỉ lượt phải gọi AI mới bị tính vào giới hạn; từ đã có trong cache thì miễn.
 */
export async function GET(req: NextRequest) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim();
  const dir = sp.get("dir") === "vi" ? "vi" : "en";
  if (!q) return NextResponse.json({ error: "Thiếu từ cần tra" }, { status: 400 });

  try {
    if (dir === "vi") return NextResponse.json({ dir, ...(await lookupVi(q, gate.userId)) });
    const res = await lookupEn(q, gate.userId);
    // Từ đã có trong sổ thì báo luôn — popup bôi đen dùng để thay nút Lưu
    const owned = res.found
      ? await prisma.vocabCard.findFirst({
          where: { wordKey: normalizeWord(res.entry.word), deck: { ownerId: gate.userId } },
          select: { deck: { select: { id: true, title: true } } },
        })
      : null;
    return NextResponse.json({ dir, ...res, owned: owned ? owned.deck : null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[vocab/lookup]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
