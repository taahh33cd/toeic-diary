#!/usr/bin/env tsx
/**
 * import-speaking-q8-10.ts
 *
 * Đẩy bộ đề Speaking Q8-10 (Respond to questions using information provided)
 * lên Supabase Storage rồi sinh file data cho web.
 *
 * Nguồn: mỗi bộ là 1 thư mục gồm
 *   1.mp3   — lời dẫn tình huống
 *   8/9/10.mp3 — 3 câu hỏi (câu 10 đọc 2 lần trong file)
 *   *.png   — bảng thông tin thí sinh đọc
 *
 * Usage:
 *   tsx scripts/import-speaking-q8-10.ts "<sourceDir>" [--dry]
 *
 * Supabase storage: bucket "audio", path speaking/q8-10/{slug}/{info.png,intro.mp3,q8.mp3,q9.mp3,q10.mp3}
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const STORAGE_BUCKET = "audio";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DATA_DIR = path.join(__dirname, "data", "speaking-q8-10");
const MANIFEST = path.join(DATA_DIR, "manifest.json");
const TRANSCRIPTS = path.join(DATA_DIR, "transcripts.json");
const OUT = path.join(__dirname, "..", "lib", "skills", "data", "speaking-q8-10.json");

type ManifestEntry = {
  slug: string;
  dir: string;
  category: string;
  title: string;
  /**
   * Vài thư mục nguồn bị gán lệch vai trò file (vd conference-6: 1.mp3 lại là câu 9).
   * Map "vai trò → tên file gốc (không đuôi)" để chữa mà không phải đổi tên file nguồn.
   */
  audioMap?: { intro?: string; "8"?: string; "9"?: string; "10"?: string };
};

/** transcripts.json đánh khoá theo vai trò MẶC ĐỊNH của từng file gốc. */
const TRANSCRIPT_KEY: Record<string, keyof Transcript> = { "1": "intro", "8": "q8", "9": "q9", "10": "q10" };
type Transcript = { intro?: string; q8?: string; q9?: string; q10?: string };

type OutQuestion = { n: 8 | 9 | 10; audioUrl: string; audioDuration: number; transcript: string };
type OutTest = {
  slug: string;
  category: string;
  title: string;
  imageUrl: string;
  introAudioUrl: string;
  introDuration: number;
  introTranscript: string;
  questions: OutQuestion[];
};

function duration(file: string): number {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`,
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return Math.round((parseFloat(out) || 0) * 100) / 100;
  } catch {
    return 0;
  }
}

/** Thư mục nguồn có thể lẫn bản copy "(1)" — luôn lấy file tên gốc. */
function pickPng(dir: string): string | null {
  const pngs = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".png"));
  if (!pngs.length) return null;
  pngs.sort((a, b) => Number(a.includes("(1)")) - Number(b.includes("(1)")) || a.localeCompare(b));
  return path.join(dir, pngs[0]);
}

async function upload(localPath: string, storagePath: string, contentType: string): Promise<string> {
  const buffer = fs.readFileSync(localPath);
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true });
  if (error) throw new Error(`${storagePath} — ${error.message}`);
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

async function main() {
  const sourceBase = process.argv[2];
  const dry = process.argv.includes("--dry");
  if (!sourceBase) {
    console.error('Usage: tsx scripts/import-speaking-q8-10.ts "<sourceDir>" [--dry]');
    process.exit(1);
  }

  const manifest: ManifestEntry[] = JSON.parse(fs.readFileSync(MANIFEST, "utf-8"));
  const transcripts: Record<string, Transcript> = fs.existsSync(TRANSCRIPTS)
    ? JSON.parse(fs.readFileSync(TRANSCRIPTS, "utf-8"))
    : {};

  if (!dry) await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {});

  const out: OutTest[] = [];
  let missingTranscript = 0;

  for (const entry of manifest) {
    const dir = path.join(sourceBase, entry.dir.replace(/\//g, path.sep));
    if (!fs.existsSync(dir)) {
      console.warn(`⚠  Không thấy thư mục: ${entry.dir}`);
      continue;
    }
    const png = pickPng(dir);
    if (!png) {
      console.warn(`⚠  ${entry.slug}: thiếu ảnh bảng thông tin`);
      continue;
    }

    const tr = transcripts[entry.dir] ?? {};
    const srcFor = (role: "intro" | "8" | "9" | "10") =>
      entry.audioMap?.[role] ?? (role === "intro" ? "1" : role);
    /** Transcript đi theo FILE, không theo vai trò — nên phải tra qua audioMap. */
    const textFor = (role: "intro" | "8" | "9" | "10") => (tr[TRANSCRIPT_KEY[srcFor(role)]] ?? "").trim();
    process.stdout.write(`  ${entry.slug.padEnd(14)} ${entry.title.slice(0, 46).padEnd(48)}`);

    const base = `speaking/q8-10/${entry.slug}`;
    const imageUrl = dry
      ? `${base}/info.png`
      : await upload(png, `${base}/info.png`, "image/png");

    const intro = path.join(dir, `${srcFor("intro")}.mp3`);
    const introUrl = dry ? `${base}/intro.mp3` : await upload(intro, `${base}/intro.mp3`, "audio/mpeg");

    const questions: OutQuestion[] = [];
    for (const n of [8, 9, 10] as const) {
      const file = path.join(dir, `${srcFor(String(n) as "8" | "9" | "10")}.mp3`);
      const url = dry ? `${base}/q${n}.mp3` : await upload(file, `${base}/q${n}.mp3`, "audio/mpeg");
      const transcript = textFor(String(n) as "8" | "9" | "10");
      if (!transcript) missingTranscript++;
      questions.push({ n, audioUrl: url, audioDuration: duration(file), transcript });
    }

    out.push({
      slug: entry.slug,
      category: entry.category,
      title: entry.title,
      imageUrl,
      introAudioUrl: introUrl,
      introDuration: duration(intro),
      introTranscript: textFor("intro"),
      questions,
    });
    console.log("✓");
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf-8");

  console.log(`\n✅  ${out.length}/${manifest.length} bộ đề → ${path.relative(process.cwd(), OUT)}`);
  if (missingTranscript) console.log(`⚠  ${missingTranscript} câu hỏi chưa có transcript`);
  if (dry) console.log("(dry run — chưa upload gì lên Supabase)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
