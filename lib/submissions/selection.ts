/**
 * Đổi vùng chọn của trình duyệt sang offset ký tự trên bài GỐC.
 *
 * Bài được render thành nhiều span (highlight, chữ đề xuất thêm), nên không thể
 * lấy offset trực tiếp. Ta duyệt các text node theo thứ tự và cộng dồn độ dài,
 * bỏ qua node nằm trong span `data-inserted` vì đó là chữ giáo viên chèn chứ
 * không có trong bài gốc.
 */
export function selectionRange(container: HTMLElement): { start: number; end: number } | null {
  const sel = typeof window !== "undefined" ? window.getSelection() : null;
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) return null;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let acc = 0;
  let start: number | null = null;
  let end: number | null = null;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const inserted = (node.parentElement as HTMLElement | null)?.closest("[data-inserted]");

    if (node === range.startContainer) start = inserted ? acc : acc + range.startOffset;
    if (node === range.endContainer) end = inserted ? acc : acc + range.endOffset;

    if (!inserted) acc += node.textContent?.length ?? 0;
  }

  if (start === null || end === null || end <= start) return null;
  return { start, end };
}

/**
 * Offset của con trỏ khi KHÔNG bôi đen — dùng cho thao tác chèn thêm chữ.
 * Cùng cách đếm với `selectionRange`: bỏ qua chữ giáo viên đã chèn.
 */
export function caretOffset(container: HTMLElement): number | null {
  const sel = typeof window !== "undefined" ? window.getSelection() : null;
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  if (!container.contains(range.startContainer)) return null;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let acc = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const inserted = (node.parentElement as HTMLElement | null)?.closest("[data-inserted]");
    if (node === range.startContainer) return inserted ? acc : acc + range.startOffset;
    if (!inserted) acc += node.textContent?.length ?? 0;
  }
  return null;
}

/** Điểm chèn có rơi vào GIỮA một annotation đã có không — chèn vào đó sẽ neo sai. */
export function insideAny(
  ranges: { start: number; end: number }[],
  at: number
): boolean {
  return ranges.some((r) => at > r.start && at < r.end);
}

/** Vùng chọn có đè lên annotation đã có không — neo chồng lấn sẽ hiển thị sai. */
export function overlaps(
  ranges: { start: number; end: number }[],
  start: number,
  end: number
): boolean {
  return ranges.some((r) => start < r.end && end > r.start);
}
