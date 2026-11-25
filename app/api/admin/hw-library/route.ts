import { NextResponse } from "next/server";

import { CATALOG_ITEMS } from "@/lib/roadmap/catalog";
import { requireGrader } from "@/lib/submissions/guard";
import { toLibItem } from "@/lib/homework/library";

/**
 * GET /api/admin/hw-library — kho bài cho khung soạn BTVN.
 *
 * Trả bản gọn của danh mục Lộ trình (~600 bài). Không gửi điều kiện chấm
 * (`evidence`) xuống trình duyệt: client chỉ cần catalogId, phần chấm chạy ở
 * server (lib/homework/auto-done.ts).
 */
export async function GET() {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  return NextResponse.json(
    { items: CATALOG_ITEMS.map(toLibItem) },
    { headers: { "Cache-Control": "private, max-age=600" } },
  );
}
