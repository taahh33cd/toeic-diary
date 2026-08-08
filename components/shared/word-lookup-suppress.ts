// Cờ tạm khoá popup tra nghĩa. Lớp annotate bật cờ này khi đang cầm công cụ,
// vì cả hai cùng lắng nghe vùng bôi đen của trang.
// Tách khỏi WordLookupProvider.tsx: file đó là client-entry nên không import
// chéo được các export không phải component.

let suppressed = false;
const listeners = new Set<() => void>();

export function setWordLookupSuppressed(v: boolean): void {
  if (suppressed === v) return;
  suppressed = v;
  listeners.forEach((l) => l());
}

export function subscribeWordLookupSuppressed(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getWordLookupSuppressed(): boolean {
  return suppressed;
}
