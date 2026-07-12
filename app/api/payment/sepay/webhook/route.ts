import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { normalizeNote } from "@/lib/payment/khoa0";

export const dynamic = "force-dynamic";

/**
 * POST /api/payment/sepay/webhook
 * Called server-to-server by SePay when money arrives in the linked bank
 * account. Matches the transfer note to a pending order and grants the course.
 *
 * Auth: SePay sends `Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>`.
 * SePay payload: { id, transferType: "in"|"out", transferAmount, content,
 *                  description, code, referenceCode, ... }
 *
 * Always responds 200 { success: true } on handled cases so SePay stops
 * retrying; only auth/parse failures return an error status.
 */
export async function POST(req: NextRequest) {
  // ── Verify shared secret ────────────────────────────────────────────────
  const expected = process.env.SEPAY_WEBHOOK_API_KEY;
  if (!expected) {
    console.error("[sepay/webhook] SEPAY_WEBHOOK_API_KEY not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.replace(/^Apikey\s+/i, "").trim();
  if (provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse payload ───────────────────────────────────────────────────────
  let body: {
    id?: number | string;
    transferType?: string;
    transferAmount?: number;
    content?: string;
    description?: string;
    code?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  // Only incoming transfers can fulfil an order.
  if (body.transferType && body.transferType !== "in") {
    return NextResponse.json({ success: true, ignored: "not_incoming" });
  }

  const txId = body.id != null ? String(body.id) : null;
  const note = normalizeNote([body.code, body.content, body.description].filter(Boolean).join(" "));
  if (!note) {
    return NextResponse.json({ success: true, ignored: "no_note" });
  }

  // ── Match a pending order by its code appearing in the transfer note ─────
  const pending = await prisma.coursePurchase.findMany({
    where: { status: "pending" },
    select: { id: true, code: true, amount: true, courseId: true, userId: true },
  });
  const match = pending.find((p) => note.includes(normalizeNote(p.code)));
  if (!match) {
    return NextResponse.json({ success: true, ignored: "no_match" });
  }

  // Idempotency: this transaction already processed?
  if (txId) {
    const dup = await prisma.coursePurchase.findUnique({
      where: { sepayTxId: txId },
      select: { id: true },
    });
    if (dup) return NextResponse.json({ success: true, ignored: "duplicate_tx" });
  }

  // Guard against underpayment.
  if (typeof body.transferAmount === "number" && body.transferAmount < match.amount) {
    console.warn(`[sepay/webhook] underpaid ${match.code}: ${body.transferAmount} < ${match.amount}`);
    return NextResponse.json({ success: true, ignored: "underpaid" });
  }

  // ── Fulfil: mark paid + grant course access ──────────────────────────────
  try {
    await prisma.$transaction(async (tx) => {
      await tx.coursePurchase.update({
        where: { id: match.id },
        data: { status: "paid", sepayTxId: txId, paidAt: new Date() },
      });

      const profile = await tx.profile.findUnique({
        where: { id: match.userId },
        select: { enrolledCourses: true },
      });
      const current = profile?.enrolledCourses ?? [];
      if (!current.includes(match.courseId)) {
        await tx.profile.update({
          where: { id: match.userId },
          data: { enrolledCourses: { set: [...current, match.courseId] } },
        });
      }
    });
  } catch (err) {
    console.error("[sepay/webhook] fulfil failed", err);
    return NextResponse.json({ error: "Fulfil failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
