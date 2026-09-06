import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Booking, Slot } from "@/lib/firebase/types";

/**
 * POST /api/bookings/slot — học viên đặt một khung giờ.
 *
 * Chạy ở server bằng Admin SDK vì hai lý do:
 *   1. Giữ chỗ phải NGUYÊN TỬ. Hai HV bấm đặt cùng lúc thì chỉ một người thắng;
 *      transaction trên `slots/{id}/taken` đảm bảo điều đó, còn client ghi
 *      thẳng vào RTDB thì không.
 *   2. Rules chỉ cho teacher/admin ghi `slots`. Nếu mở cho HV thì HV có thể tự
 *      đánh dấu khung giờ của người khác là đã kín.
 *
 * Body: { slotId: string, note?: string }
 */

export async function POST(req: NextRequest) {
  let slotId = "";
  // Chỉ khởi tạo Admin SDK sau khi qua kiểm tra input + phiên đăng nhập, để
  // request hỏng nhận đúng 400/401 thay vì 500 do thiếu service account.
  let db: ReturnType<typeof getAdminDb> | null = null;

  try {
    const body = (await req.json()) as { slotId?: string; note?: string };
    slotId = (body.slotId ?? "").trim();
    const note = (body.note ?? "").trim();

    if (!slotId) {
      return NextResponse.json({ error: "Thiếu slotId" }, { status: 400 });
    }

    // 1. Xác thực phiên Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    // 2. Khung giờ còn tồn tại?
    db = getAdminDb();
    const slotSnap = await db.ref(`slots/${slotId}`).get();
    const slot = slotSnap.val() as Slot | null;
    if (!slot) {
      return NextResponse.json({ error: "Khung giờ không còn tồn tại." }, { status: 404 });
    }

    // 3. Giữ chỗ — người bấm sau sẽ thấy `taken` đã là true và bị chặn
    const res = await db.ref(`slots/${slotId}/taken`).transaction((cur) =>
      cur ? undefined : true
    );
    if (!res.committed || res.snapshot.val() !== true) {
      return NextResponse.json(
        { error: "Khung giờ vừa có người khác đặt. Chọn giúp thầy khung khác nhé!" },
        { status: 409 }
      );
    }

    // 4. Ghi booking
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, student_code")
      .eq("id", user.id)
      .single<{ display_name: string | null; student_code: string | null }>();
    const displayName = profile?.display_name ?? "Học viên";

    const id = `b${Date.now()}`;
    const booking: Booking = {
      id,
      studentId: user.id,
      studentName: displayName,
      slotId,
      date: slot.date,
      time: slot.time,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...(note ? { note } : {}),
      // Thông báo đánh theo mã học viên, còn studentId là uid Supabase.
      ...(profile?.student_code ? { studentCode: profile.student_code } : {}),
    };

    await db.ref(`bookings/${id}`).set(booking);

    return NextResponse.json({ booking });
  } catch (err: unknown) {
    // Giữ chỗ rồi mà ghi booking hỏng thì phải nhả ra, không thì khung giờ kẹt
    // ở trạng thái "đã có người đặt" mà chẳng có booking nào.
    if (db && slotId) {
      await db.ref(`slots/${slotId}/taken`).remove().catch(() => {});
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[bookings/slot]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
