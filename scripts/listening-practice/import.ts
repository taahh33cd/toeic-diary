#!/usr/bin/env tsx
/**
 * Import bộ đề luyện nghe Part 1 + Part 2 (folder "CA") vào /skills/listening.
 *
 * Usage:
 *   tsx scripts/listening-practice/import.ts              # cả 9 bộ
 *   tsx scripts/listening-practice/import.ts 3            # riêng bộ CA 3
 *   tsx scripts/listening-practice/import.ts --src "D:/.../CA"
 *   tsx scripts/listening-practice/import.ts --no-upload  # chỉ sinh JSON, không upload
 *
 * Nguồn mỗi bộ: 1 file data.js|data.json (31 câu) + 6 png + 31 mp3.
 * Đường dẫn image/audio trong data KHÔNG khớp cây thư mục thật ở vài bộ
 * (CA 2 ghi "Audio/Part 1/1.png" nhưng file nằm ở "Audio/1.png", CA 9 đặt tên
 * "15_01.mp3") ⇒ bỏ path gốc, map theo SỐ THỨ TỰ câu lấy từ tên file.
 *
 * Storage: bucket 'audio' (bucket public duy nhất), prefix
 *   listening-practice/test-<n>/q07.mp3 · listening-practice/test-<n>/p1-3.png
 *
 * Ra: lib/listening-practice/data/test-<n>.json + catalog.json
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "audio";
const PREFIX = "listening-practice";
const DEFAULT_SRC = "D:/Compressed/CA-20260728T152759Z-1-001/CA";
const OUT_DIR = path.join(process.cwd(), "lib", "listening-practice", "data");
const TEST_COUNT = 9;

// ── Kiểu dữ liệu ra (khớp lib/listening-practice/types.ts) ───────────────────

interface Question {
  number: number;
  part: 1 | 2;
  /** Script câu hỏi — chỉ hiện khi xem lại, không hiện lúc làm bài */
  prompt: string;
  options: { id: string; text: string }[];
  answer: string;
  /** null = thiếu file audio gốc ⇒ câu bị khoá */
  audio: string | null;
  image: string | null;
  /** Kích thước gốc của ảnh — UI dùng để không phóng to quá mức (ảnh nguồn 175–790px) */
  imageWidth?: number;
  imageHeight?: number;
}

interface Test {
  slug: string;
  testNumber: number;
  title: string;
  /** Nhãn folder gốc, vd "4. Actual Test 4" — để đối chiếu về sau */
  source: string;
  questions: Question[];
}

// ── Đọc nguồn ────────────────────────────────────────────────────────────────

interface RawItem {
  id: string;
  part: number;
  image: string;
  audio: string;
  question: string;
  options: string[];
  correct_answer: string;
}

