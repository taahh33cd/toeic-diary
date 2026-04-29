#!/usr/bin/env tsx
/**
 * Concatenate MP3s (per lesson) and upload to Supabase Storage.
 * Updates audioUrl + audioDuration in parsed.json.
 *
 * Usage:
 *   tsx scripts/upload-audio.ts <testDir>
 *   tsx scripts/upload-audio.ts scripts/data/test1
 *
 * Requires:
 *   - scripts/data/test1/parsed.json  (from parse-transcripts.ts)
 *   - scripts/data/test1/audio/*.mp3
 *   - ffmpeg installed and on PATH (for concatenation)
 *   - .env with NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Storage layout:
 *   Bucket : audio
 *   Path   : tests/ets-2026-test-1/q41-43.mp3
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import type { LessonDef, ParsedTest } from "./types";

// ─── Supabase ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use service role key for storage uploads (has write permission)
// Falls back to anon key but bucket must already be set to public with insert policy
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const STORAGE_BUCKET = "audio";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing env vars. Add to .env:");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=... (preferred, from Supabase dashboard → Settings → API)");
  console.error("  or NEXT_PUBLIC_SUPABASE_ANON_KEY=... (bucket must allow public uploads)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Audio helpers ────────────────────────────────────────────────────────────

function ffmpegAvailable(): boolean {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getAudioDuration(filePath: string): number {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return parseFloat(out) || 0;
  } catch {
    return 0; // ffprobe not available — duration will be 0
  }
}

/**
 * Concatenate multiple MP3 files into one using ffmpeg concat demuxer.
 * Returns path to the merged file.
 */
function concatMp3s(inputPaths: string[], outputPath: string): void {
  // Write ffmpeg concat list file
  const listPath = outputPath + ".txt";
  const listContent = inputPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  fs.writeFileSync(listPath, listContent, "utf-8");

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`,
    { stdio: "pipe" },
  );

  fs.unlinkSync(listPath);
}

// ─── Upload ───────────────────────────────────────────────────────────────────

async function uploadFile(
  localPath: string,
  storagePath: string,
): Promise<string> {
  const buffer = fs.readFileSync(localPath);

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (error) throw new Error(`Upload failed for ${storagePath}: ${error.message}`);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// ─── Process one lesson ───────────────────────────────────────────────────────

async function processLesson(
  lesson: LessonDef,
  audioDir: string,
  testSlug: string,
  tmpDir: string,
  hasFfmpeg: boolean,
): Promise<{ audioUrl: string; audioDuration: number }> {
  const existingFiles = lesson.audioFiles.filter((f) =>
    fs.existsSync(path.join(audioDir, f)),
  );

  if (existingFiles.length === 0) {
    console.warn(`    ⚠  No audio files found for ${lesson.title}`);
    return { audioUrl: "", audioDuration: 0 };
  }

  const inputPaths = existingFiles.map((f) => path.join(audioDir, f));
  const outputFilename = `q${lesson.questionStart}-${lesson.questionEnd}.mp3`;
  const storagePath = `tests/${testSlug}/${outputFilename}`;

  let finalPath: string;

  if (existingFiles.length === 1 || !hasFfmpeg) {
    // Single file or no ffmpeg — upload the first file directly
    if (existingFiles.length > 1) {
      console.warn(
        `    ⚠  ffmpeg not found — uploading only ${existingFiles[0]} (install ffmpeg to concatenate)`,
      );
    }
    finalPath = inputPaths[0];
  } else {
    // Concatenate multiple MP3s
    const mergedPath = path.join(tmpDir, outputFilename);
    concatMp3s(inputPaths, mergedPath);
    finalPath = mergedPath;
  }

  const audioDuration = getAudioDuration(finalPath);
  const audioUrl = await uploadFile(finalPath, storagePath);

  // Clean up temp file if we created one
  if (finalPath !== inputPaths[0] && fs.existsSync(finalPath)) {
    fs.unlinkSync(finalPath);
  }

  return { audioUrl, audioDuration };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const testDir = process.argv[2];

  if (!testDir) {
    console.error("Usage: tsx scripts/upload-audio.ts <testDir>");
    console.error("Example: tsx scripts/upload-audio.ts scripts/data/test1");
    process.exit(1);
  }

  const parsedPath = path.join(testDir, "parsed.json");
  if (!fs.existsSync(parsedPath)) {
    console.error(`parsed.json not found: ${parsedPath}`);
    console.error("Run parse-transcripts.ts first.");
    process.exit(1);
  }

  const audioDir = path.join(testDir, "audio");
  if (!fs.existsSync(audioDir)) {
    console.error(`Audio directory not found: ${audioDir}`);
    console.error(`Create it and place .mp3 files inside.`);
    process.exit(1);
  }

  const parsed: ParsedTest = JSON.parse(fs.readFileSync(parsedPath, "utf-8"));
  const hasFfmpeg = ffmpegAvailable();

  console.log(`\n🎵  Uploading audio for ${parsed.testName}`);
  console.log(`    ffmpeg : ${hasFfmpeg ? "✓ available" : "✗ not found (no concatenation)"}`);
  console.log(`    Bucket : ${STORAGE_BUCKET}\n`);

  // Ensure Supabase bucket exists (no-op if already exists)
  await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {});

  // Temp dir for merged files
  const tmpDir = path.join(testDir, ".tmp-audio");
  fs.mkdirSync(tmpDir, { recursive: true });

  let uploaded = 0;
  let skipped = 0;

  for (const lesson of parsed.lessons) {
    process.stdout.write(`  🎧  ${lesson.title} … `);

    try {
      const { audioUrl, audioDuration } = await processLesson(
        lesson,
        audioDir,
        parsed.testSlug,
        tmpDir,
        hasFfmpeg,
      );

      if (audioUrl) {
        lesson.audioUrl = audioUrl;
        lesson.audioDuration = audioDuration;
        console.log(`✓  (${audioDuration.toFixed(1)}s)`);
        uploaded++;
      } else {
        console.log(`–  skipped`);
        skipped++;
      }
    } catch (err) {
      console.log(`✗  ERROR`);
      console.error(`    ${(err as Error).message}`);
      skipped++;
    }
  }

  // Clean up tmp dir
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // Save updated parsed.json
  fs.writeFileSync(parsedPath, JSON.stringify(parsed, null, 2), "utf-8");

  console.log(`\n✅  Done!`);
  console.log(`    Uploaded : ${uploaded}`);
  console.log(`    Skipped  : ${skipped}`);
  console.log(`    Updated  : ${parsedPath}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
