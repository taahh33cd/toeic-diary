import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { requireGrader } from "@/lib/submissions/guard";
import { getAdminDb } from "@/lib/firebase/admin";
import { MONTH_RE, monthLabel, sanitizeParts, vnMonth } from "@/lib/part-goals/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PUT /api/admin/part-goals  { codes: string[], month: "YYYY-MM", parts }
 * GV đặt (hoặc ghi đè) mục tiêu part của tháng cho một hoặc nhiều HV, rồi báo cho HV.
 * Tháng đã qua chỉ xem, không sửa.
 */
export async function PUT(req: NextRequest) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = (await req.json().catch(() => null)) as { codes?: unknown; month?: unknown; parts?: unknown } | null;
  const month = typeof body?.month === "string" ? body.month : "";
  const codes = Array.isArray(body?.codes)
    ? [...new Set(body!.codes.filter((c): c is string => typeof c === "string" && /^[\w-]{1,64}$/.test(c)))]
    : [];
  const parts = sanitizeParts(body?.parts);
  if (!MONTH_RE.test(month)) return NextResponse.json({ error: "Tháng không hợp lệ" }, { status: 400 });
  if (month < vnMonth()) return NextResponse.json({ error: "Tháng đã qua chỉ xem, không sửa được" }, { status: 400 });
  if (codes.length === 0 || codes.length > 300) return NextResponse.json({ error: "Chưa chọn học viên" }, { status: 400 });
  if (!parts) return NextResponse.json({ error: "Mục tiêu part không hợp lệ" }, { status: 400 });

  const me = await prisma.profile.findUnique({ where: { id: gate.user!.id }, select: { displayName: true } });
  const setByName = me?.displayName ?? null;
  const json = parts as unknown as Prisma.InputJsonObject;

  await prisma.$transaction(codes.map((code) =>
    prisma.partGoal.upsert({
      where: { studentCode_month: { studentCode: code, month } },
      create: { studentCode: code, month, parts: json, setById: gate.user!.id, setByName },
      update: { parts: json, setById: gate.user!.id, setByName },
    }),
  ));

  // Báo HV trong app. Lỗi báo không làm hỏng việc lưu.
  try {
    const db = getAdminDb();
    const now = Date.now();
    await Promise.all(codes.map((code, i) =>
      db.ref(`notifications/${code}/${now + i}`).set({
        type: "goal",
        title: `🎯 Mục tiêu part ${monthLabel(month)}`,
        body: "Thầy/cô vừa đặt mục tiêu từng part cho bạn. Mở sổ để xem.",
        read: false,
        createdAt: new Date(now).toISOString(),
      }),
    ));
  } catch (e) {
    console.error("[part-goals PUT notify]", e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ ok: true, count: codes.length });
}

/** DELETE /api/admin/part-goals?code=XXX&month=YYYY-MM — xoá mục tiêu một tháng (chưa qua). */
export async function DELETE(req: NextRequest) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const code = req.nextUrl.searchParams.get("code") ?? "";
  const month = req.nextUrl.searchParams.get("month") ?? "";
  if (!code || !MONTH_RE.test(month)) return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  if (month < vnMonth()) return NextResponse.json({ error: "Tháng đã qua chỉ xem" }, { status: 400 });
  await prisma.partGoal.deleteMany({ where: { studentCode: code, month } });
  return NextResponse.json({ ok: true });
}
