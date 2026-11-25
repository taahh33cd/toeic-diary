import type { Homework, HwItem } from "@/lib/firebase/types";
import { HW_CATS, type HwCatKey } from "@/lib/homework/library";

/** Một mục đang soạn. `srcLink` = link gốc của bài kho; sửa link khác đi là thành bài thường. */
export type Draft = {
  uid: string;
  text: string;
  link: string;
  desc: string;
  catalogId?: string;
  deckId?: string;
  minutes?: number;
  srcLink?: string;
  personal?: boolean;
};

export type NewDraft = Omit<Draft, "uid">;
export type Sections = Record<HwCatKey, Draft[]>;

let seq = 0;
export function uid(): string {
  seq += 1;
  return `d${Date.now().toString(36)}${seq}`;
}

export function emptySections(): Sections {
  return { vocab: [], reading: [], listening: [], practice: [], other: [] };
}

/** Mục có còn trỏ đúng bài kho/bộ thẻ không (giáo viên chưa đổi link). */
export function isLinked(d: Pick<Draft, "catalogId" | "deckId" | "link" | "srcLink">): boolean {
  return !!(d.catalogId || d.deckId) && d.link.trim() === (d.srcLink ?? "");
}

export function hwToSections(hw: Homework): Sections {
  const s = emptySections();
  for (const { key } of HW_CATS) {
    s[key] = ((hw[key] as HwItem[] | undefined) ?? []).map((i) => ({
      uid: uid(),
      text: i.text ?? "",
      link: i.link ?? "",
      desc: i.desc ?? "",
      catalogId: i.catalogId,
      deckId: i.deckId,
      minutes: i.minutes,
      srcLink: i.catalogId || i.deckId ? (i.link ?? "") : undefined,
      personal: i.personal,
    }));
  }
  return s;
}

/**
 * Dựng BTVN để lưu. KHÔNG để trường nào mang giá trị `undefined`: RTDB từ
 * chối cả lần ghi nếu gặp undefined.
 */
export function sectionsToHw(
  id: string,
  date: string,
  endDate: string,
  title: string,
  sections: Sections,
): Homework {
  const hw: Homework = {
    id,
    date,
    ...(endDate ? { endDate } : {}),
    ...(title.trim() ? { title: title.trim() } : {}),
  };
  for (const { key } of HW_CATS) {
    const items: HwItem[] = sections[key]
      .filter((d) => d.text.trim())
      .map((d) => {
        const linked = isLinked(d);
        return {
          text: d.text.trim(),
          ...(d.link.trim() ? { link: d.link.trim() } : {}),
          ...(d.desc.trim() ? { desc: d.desc.trim() } : {}),
          ...(linked && d.catalogId ? { catalogId: d.catalogId } : {}),
          ...(linked && d.deckId ? { deckId: d.deckId } : {}),
          ...(linked && d.minutes ? { minutes: d.minutes } : {}),
          ...(d.personal ? { personal: true } : {}),
        };
      });
    if (items.length > 0) hw[key] = items;
  }
  return hw;
}

/**
 * Bài đã giao trước đây cho cùng đối tượng: khoá (catalogId / deckId / link)
 * → ngày giao gần nhất. Dùng để cảnh báo giao trùng.
 */
export function usedMap(history: Homework[] | undefined, excludeId?: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const hw of history ?? []) {
    if (!hw?.id || hw.id === excludeId) continue;
    for (const { key } of HW_CATS) {
      for (const it of (hw[key] as HwItem[] | undefined) ?? []) {
        for (const k of keysOf(it)) {
          const prev = m.get(k);
          if (!prev || hw.date > prev) m.set(k, hw.date);
        }
      }
    }
  }
  return m;
}

export function keysOf(it: { catalogId?: string; deckId?: string; link?: string }): string[] {
  const out: string[] = [];
  if (it.catalogId) out.push(`c:${it.catalogId}`);
  if (it.deckId) out.push(`d:${it.deckId}`);
  if (it.link?.trim()) out.push(`l:${it.link.trim()}`);
  return out;
}

export function usedDate(m: Map<string, string>, it: { catalogId?: string; deckId?: string; link?: string }) {
  for (const k of keysOf(it)) {
    const d = m.get(k);
    if (d) return d;
  }
  return null;
}

/** Bỏ dấu tiếng Việt + chữ thường, để tìm "thi" ra "Thì". */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/** "2026-11-12" → "12/11" */
export function ddmm(day: string): string {
  return `${day.slice(8, 10)}/${day.slice(5, 7)}`;
}
