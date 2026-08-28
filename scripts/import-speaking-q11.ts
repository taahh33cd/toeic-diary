#!/usr/bin/env tsx
/**
 * import-speaking-q11.ts
 *
 * Đẩy bộ đề Speaking Q11 (Express an opinion) lên Supabase Storage
 * rồi sinh file data cho web.
 *
 * Nguồn: mỗi bộ là 1 thư mục gồm
 *   Transcript.txt                  — câu hỏi (thi thật hiện cả chữ lẫn đọc lên)
 *   "Generated Audio ....wav"       — giọng đọc câu hỏi
 *
 * File nguồn là WAV 384 kbps (~500 KB/câu). Script nén sang MP3 64 kbps mono
 * trước khi upload — giọng đọc một người, chất lượng không đổi mà nhẹ hơn ~8 lần.
 *
 * Usage:
 *   tsx scripts/import-speaking-q11.ts "<sourceDir>" [--dry]
 *
 * Supabase storage: bucket "audio", path speaking/q11/{slug}.mp3
 */

import * as fs from "fs";
import * as os from "os";
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

const MANIFEST = path.join(__dirname, "data", "speaking-q11", "manifest.json");
const OUT = path.join(__dirname, "..", "lib", "skills", "data", "speaking-q11.json");

type ManifestEntry = { slug: string; dir: string; form: string; topicVi: string };
type OutTest = {
  slug: string;
  form: string;
  index: number;
  topicVi: string;
  question: string;
  audioUrl: string;
  audioDuration: number;
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

function toMp3(src: string, dest: string) {
  execSync(`ffmpeg -y -v error -i "${src}" -ac 1 -ar 24000 -b:a 64k "${dest}"`, { stdio: ["ignore", "ignore", "pipe"] });
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
    console.error('Usage: tsx scripts/import-speaking-q11.ts "<sourceDir>" [--dry]');
    process.exit(1);
  }

  const manifest: ManifestEntry[] = JSON.parse(fs.readFileSync(MANIFEST, "utf-8"));
  if (!dry) await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {});

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "q11-"));
  const perForm: Record<string, number> = {};
  const out: OutTest[] = [];

  for (const entry of manifest) {
    const dir = path.join(sourceBase, entry.dir);
    if (!fs.existsSync(dir)) {
      console.error(`  ✗ ${entry.slug} — không thấy thư mục ${dir}`);
      continue;
    }

    const question = fs.readFileSync(path.join(dir, "Transcript.txt"), "utf-8").replace(/\r/g, "").trim().replace(/\s*\n\s*/g, " ");
    const wav = fs.readdirSync(dir).find((f) => f.toLowerCase().endsWith(".wav"));
    if (!wav) {
      console.error(`  ✗ ${entry.slug} — không có file .wav`);
      continue;
    }

    const mp3 = path.join(tmp, `${entry.slug}.mp3`);
    toMp3(path.join(dir, wav), mp3);

    const storagePath = `speaking/q11/${entry.slug}.mp3`;
    const url = dry
      ? `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`
      : await upload(mp3, storagePath, "audio/mpeg");

    perForm[entry.form] = (perForm[entry.form] ?? 0) + 1;
    out.push({
      slug: entry.slug,
      form: entry.form,
      index: perForm[entry.form],
      topicVi: entry.topicVi,
      question,
      audioUrl: url,
      audioDuration: duration(mp3),
    });
    console.log(`  ✓ ${entry.slug.padEnd(11)} ${(fs.statSync(mp3).size / 1024).toFixed(0).padStart(4)} KB  ${entry.topicVi}`);
  }

  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf-8");
  console.log(`\n${out.length} bộ đề → ${path.relative(process.cwd(), OUT)}${dry ? " (dry-run, chưa upload)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
