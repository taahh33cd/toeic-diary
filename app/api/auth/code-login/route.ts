import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db/prisma";

const RTDB =
  "https://quanlyhocvien-b1796-default-rtdb.asia-southeast1.firebasedatabase.app";

/**
 * POST /api/auth/code-login
 * Body: { code: string }
 *
 * Flow:
 * 1. Validate code tồn tại trong Firebase RTDB
 * 2. Tìm hoặc tạo Supabase account với email {code}@hv.internal
 * 3. Upsert profile với studentCode + acceptedAt
 * 4. Trả magic link → client redirect → user đăng nhập
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { code?: string };
    const code = body.code?.trim();
    if (!code) {
      return NextResponse.json({ error: "Vui lòng nhập mã học viên." }, { status: 400 });
    }

    // 1. Kiểm tra mã trong Firebase
    const fbRes = await fetch(`${RTDB}/students/${encodeURIComponent(code)}/name.json`);
    if (!fbRes.ok) {
      return NextResponse.json({ error: "Không thể kết nối hệ thống." }, { status: 502 });
    }
    const studentName: string | null = await fbRes.json();
    if (studentName === null) {
      return NextResponse.json({ error: "Mã học viên không tồn tại." }, { status: 404 });
    }

    const email = `${code.toLowerCase()}@hv.internal`;
    const supabase = createAdminClient();

    // 2. Tìm profile hiện có theo studentCode
    const existingProfile = await prisma.profile.findUnique({
      where: { studentCode: code },
      select: { id: true, acceptedAt: true },
    });

    let userId: string;

    if (existingProfile) {
      // Profile đã có — chỉ cần đảm bảo acceptedAt được set
      userId = existingProfile.id;
      if (!existingProfile.acceptedAt) {
        await prisma.profile.update({
          where: { id: userId },
          data: { acceptedAt: new Date() },
        });
      }
    } else {
      // Tạo Supabase user mới
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { student_code: code, display_name: studentName },
      });
      if (createErr || !created.user) {
        return NextResponse.json(
          { error: createErr?.message ?? "Không thể tạo tài khoản." },
          { status: 500 },
        );
      }
      userId = created.user.id;

      // Tạo profile
      await prisma.profile.create({
        data: {
          id: userId,
          role: "student",
          studentCode: code,
          displayName: studentName,
          acceptedAt: new Date(),
        },
      });
    }

    // 3. Generate OTP token (không dùng magic link redirect — dùng verifyOtp client-side)
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkErr || !linkData?.properties?.email_otp) {
      return NextResponse.json(
        { error: linkErr?.message ?? "Không thể tạo link đăng nhập." },
        { status: 500 },
      );
    }

    return NextResponse.json({ email, token: linkData.properties.email_otp });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[code-login]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
