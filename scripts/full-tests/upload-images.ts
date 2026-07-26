#!/usr/bin/env tsx
/**
 * Upload ảnh Part 1 + graphic Part 3/4 của EST 2026 lên Supabase Storage.
 *
 * Usage:
 *   tsx scripts/full-tests/upload-images.ts            # cả 10 đề
 *   tsx scripts/full-tests/upload-images.ts 1          # riêng đề 1
 *   tsx scripts/full-tests/upload-images.ts --src "D:/.../ETS 2026"
 *
 * Dùng bucket 'audio' (bucket public duy nhất của project) với prefix riêng:
 *   full-tests/est-2026/test-1/1.png
 *
 * Ra: lib/full-tests/data/images.json  — map "testN/<stem>" → public URL,
 *     build_est2026.py đọc file này để gắn URL vào JSON đề.
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "audio";
const PREFIX = "full-tests/est-2026";
const DEFAULT_SRC = "D:/Compressed/ETS 2026-20260726T081737Z-1-001/ETS 2026";
const MAP_FILE = path.join(process.cwd(), "lib", "full-tests", "data", "images.json");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function lcDir(src: string, n: number): string {
  for (const name of [`test ${n}`, `test${n}`]) {
    const p = path.join(src, "ETS 2026 LC", name);
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`không thấy folder LC của đề ${n}`);
}

async function main() {
  const args = process.argv.slice(2);
  const srcIdx = args.indexOf("--src");
  const src = srcIdx >= 0 ? args[srcIdx + 1] : DEFAULT_SRC;
  const only = args.filter((a) => /^\d+$/.test(a)).map(Number);
  const tests = only.length ? only : Array.from({ length: 10 }, (_, i) => i + 1);

  const map: Record<string, string> = fs.existsSync(MAP_FILE)
    ? JSON.parse(fs.readFileSync(MAP_FILE, "utf8"))
    : {};

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const n of tests) {
    const dir = path.join(lcDir(src, n), "ảnh");
    if (!fs.existsSync(dir)) {
      console.warn(`⚠ đề ${n}: không có folder ảnh`);
      continue;
    }
    const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".png")).sort();
    for (const f of files) {
      const stem = path.basename(f, path.extname(f));
      const key = `test${n}/${stem}`;
      const objectPath = `${PREFIX}/test-${n}/${f}`;

      if (map[key]) {
        skipped++;
        continue;
      }

      const body = fs.readFileSync(path.join(dir, f));
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, body, { contentType: "image/png", upsert: true });

      if (error) {
        console.error(`✗ ${objectPath}: ${error.message}`);
        failed++;
        continue;
      }
      map[key] = supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
      uploaded++;
    }
    console.log(`đề ${n}: ${files.length} ảnh`);
  }

  fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 1), "utf8");
  console.log(`\n✓ upload ${uploaded} · bỏ qua ${skipped} (đã có) · lỗi ${failed}`);
  console.log(`  map: ${MAP_FILE} (${Object.keys(map).length} ảnh)`);
  console.log(`  chạy lại: python scripts/full-tests/build_est2026.py --all`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
