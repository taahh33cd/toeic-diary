#!/usr/bin/env tsx
/**
 * import-speaking-q5-7.ts
 *
 * Đẩy bộ đề Speaking Q5-7 (Respond to questions) lên Supabase Storage
 * rồi sinh file data cho web.
 *
 * Nguồn: mỗi bộ là 1 thư mục gồm
 *   transcript.txt — đoạn tình huống + 3 câu hỏi
 *   5*.mp3 6*.mp3 7*.mp3 — audio ba câu hỏi (file câu 5 đọc kèm lời dẫn tình huống)
 *
 * Usage:
 *   tsx scripts/import-speaking-q5-7.ts "<sourceDir>" [--dry]
 *
 * Supabase storage: bucket "audio", path speaking/q5-7/{slug}/q{5,6,7}.mp3
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

const MANIFEST = path.join(__dirname, "data", "speaking-q5-7", "manifest.json");
const OUT = path.join(__dirname, "..", "lib", "skills", "data", "speaking-q5-7.json");

type ManifestEntry = {
  slug: string;
  dir: string;
  category: string;
  topic: string;
  topicVi: string;
};

type OutQuestion = { n: 5 | 6 | 7; audioUrl: string; audioDuration: number; transcript: string };
type OutTest = {
  slug: string;
  category: string;
  index: number;
  topic: string;
  topicVi: string;
  situation: string;
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

/**
 * transcript.txt có hai kiểu: có tiền tố "Question 5:" hoặc chỉ ba dòng trần.
 * Dòng đầu (đoạn đầu) luôn là lời dẫn tình huống.
 */
function parseTranscript(raw: string): { situation: string; questions: string[] } {
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 4) throw new Error(`transcript chỉ có ${lines.length} dòng`);

  // Lời dẫn có thể bị xuống dòng giữa chừng — gộp mọi dòng trước câu hỏi đầu tiên.
  const firstQ = lines.findIndex((l, i) => i > 0 && (/^Question\s*5\s*:/i.test(l) || lines.length - i === 3));
  const cut = firstQ > 0 ? firstQ : 1;

  const situation = lines.slice(0, cut).join(" ");
  const questions = lines.slice(cut).map((l) => l.replace(/^Question\s*\d+\s*:\s*/i, "").trim());
  if (questions.length !== 3) throw new Error(`tách được ${questions.length} câu hỏi thay vì 3`);
  return { situation, questions };
}

/** File nguồn có bản copy "5 (2).mp3" — lấy file nào bắt đầu bằng số câu. */
function pickAudio(dir: string, n: number): string {
  const hit = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".mp3") && new RegExp(`^${n}\\b`).test(f))
    .sort();
  if (!hit.length) throw new Error(`không tìm thấy audio câu ${n} trong ${dir}`);
  return path.join(dir, hit[0]);
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
    console.error('Usage: tsx scripts/import-speaking-q5-7.ts "<sourceDir>" [--dry]');
    process.exit(1);
  }

  const manifest: ManifestEntry[] = JSON.parse(fs.readFileSync(MANIFEST, "utf-8"));
  if (!dry) await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {});

  const perCategory: Record<string, number> = {};
  const out: OutTest[] = [];

  for (const entry of manifest) {
    const dir = path.join(sourceBase, entry.dir);
    if (!fs.existsSync(dir)) {
      console.error(`  ✗ ${entry.slug} — không thấy thư mục ${dir}`);
      continue;
    }

    const { situation, questions } = parseTranscript(fs.readFileSync(path.join(dir, "transcript.txt"), "utf-8"));
    perCategory[entry.category] = (perCategory[entry.category] ?? 0) + 1;

    const qs: OutQuestion[] = [];
    for (const n of [5, 6, 7] as const) {
      const file = pickAudio(dir, n);
      const storagePath = `speaking/q5-7/${entry.slug}/q${n}.mp3`;
      const url = dry
        ? `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`
        : await upload(file, storagePath, "audio/mpeg");
      qs.push({ n, audioUrl: url, audioDuration: duration(file), transcript: questions[n - 5] });
    }

    out.push({
      slug: entry.slug,
      category: entry.category,
      index: perCategory[entry.category],
      topic: entry.topic,
      topicVi: entry.topicVi,
      situation,
      questions: qs,
    });
    console.log(`  ✓ ${entry.slug.padEnd(12)} ${entry.topic}`);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf-8");
  console.log(`\n${out.length} bộ đề → ${path.relative(process.cwd(), OUT)}${dry ? " (dry-run, chưa upload)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
