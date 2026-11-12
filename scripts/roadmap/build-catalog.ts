/**
 * scripts/roadmap/build-catalog.ts — sinh lib/roadmap/catalog.generated.ts
 *
 *   npm run build:catalog
 *
 * Toàn bộ việc quét registry nằm ở catalog-source.ts (dùng chung với
 * check-catalog.ts). File này chỉ ghi kết quả ra đĩa và in báo cáo.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildCatalog } from "./catalog-source";

const { items, skipped } = buildCatalog();

const dupes = items
  .map((i) => i.id)
  .filter((id, idx, arr) => arr.indexOf(id) !== idx);
if (dupes.length) {
  console.error("Trùng catalogId:", [...new Set(dupes)].join(", "));
  process.exit(1);
}

const out = `// AUTO-GENERATED bởi scripts/roadmap/build-catalog.ts — ĐỪNG SỬA TAY.
// Sửa dải điểm / thời lượng / nhãn thì sửa lib/roadmap/catalog.meta.ts rồi chạy:
//   npm run build:catalog
//
// Tổng: ${items.length} mục.

import type { CatalogItem } from "./types";

export const CATALOG_ITEMS: CatalogItem[] = ${JSON.stringify(items, null, 2)};
`;

// tsx biên dịch script này sang CJS nên không có `import.meta.dirname`.
// Chạy qua `npm run` thì cwd luôn là gốc repo.
writeFileSync(resolve(process.cwd(), "lib/roadmap/catalog.generated.ts"), out, "utf8");

const byKind = items.reduce<Record<string, number>>((acc, i) => {
  acc[i.kind] = (acc[i.kind] ?? 0) + 1;
  return acc;
}, {});

console.log(`✓ Sinh ${items.length} mục vào lib/roadmap/catalog.generated.ts`);
for (const [kind, n] of Object.entries(byKind).sort()) {
  console.log(`   ${kind.padEnd(14)} ${n}`);
}
if (skipped.length) {
  console.log(`\nBỏ qua ${skipped.length} mục chưa có dữ liệu:`);
  for (const s of skipped.slice(0, 40)) console.log(`   - ${s}`);
  if (skipped.length > 40) console.log(`   … và ${skipped.length - 40} mục nữa`);
}