function readData(dir: string): RawItem[] {
  for (const name of ["data.json", "data.js"]) {
    const p = path.join(dir, name);
    if (!fs.existsSync(p)) continue;
    let s = fs.readFileSync(p, "utf8").trim();
    s = s.replace(/^const\s+\w+\s*=\s*/, "").replace(/;\s*$/, "");
    return JSON.parse(s) as RawItem[];
  }
  throw new Error(`${dir}: không thấy data.json / data.js`);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Số thứ tự lấy từ cụm chữ số CUỐI trong tên file: "01"→1, "15_07"→7 */
function trailingNumber(file: string): number | null {
  const stem = path.basename(file, path.extname(file));
  const m = stem.match(/(\d+)\s*$/);
  return m ? Number(m[1]) : null;
}

/** Map số câu → đường dẫn file, theo đuôi mở rộng */
function indexByNumber(files: string[], ext: string): Map<number, string> {
  const map = new Map<number, string>();
  for (const f of files) {
    if (path.extname(f).toLowerCase() !== ext) continue;
    const n = trailingNumber(f);
    if (n == null) continue;
    if (map.has(n)) throw new Error(`trùng số ${n}: ${map.get(n)} vs ${f}`);
    map.set(n, f);
  }
  return map;
}

/** Đọc width/height từ IHDR của PNG */
function pngSize(file: string): { width: number; height: number } {
  const fd = fs.openSync(file, "r");
  const buf = Buffer.alloc(24);
  fs.readSync(fd, buf, 0, 24, 0);
  fs.closeSync(fd);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** "A. He's hanging up a shirt." → { id: "A", text: "He's hanging up a shirt." } */
function parseOption(raw: string, fallbackId: string) {
  const m = raw.match(/^\s*([A-D])[.)]\s*([\s\S]*)$/);
  return m ? { id: m[1], text: m[2].trim() } : { id: fallbackId, text: raw.trim() };
}

// ── Upload ───────────────────────────────────────────────────────────────────

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

async function upload(local: string, objectPath: string, contentType: string): Promise<string> {
  if (!supabase) throw new Error("thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  const body = fs.readFileSync(local);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, body, { contentType, upsert: true });
  if (error) throw new Error(`${objectPath}: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

function publicUrl(objectPath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function buildTest(src: string, n: number, doUpload: boolean): Promise<Test> {
  const dir = path.join(src, `bộ CA ${n}`);
  if (!fs.existsSync(dir)) throw new Error(`không thấy ${dir}`);

  const raw = readData(dir);
  const files = walk(dir);
  const mp3 = indexByNumber(files, ".mp3");
  const png = indexByNumber(files, ".png");

  // Nhãn nguồn = tên folder con chứa media (nếu có), vd "4. Actual Test 4"
  const sub = fs.readdirSync(dir, { withFileTypes: true }).find((e) => e.isDirectory());
  const source = sub ? sub.name : `bộ CA ${n}`;

  const questions: Question[] = [];
  for (const item of raw) {
    const number = Number(item.id.replace(/\D/g, ""));
    const part = item.part === 1 ? 1 : 2;

    const audioLocal = mp3.get(number) ?? null;
    const imageLocal = part === 1 ? png.get(number) ?? null : null;

    let audioUrl: string | null = null;
    if (audioLocal) {
      const obj = `${PREFIX}/test-${n}/q${String(number).padStart(2, "0")}.mp3`;
      audioUrl = doUpload ? await upload(audioLocal, obj, "audio/mpeg") : publicUrl(obj);
    }

    let imageUrl: string | null = null;
    let imageSize: { width: number; height: number } | null = null;
    if (imageLocal) {
      const obj = `${PREFIX}/test-${n}/p1-${number}.png`;
      imageUrl = doUpload ? await upload(imageLocal, obj, "image/png") : publicUrl(obj);
      imageSize = pngSize(imageLocal);
    }

    questions.push({
      number,
      part,
      prompt: item.question.trim(),
      options: item.options.map((o, i) => parseOption(o, "ABCD"[i])),
      answer: item.correct_answer.trim().toUpperCase(),
      audio: audioUrl,
      image: imageUrl,
      ...(imageSize ? { imageWidth: imageSize.width, imageHeight: imageSize.height } : {}),
    });
  }

  questions.sort((a, b) => a.number - b.number);
  return { slug: `test-${n}`, testNumber: n, title: `Test ${n}`, source, questions };
}

async function main() {
  const args = process.argv.slice(2);
  const srcIdx = args.indexOf("--src");
  const src = srcIdx >= 0 ? args[srcIdx + 1] : DEFAULT_SRC;
  const doUpload = !args.includes("--no-upload");
  const only = args.filter((a) => /^\d+$/.test(a)).map(Number);
  const nums = only.length ? only : Array.from({ length: TEST_COUNT }, (_, i) => i + 1);

  if (doUpload && !supabase) {
    console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const catalog: {
    tests: {
      slug: string;
      testNumber: number;
      title: string;
      source: string;
      part1: number;
      part2: number;
      missingAudio: number[];
    }[];
  } = { tests: [] };

  // Giữ nguyên các test không build lần này
  const catalogFile = path.join(OUT_DIR, "catalog.json");
  const prev = fs.existsSync(catalogFile)
    ? (JSON.parse(fs.readFileSync(catalogFile, "utf8")) as typeof catalog)
    : { tests: [] };

  for (const n of nums) {
    const test = await buildTest(src, n, doUpload);
    fs.writeFileSync(
      path.join(OUT_DIR, `${test.slug}.json`),
      JSON.stringify(test, null, 1),
      "utf8",
    );
    const missing = test.questions.filter((q) => !q.audio).map((q) => q.number);
    catalog.tests.push({
      slug: test.slug,
      testNumber: n,
      title: test.title,
      source: test.source,
      part1: test.questions.filter((q) => q.part === 1).length,
      part2: test.questions.filter((q) => q.part === 2).length,
      missingAudio: missing,
    });
    console.log(
      `✓ ${test.title} (${test.source}) · ${test.questions.length} câu` +
        (missing.length ? ` · ⚠ thiếu audio câu ${missing.join(", ")}` : ""),
    );
  }

  for (const t of prev.tests) {
    if (!catalog.tests.some((x) => x.testNumber === t.testNumber)) catalog.tests.push(t);
  }
  catalog.tests.sort((a, b) => a.testNumber - b.testNumber);
  fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 1), "utf8");

  console.log(`\n✓ ${catalog.tests.length} test → ${OUT_DIR}`);
  if (!doUpload) console.log("  (--no-upload: URL sinh sẵn, chưa upload file lên Storage)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
