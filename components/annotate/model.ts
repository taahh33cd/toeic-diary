// Model + persistence cho lớp annotate (ghi chú đè lên trang luyện tập).
// Toạ độ của mọi đối tượng là toạ độ *document* (pageX/pageY), nên nét vẽ
// cuộn theo nội dung thay vì dính vào khung nhìn.

export type ToolId =
  | "off"
  | "pen"
  | "highlight"
  | "rect"
  | "ellipse"
  | "line"
  | "arrow"
  | "text"
  | "eraser";

/** Vị trí một Range trong DOM, lưu theo đường đi childNodes tính từ <body>. */
export interface RangeAnchor {
  s: number[];
  so: number;
  e: number[];
  eo: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Base {
  id: string;
  color: string;
}

export interface PenItem extends Base {
  kind: "pen";
  width: number;
  /** Toạ độ phẳng [x0, y0, x1, y1, ...] */
  pts: number[];
}

export interface ShapeItem extends Base {
  kind: "rect" | "ellipse" | "line" | "arrow";
  width: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TextItem extends Base {
  kind: "text";
  x: number;
  y: number;
  w: number;
  text: string;
}

export interface HighlightItem extends Base {
  kind: "highlight";
  /** null khi không serialize được Range — khi đó chỉ còn `rects` làm dự phòng. */
  anchor: RangeAnchor | null;
  rects: Rect[];
  text: string;
}

export type Item = PenItem | ShapeItem | TextItem | HighlightItem;

export interface AnnotDoc {
  v: 1;
  items: Item[];
  scratch: string;
}

export const EMPTY_DOC: AnnotDoc = { v: 1, items: [], scratch: "" };

export const COLORS = [
  "#EF4444",
  "#F59E0B",
  "#22C55E",
  "#3B82F6",
  "#A855F7",
  "#1A3040",
] as const;

export const WIDTHS = [2, 4, 8] as const;

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function isEmptyDoc(doc: AnnotDoc): boolean {
  return doc.items.length === 0 && doc.scratch.trim() === "";
}

// ── localStorage ─────────────────────────────────────────────────────────────

const PREFIX = "toeic-annot:v1:";

export function storageKey(pathname: string): string {
  return PREFIX + pathname;
}

export function loadDoc(key: string): AnnotDoc {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return EMPTY_DOC;
    const parsed = JSON.parse(raw) as AnnotDoc;
    if (parsed?.v !== 1 || !Array.isArray(parsed.items)) return EMPTY_DOC;
    return { v: 1, items: parsed.items, scratch: parsed.scratch ?? "" };
  } catch {
    return EMPTY_DOC;
  }
}

export function saveDoc(key: string, doc: AnnotDoc): void {
  try {
    if (isEmptyDoc(doc)) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(doc));
  } catch {
    /* quota / private mode */
  }
}

// ── Neo highlight vào text thật ──────────────────────────────────────────────

/** Đường đi childNodes từ <body> tới node. null nếu node nằm ngoài body. */
function nodePath(node: Node): number[] | null {
  const path: number[] = [];
  let n: Node | null = node;
  while (n && n !== document.body) {
    const parent: Node | null = n.parentNode;
    if (!parent) return null;
    path.unshift(Array.prototype.indexOf.call(parent.childNodes, n));
    n = parent;
  }
  return n === document.body ? path : null;
}

function resolvePath(path: number[]): Node | null {
  let n: Node = document.body;
  for (const i of path) {
    const next: Node | undefined = n.childNodes[i];
    if (!next) return null;
    n = next;
  }
  return n;
}

export function serializeRange(range: Range): RangeAnchor | null {
  const s = nodePath(range.startContainer);
  const e = nodePath(range.endContainer);
  if (!s || !e) return null;
  return { s, so: range.startOffset, e, eo: range.endOffset };
}

/**
 * Đo lại vị trí highlight từ anchor. Trả về null nếu DOM đã đổi (node biến mất
 * hoặc text không còn khớp) — caller sẽ dùng `rects` đã lưu làm dự phòng.
 */
export function measureAnchor(
  anchor: RangeAnchor,
  expectText: string,
): Rect[] | null {
  try {
    const sc = resolvePath(anchor.s);
    const ec = resolvePath(anchor.e);
    if (!sc || !ec) return null;
    const range = document.createRange();
    range.setStart(sc, anchor.so);
    range.setEnd(ec, anchor.eo);
    if (range.toString() !== expectText) return null;
    const sx = window.scrollX;
    const sy = window.scrollY;
    return Array.from(range.getClientRects())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({ x: r.left + sx, y: r.top + sy, w: r.width, h: r.height }));
  } catch {
    return null;
  }
}
