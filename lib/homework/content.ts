/**
 * lib/homework/content.ts — "nội dung" BTVN = các mục bài (vocab, reading…)
 * không kèm id/ngày. Mẫu BTVN, buổi trong giáo trình và nháp đều lưu ở dạng này.
 */

import type { Prisma } from "@prisma/client";
import { z } from "zod";
import type { Homework, HwItem } from "@/lib/firebase/types";

export const HW_SECTION_KEYS = ["vocab", "reading", "listening", "practice", "other"] as const;
export type HwSectionKey = (typeof HW_SECTION_KEYS)[number];
export type HwContent = Partial<Record<HwSectionKey, HwItem[]>>;

const ItemSchema = z.object({
  text: z.string().max(2000),
  link: z.string().max(2000).optional(),
  desc: z.string().max(10000).optional(),
  catalogId: z.string().max(200).optional(),
  deckId: z.string().max(200).optional(),
  minutes: z.number().int().min(0).max(600).optional(),
  personal: z.boolean().optional(),
});

export const ContentSchema = z.object({
  vocab: z.array(ItemSchema).max(50).optional(),
  reading: z.array(ItemSchema).max(50).optional(),
  listening: z.array(ItemSchema).max(50).optional(),
  practice: z.array(ItemSchema).max(50).optional(),
  other: z.array(ItemSchema).max(50).optional(),
});

/** Bỏ id/ngày/tiêu đề, chỉ giữ các mục có bài; bỏ luôn trường undefined. */
export function contentOf(hw: Partial<Homework> | HwContent): HwContent {
  const out: HwContent = {};
  for (const k of HW_SECTION_KEYS) {
    const items = ((hw as HwContent)[k] ?? []).filter((i) => i?.text?.trim());
    if (items.length) out[k] = items.map((i) => JSON.parse(JSON.stringify(i)) as HwItem);
  }
  return out;
}

export function itemCount(c: HwContent): number {
  return HW_SECTION_KEYS.reduce((a, k) => a + (c[k]?.length ?? 0), 0);
}

export function totalMinutes(c: HwContent): number {
  return HW_SECTION_KEYS.reduce(
    (a, k) => a + (c[k] ?? []).reduce((b, i) => b + (i.minutes ?? 0), 0),
    0,
  );
}

/** Ghép thêm nội dung vào cuối từng mục (dùng khi "Dùng mẫu"). */
export function mergeContent(a: HwContent, b: HwContent): HwContent {
  const out: HwContent = { ...a };
  for (const k of HW_SECTION_KEYS) {
    const items = [...(a[k] ?? []), ...(b[k] ?? [])];
    if (items.length) out[k] = items;
  }
  return out;
}

/** Nội dung → giá trị JSON cho Prisma. */
export function toJson(c: HwContent): Prisma.InputJsonValue {
  return c as unknown as Prisma.InputJsonValue;
}

/**
 * Bản BTVN của lớp vừa được sửa/đồng bộ xuống HV: giữ lại các bài riêng
 * (`personal`) HV đó đang có, nối vào cuối đúng mục cũ. Không có thì trả nguyên.
 */
export function keepPersonal<T extends Partial<Homework>>(prev: Partial<Homework> | undefined, next: T): T {
  if (!prev) return next;
  let out: T | null = null;
  for (const k of HW_SECTION_KEYS) {
    const mine = ((prev[k] as HwItem[] | undefined) ?? []).filter((i) => i?.personal);
    if (mine.length === 0) continue;
    const base = ((next[k] as HwItem[] | undefined) ?? []).filter((i) => !i?.personal);
    out ??= { ...next };
    (out as Record<string, unknown>)[k] = [...base, ...mine];
  }
  return out ?? next;
}
