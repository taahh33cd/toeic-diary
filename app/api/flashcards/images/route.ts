import { NextResponse, type NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireVocabUser } from "@/lib/vocab/guard";
import { checkLimit } from "@/lib/vocab/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SO_ANH = 12;
/** Cache 30 ngày: ảnh minh hoạ một từ không đổi theo ngày. */
const HAN_CACHE_MS = 30 * 24 * 3600 * 1000;

interface Anh {
  url: string;
  thumb: string;
  tacGia: string;
}

function khoaCache(q: string) {
  return q.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").slice(0, 60);
}

async function docCache(q: string): Promise<Anh[] | null> {
  try {
    const snap = await getAdminDb().ref(`pexels_cache/${khoaCache(q)}`).get();
    if (!snap.exists()) return null;
    const v = snap.val() as { ts?: number; anh?: Anh[] };
    if (!v?.anh || !v.ts || Date.now() - v.ts > HAN_CACHE_MS) return null;
    return v.anh;
  } catch {
    return null;
  }
}

async function ghiCache(q: string, anh: Anh[]) {
  try {
    await getAdminDb().ref(`pexels_cache/${khoaCache(q)}`).set({ ts: Date.now(), anh });
  } catch {
    /* cache trượt thì lần sau gọi lại, không sao */
  }
}

/**
 * Tìm ảnh minh hoạ cho thẻ từ vựng.
 *
 * Key Pexels nằm ở SERVER. Bản FlashCards Pro nhúng thẳng key vào mã client
 * nên nó lộ trong bundle đã phát hành — key đó phải thu hồi, không chỉ chuyển
 * chỗ.
 *
 * Cache 30 ngày vì gói Pexels miễn phí chỉ cho 200 request/giờ cho TOÀN hệ
 * thống: 30 học viên cùng soạn bộ là chạm trần ngay.
 */
export async function GET(req: NextRequest) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ error: "Thiếu từ khoá" }, { status: 400 });
  if (q.length > 80) return NextResponse.json({ error: "Từ khoá quá dài" }, { status: 400 });

  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    // Nói rõ là chưa cấu hình, không giả vờ "không tìm thấy ảnh" — người dùng
    // sẽ ngồi thử lại từ khoá khác mãi không ra.
    return NextResponse.json(
      { error: "Tìm ảnh chưa được cấu hình trên máy chủ. Bạn vẫn dán link ảnh hoặc tải ảnh lên được." },
      { status: 503 }
    );
  }

  const cached = await docCache(q);
  if (cached) return NextResponse.json({ anh: cached, tuCache: true });

  const limit = await checkLimit("image", gate.userId);
  if (!limit.ok) return NextResponse.json({ error: limit.message }, { status: 429 });

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${SO_ANH}`,
      { headers: { Authorization: key }, signal: AbortSignal.timeout(8000) }
    );
    if (res.status === 429) {
      return NextResponse.json(
        { error: "Nguồn ảnh đang quá tải. Thử lại sau vài phút, hoặc dán link ảnh." },
        { status: 429 }
      );
    }
    if (!res.ok) {
      return NextResponse.json({ error: `Nguồn ảnh trả lỗi ${res.status}` }, { status: 502 });
    }

    const data = (await res.json()) as {
      photos?: { src?: { medium?: string; tiny?: string; large?: string }; photographer?: string }[];
    };
    const anh: Anh[] = (data.photos ?? [])
      .map((p) => ({
        url: p.src?.large ?? p.src?.medium ?? "",
        thumb: p.src?.tiny ?? p.src?.medium ?? "",
        tacGia: p.photographer ?? "",
      }))
      .filter((a) => a.url);

    if (anh.length > 0) void ghiCache(q, anh);
    return NextResponse.json({ anh, tuCache: false, remaining: limit.remaining });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/images]", msg);
    return NextResponse.json({ error: "Không gọi được nguồn ảnh" }, { status: 502 });
  }
}
