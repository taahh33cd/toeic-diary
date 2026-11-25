import { NextResponse, type NextRequest } from "next/server";
import { requireVocabUser } from "@/lib/vocab/guard";
import { lookupEn, lookupVi } from "@/lib/vocab/lexicon";

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
    return NextResponse.json({ dir, ...(await lookupEn(q, gate.userId)) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[vocab/lookup]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
