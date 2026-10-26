import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Giới hạn lượt gọi cho các route AI của khu bộ thẻ.
 *
 * Đây là chỗ đầu tiên trong repo thật sự dùng @upstash/ratelimit — package đã
 * nằm trong dependencies từ lâu nhưng chưa nơi nào gọi, nên hai route AI cũ
 * (/api/ai/*) hiện vẫn không có trần nào.
 *
 * Thiếu env Upstash thì CHO QUA, không chặn: mất rate limit còn hơn mất tính
 * năng, và local dev thường không cấu hình Redis.
 */

const coRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = coRedis ? Redis.fromEnv() : null;

function taoLimit(soLuot: number, cuaSo: `${number} ${"s" | "m" | "h" | "d"}`, prefix: string) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(soLuot, cuaSo),
    prefix: `vocab:${prefix}`,
    analytics: false,
  });
}

/** Điền nghĩa/IPA cho danh sách dán vào: 10 lượt/ngày/học viên. */
const enrichLimit = taoLimit(10, "1 d", "enrich");

/** Sinh bộ từ nội dung đã học: 5 lượt/ngày/học viên. */
const contentLimit = taoLimit(5, "1 d", "content");

/** Tìm ảnh: 60 lượt/giờ — Pexels free cho 200 req/giờ cho TOÀN hệ thống. */
const imageLimit = taoLimit(60, "1 h", "image");

export type LimitKind = "enrich" | "content" | "image";

const BANG: Record<LimitKind, Ratelimit | null> = {
  enrich: enrichLimit,
  content: contentLimit,
  image: imageLimit,
};

const NHAN: Record<LimitKind, string> = {
  enrich: "điền nghĩa tự động",
  content: "sinh bộ từ bài học",
  image: "tìm ảnh",
};

export interface LimitResult {
  ok: boolean;
  /** Số lượt còn lại trong cửa sổ. -1 khi không bật giới hạn. */
  remaining: number;
  message?: string;
}

export async function checkLimit(kind: LimitKind, userId: string): Promise<LimitResult> {
  const rl = BANG[kind];
  if (!rl) return { ok: true, remaining: -1 };

  try {
    const { success, remaining, reset } = await rl.limit(userId);
    if (success) return { ok: true, remaining };
    const phut = Math.max(1, Math.ceil((reset - Date.now()) / 60_000));
    const moTa = phut >= 60 ? `${Math.ceil(phut / 60)} giờ` : `${phut} phút`;
    return {
      ok: false,
      remaining: 0,
      message: `Bạn đã dùng hết lượt ${NHAN[kind]} hôm nay. Thử lại sau ${moTa}.`,
    };
  } catch (e) {
    // Redis trục trặc thì cho qua — không để hạ tầng phụ chặn việc học.
    console.error("[ratelimit]", e instanceof Error ? e.message : String(e));
    return { ok: true, remaining: -1 };
  }
}
