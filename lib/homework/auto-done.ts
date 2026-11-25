/**
 * lib/homework/auto-done.ts — tự đánh dấu xong các mục BTVN lấy từ kho bài.
 *
 * Mục nào có `catalogId` thì đối chiếu bằng đúng bộ kiểm của Lộ trình
 * (lib/roadmap/evidence.ts). Mục có `deckId` thì xong khi học viên đã ôn ít
 * nhất 70% số thẻ của bộ kể từ ngày giao — cùng ngưỡng với bảng "Bộ thẻ đã giao".
 *
 * Kết quả ghi vào đúng chỗ học viên tự tick (`submissions/{code}/{hwId}_{mục}_{i}`)
 * kèm `auto: true`, nên mọi màn đang đếm tiến độ (trang lớp, nhật ký, cron nhắc
 * quá hạn) tự đúng theo mà không phải sửa gì.
 *
 * Chỉ ĐÁNH DẤU, không bao giờ bỏ đánh dấu: học viên tự tick một mục mà dữ liệu
 * chưa thấy thì vẫn giữ nguyên.
 */

import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { getCatalogItem } from "@/lib/roadmap/catalog";
import { checkEvidence } from "@/lib/roadmap/evidence";
import type { Homework, HwItem, SubmissionsMap } from "@/lib/firebase/types";
import { vnTodayKey } from "./library";

const SECTIONS = ["vocab", "listening", "reading", "practice", "other"] as const;
/** BTVN hết hạn quá bấy nhiêu ngày thì thôi đối chiếu — đỡ tốn truy vấn. */
const LOOKBACK_DAYS = 30;
const DECK_MIN_PCT = 70;

/** 00:00 giờ VN của một ngày YYYY-MM-DD. */
function vnStartOf(day: string): Date {
  return new Date(`${day}T00:00:00+07:00`);
}

async function deckDone(userId: string, deckId: string, since: Date): Promise<boolean> {
  const cards = await prisma.vocabCard.findMany({ where: { deckId }, select: { wordKey: true } });
  const keys = [...new Set(cards.map((c) => c.wordKey))];
  if (keys.length === 0) return false;
  const reviewed = await prisma.vocabProgress.count({
    where: { userId, wordKey: { in: keys }, repCount: { gt: 0 }, lastReview: { gte: since } },
  });
  return (reviewed / keys.length) * 100 >= DECK_MIN_PCT;
}

async function itemDone(userId: string, item: HwItem, since: Date): Promise<boolean> {
  if (item.catalogId) {
    const c = getCatalogItem(item.catalogId);
    if (!c) return false;
    return (await checkEvidence(userId, c.evidence, since)) !== null;
  }
  if (item.deckId) return deckDone(userId, item.deckId, since);
  return false;
}

/**
 * Đối chiếu BTVN của một học viên. Trả số mục vừa được đánh dấu xong.
 * `userId` là Profile.id; bỏ trống thì tự tra theo mã học viên.
 */
export async function syncHomeworkAutoDone(code: string, userId?: string): Promise<number> {
  const uid =
    userId ??
    (await prisma.profile.findUnique({ where: { studentCode: code }, select: { id: true } }))?.id;
  if (!uid) return 0;

  const db = getAdminDb();
  const [hwSnap, subSnap] = await Promise.all([
    db.ref(`students/${code}/homework`).get(),
    db.ref(`submissions/${code}`).get(),
  ]);
  if (!hwSnap.exists()) return 0;

  const raw = hwSnap.val() as Homework[] | Record<string, Homework> | null;
  const list: Homework[] = (Array.isArray(raw) ? raw : Object.values(raw ?? {})).filter(
    (h): h is Homework => !!h?.id && !!h.date,
  );
  const subs = (subSnap.val() as SubmissionsMap | null) ?? {};

  const today = vnTodayKey();
  const cutoff = vnTodayKey(new Date(Date.now() - LOOKBACK_DAYS * 86_400_000));

  const updates: Record<string, unknown> = {};
  const now = new Date().toISOString();

  for (const hw of list) {
    if (hw.date > today) continue; // chưa tới ngày giao
    if ((hw.endDate ?? hw.date) < cutoff) continue;
    const since = vnStartOf(hw.date);

    for (const sec of SECTIONS) {
      const items = (hw[sec] as HwItem[] | undefined) ?? [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item || (!item.catalogId && !item.deckId)) continue;
        const key = `${hw.id}_${sec}_${i}`;
        if (subs[key]?.ticked) continue;
        try {
          if (await itemDone(uid, item, since)) {
            updates[key] = { ticked: true, auto: true, updatedAt: now };
          }
        } catch (e) {
          // Một mục lỗi không được chặn cả lượt đối chiếu.
          console.error("[homework auto-done]", code, key, e instanceof Error ? e.message : e);
        }
      }
    }
  }

  const n = Object.keys(updates).length;
  if (n > 0) await db.ref(`submissions/${code}`).update(updates);
  return n;
}

/** Chạy cho nhiều học viên, mỗi lượt vài người để không dồn quá nhiều truy vấn. */
export async function syncManyAutoDone(
  students: { code: string; userId?: string }[],
  batch = 6,
): Promise<number> {
  let total = 0;
  for (let i = 0; i < students.length; i += batch) {
    const res = await Promise.allSettled(
      students.slice(i, i + batch).map((s) => syncHomeworkAutoDone(s.code, s.userId)),
    );
    for (const r of res) if (r.status === "fulfilled") total += r.value;
  }
  return total;
}
