import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminDb } from "@/lib/firebase/admin";
import { requireGrader } from "@/lib/submissions/guard";
import { ContentSchema, HW_SECTION_KEYS, contentOf } from "@/lib/homework/content";
import type { Homework, HwItem } from "@/lib/firebase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  hwId: z.string().trim().min(1).max(80),
  picks: z
    .array(z.object({ code: z.string().trim().min(1).max(40), content: ContentSchema }))
    .min(1)
    .max(80),
});

function asList(v: unknown): Homework[] {
  if (Array.isArray(v)) return v.filter(Boolean) as Homework[];
  if (v && typeof v === "object") return Object.values(v) as Homework[];
  return [];
}

/**
 * POST /api/admin/homework/personal — gắn bài riêng vào bản BTVN của từng HV.
 * Bài được đánh dấu `personal` nên khi lớp sửa / đồng bộ BTVN, bài riêng vẫn
 * được giữ (lib/homework/content.ts → keepPersonal).
 */
export async function POST(req: Request) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const { hwId, picks } = parsed.data;
  const db = getAdminDb();

  const results: { code: string; ok: boolean; added: number; error?: string }[] = [];
  for (const { code, content } of picks) {
    try {
      const path = `students/${code}/homework`;
      const list = asList((await db.ref(path).get()).val());
      const idx = list.findIndex((h) => h.id === hwId);
      if (idx === -1) {
        results.push({ code, ok: false, added: 0, error: "HV chưa có BTVN này" });
        continue;
      }
      const hw = { ...list[idx] };
      const add = contentOf(content);
      let added = 0;
      for (const k of HW_SECTION_KEYS) {
        const cur = ((hw[k] as HwItem[] | undefined) ?? []).slice();
        for (const it of add[k] ?? []) {
          const dup = cur.some((c) => (it.catalogId && c.catalogId === it.catalogId) || (it.link && c.link === it.link));
          if (dup) continue;
          cur.push({ ...it, personal: true });
          added++;
        }
        if (cur.length) hw[k] = cur;
      }
      list[idx] = hw;
      await db.ref(path).set(list);
      if (added > 0) {
        await db.ref(`notifications/${code}/${Date.now()}`).set({
          type: "homework",
          title: "🎯 Thầy giao thêm bài riêng cho bạn",
          body: `${added} bài riêng trong ${hw.title ?? "BTVN"} — chọn đúng chỗ bạn còn yếu.`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
      results.push({ code, ok: true, added });
    } catch (e) {
      results.push({ code, ok: false, added: 0, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return NextResponse.json({ results });
}
