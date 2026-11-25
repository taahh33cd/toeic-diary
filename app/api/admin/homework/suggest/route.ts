import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireGrader } from "@/lib/submissions/guard";
import { suggestForStudent } from "@/lib/homework/suggest";
import { HW_SECTION_KEYS } from "@/lib/homework/content";
import { vnTodayKey } from "@/lib/homework/library";
import type { ErrorLogEntry, Homework, HwItem } from "@/lib/firebase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  classId: z.string().trim().min(1).max(80),
  hwId: z.string().trim().max(80).optional(),
  budget: z.number().int().min(5).max(120).default(30),
});

function asList(v: unknown): Homework[] {
  if (Array.isArray(v)) return v.filter(Boolean) as Homework[];
  if (v && typeof v === "object") return Object.values(v) as Homework[];
  return [];
}

function catalogIds(hw: Homework | undefined): string[] {
  if (!hw) return [];
  return HW_SECTION_KEYS.flatMap((k) => ((hw[k] as HwItem[] | undefined) ?? []).map((i) => i?.catalogId).filter(Boolean) as string[]);
}

/**
 * POST /api/admin/homework/suggest — gợi ý bài riêng cho từng HV của một lớp,
 * dựa trên dữ liệu làm bài 30 ngày (xem lib/homework/suggest.ts).
 */
export async function POST(req: Request) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const { classId, hwId, budget } = parsed.data;

  const db = getAdminDb();
  const cls = ((await db.ref(`classes/${classId}`).get()).val() ?? null) as
    | { members?: string[]; homework?: unknown }
    | null;
  if (!cls) return NextResponse.json({ error: "Không tìm thấy lớp" }, { status: 404 });
  const members: string[] = Array.isArray(cls.members) ? cls.members : Object.values(cls.members ?? {});
  const classHw = asList(cls.homework).find((h) => h.id === hwId);

  const profiles = await prisma.profile.findMany({
    where: { studentCode: { in: members } },
    select: { id: true, studentCode: true },
  });
  const uid = new Map(profiles.map((p) => [p.studentCode!, p.id]));
  const cutoff = vnTodayKey(new Date(Date.now() - 60 * 86_400_000));

  const out = [];
  for (let i = 0; i < members.length; i += 4) {
    const batch = await Promise.all(
      members.slice(i, i + 4).map(async (code) => {
        const st = ((await db.ref(`students/${code}`).get()).val() ?? {}) as {
          name?: string;
          frozen?: boolean;
          errorLog?: Record<string, ErrorLogEntry>;
          homework?: unknown;
        };
        if (st.frozen) return null;
        const exclude = new Set<string>(catalogIds(classHw));
        for (const h of asList(st.homework)) {
          if ((h.endDate ?? h.date) >= cutoff || h.id === hwId) catalogIds(h).forEach((c) => exclude.add(c));
        }
        try {
          const s = await suggestForStudent({ code, userId: uid.get(code) ?? null, errorLog: st.errorLog, exclude, budget });
          return { ...s, name: st.name ?? code };
        } catch (e) {
          console.error("[suggest]", code, e instanceof Error ? e.message : e);
          return { code, name: st.name ?? code, score: null, reasons: ["Lỗi khi đọc dữ liệu"], suggestions: [], inactive: false };
        }
      }),
    );
    out.push(...batch.filter(Boolean));
  }
  return NextResponse.json({ students: out });
}
