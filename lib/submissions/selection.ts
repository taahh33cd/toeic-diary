/**
 * Đổi vùng chọn của trình duyệt sang offset ký tự trên bài GỐC.
 *
 * Bài được render thành nhiều span (highlight, chữ đề xuất thêm), nên không thể
 * lấy offset trực tiếp. Ta duyệt các text node theo thứ tự và cộng dồn độ dài,
 * bỏ qua node nằm trong span `data-inserted` vì đó là chữ giáo viên chèn chứ
 * không có trong bài gốc.
 *
 * Chỉ đúng ở chế độ "Đối chiếu" và "Bài gốc": ở "Bản đã sửa" chữ thay thế không
 * đánh dấu `data-inserted` còn đoạn bị xoá biến mất khỏi DOM, nên offset lệch.
 * Nơi gọi phải không cho tạo nhận xét ở chế độ đó.
 */

/**
 * Vùng chọn hiện tại, cắt gọn vào trong `container`.
 *
 * Bấm ba lần hay Ctrl+A thường cho biên nằm ở phần tử (không phải text node),
 * hoặc tràn sang khối kế bên ngoài container; đọc nguyên văn thì không khớp
 * text node nào và thao tác thất bại mà không báo gì.
 */
function clampedRange(container: HTMLElement): Range | null {
  const sel = typeof window !== "undefined" ? window.getSelection() : null;
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  if (!range.intersectsNode(container)) return null;

  const r = range.cloneRange();
  const full = document.createRange();
  full.selectNodeContents(container);
  if (r.compareBoundaryPoints(Range.START_TO_START, full) < 0) r.setStart(full.startContainer, full.startOffset);
  if (r.compareBoundaryPoints(Range.END_TO_END, full) > 0) r.setEnd(full.endContainer, full.endOffset);
  return r;
}

/**
 * Offset trên bài gốc của một điểm biên. `node` là text node (có `offset` ký tự)
 * hoặc phần tử (`offset` là chỉ số con) — với phần tử, kết quả là tổng chữ gốc
 * nằm trước điểm đó.
 */
function sourceOffset(container: HTMLElement, node: Node, offset: number): number {
  const isText = node.nodeType === Node.TEXT_NODE;
  const probe = document.createRange();
  if (!isText) {
    probe.setStart(node, offset);
    probe.collapse(true);
  }

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let acc = 0;
  while (walker.nextNode()) {
    const t = walker.currentNode as Text;
    const inserted = (t.parentElement as HTMLElement | null)?.closest("[data-inserted]");
    if (isText) {
      if (t === node) return inserted ? acc : acc + offset;
    } else if (probe.comparePoint(t, 0) >= 0) {
      return acc; // text node này bắt đầu từ biên trở đi: chữ gốc trước biên đã đếm xong
    }
    if (!inserted) acc += t.length;
  }
  return acc;
}

export function selectionRange(container: HTMLElement): { start: number; end: number } | null {
  const r = clampedRange(container);
  if (!r || r.collapsed) return null;

  const start = sourceOffset(container, r.startContainer, r.startOffset);
  const end = sourceOffset(container, r.endContainer, r.endOffset);
  if (end <= start) return null;
  return { start, end };
}

/**
 * Offset của con trỏ khi KHÔNG bôi đen — dùng cho thao tác chèn thêm chữ.
 * Cùng cách đếm với `selectionRange`: bỏ qua chữ giáo viên đã chèn.
 */
export function caretOffset(container: HTMLElement): number | null {
  const r = clampedRange(container);
  if (!r) return null;
  return sourceOffset(container, r.startContainer, r.startOffset);
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
