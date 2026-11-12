/**
 * lib/roadmap/catalog.ts — cổng vào duy nhất của danh mục nội dung.
 *
 * Danh sách thật nằm ở catalog.generated.ts (sinh bằng `npm run build:catalog`).
 * File này chỉ bọc thêm chỉ mục tra cứu và mấy bộ lọc planner cần.
 *
 * Quy tắc bất di bất dịch: KHÔNG chỗ nào khác trong khu Lộ trình được tự ghép
 * đường dẫn bài tập. Mọi href đều phải lấy từ đây, để `npm run check:catalog`
 * còn bắt được link chết trước khi nó đến tay học viên.
 */

import { CATALOG_ITEMS } from "./catalog.generated";
import type { CatalogItem, PartNumber } from "./types";

export { CATALOG_ITEMS };

const BY_ID = new Map(CATALOG_ITEMS.map((i) => [i.id, i]));

export function getCatalogItem(id: string): CatalogItem | undefined {
  return BY_ID.get(id);
}

export function hasCatalogItem(id: string): boolean {
  return BY_ID.has(id);
}

/** Lọc những id có thật — dùng để chặn AI trả về id bịa. */
export function keepKnownIds(ids: string[]): string[] {
  return ids.filter((id) => BY_ID.has(id));
}

export type CatalogFilter = {
  /** Điểm hiện tại của học viên; chỉ lấy bài có bandMin ≤ band ≤ bandMax. */
  band?: number;
  /** Chỉ lấy bài chữa cho một trong các part này. */
  parts?: PartNumber[];
  /** Bài phải có ÍT NHẤT một trong các tag này. */
  anyTag?: string[];
  /** Bài không được có bất cứ tag nào trong đây. */
  noneTag?: string[];
  kinds?: CatalogItem["kind"][];
  /** Loại trừ các id này (đã giao rồi, hoặc học viên đã làm xong). */
  exclude?: Set<string>;
  /**
   * Những id học viên đã hoàn thành — dùng để kiểm tra `prereq`.
   * Không truyền thì bài nào có prereq đều bị loại (an toàn cho tuần đầu:
   * học viên mới chưa xong gì cả nên chỉ nhận bậc 1).
   */
  completed?: Set<string>;
  /**
   * Bỏ trần `bandMax`, chỉ giữ sàn `bandMin`.
   *
   * Cần có vì hai bộ lọc band và prereq cộng lại thì khoá chặt học viên tầm
   * giữa: người 600 điểm bị `bandMax` loại hết cấp l1/l2, mà l3 trở lên lại
   * đòi đã xong l1/l2 — kết quả là không còn bài nào để giao. Giao bài dễ hơn
   * trình độ một chút chỉ phí chút thời gian; không có bài nào để giao mới là
   * hỏng hẳn.
   */
  ignoreBandMax?: boolean;
};

export function filterCatalog(f: CatalogFilter): CatalogItem[] {
  const completed = f.completed ?? new Set<string>();
  return CATALOG_ITEMS.filter((item) => {
    if (f.exclude?.has(item.id)) return false;
    if (f.band !== undefined && item.bandMin > f.band) return false;
    if (f.band !== undefined && !f.ignoreBandMax && item.bandMax < f.band)
      return false;
    if (f.parts?.length && !item.parts.some((p) => f.parts!.includes(p)))
      return false;
    if (f.anyTag?.length && !item.tags.some((t) => f.anyTag!.includes(t)))
      return false;
    if (f.noneTag?.length && item.tags.some((t) => f.noneTag!.includes(t)))
      return false;
    if (f.kinds?.length && !f.kinds.includes(item.kind)) return false;
    if (item.prereq.length && !item.prereq.every((p) => completed.has(p)))
      return false;
    return true;
  });
}

/**
 * Sắp xếp để planner bốc lần lượt: bậc thấp trước, rồi bài ngắn trước.
 * Bậc thấp trước là có chủ ý — học viên mới cần cảm giác làm được, không cần
 * bài khó nhất của khu ngay buổi đầu.
 */
export function sortForPlanner(items: CatalogItem[]): CatalogItem[] {
  return [...items].sort(
    (a, b) => a.rank - b.rank || a.estMinutes - b.estMinutes || a.id.localeCompare(b.id),
  );
}

/** Mốc kiểm tra: một bài luyện part lẻ đúng part cần đo. */
export function checkpointForPart(
  part: PartNumber,
  exclude?: Set<string>,
): CatalogItem | undefined {
  return sortForPlanner(
    filterCatalog({ parts: [part], kinds: ["part_practice"], exclude }),
  )[0];
}

/** Mốc kiểm tra cuối tháng: một đề full test chưa làm. */
export function nextFullTest(exclude?: Set<string>): CatalogItem | undefined {
  return sortForPlanner(filterCatalog({ kinds: ["full_test"], exclude }))[0];
}
