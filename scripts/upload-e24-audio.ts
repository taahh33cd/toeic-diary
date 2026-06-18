#!/usr/bin/env tsx
/**
 * upload-e24-audio.ts
 *
 * Upload audio ETS 2024 từ folder nguồn lên Supabase Storage.
 * Cập nhật audioFiles, audioUrl, audioDuration trong parsed.json.
 * Copy file vào scripts/data/testN/audio/ để whisperx_timestamps.py dùng được.
 *
 * Usage:
 *   tsx scripts/upload-e24-audio.ts "<sourceDir>" [testNums]
 *   tsx scripts/upload-e24-audio.ts "D:\Transcript 2024" 1-10
 *   tsx scripts/upload-e24-audio.ts "D:\Transcript 2024" 2,5,7
 *   tsx scripts/upload-e24-audio.ts "D:\Transcript 2024"          # all 10 tests
 *
 * Source audio pattern:
 *   Q1-31  (single) : Test_{NN}-{QQ}.mp3        e.g. Test_01-07.mp3
 *   Q32+   (group)  : Test_{NN}-{qS}-{qE}.mp3   e.g. Test_01-32-34.mp3
 *
 * Supabase storage:
 *   Bucket : audio
 *   Path   : tests/{testSlug}/q{qStart}-{qEnd}.mp3
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import "dotenv/config";
import type { ParsedTest } from "./types";

// ─── Supabase ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const STORAGE_BUCKET = "audio";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing env vars: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAudioDuration(filePath: string): number {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return parseFloat(out) || 0;
  } catch {
    return 0;
  }
}

/** Tìm file MP3 nguồn cho 1 lesson theo pattern Test_{NN}-{QQ}.mp3 */
function findSourceFile(sourceDir: string, testNum: number, qStart: number, qEnd: number): string | null {
  const nn = String(testNum).padStart(2, "0");

  if (qStart === qEnd) {
    // Single question (Part 1, Part 2)
    const qq = String(qStart).padStart(2, "0");
    const name = `Test_${nn}-${qq}.mp3`;
    const p = path.join(sourceDir, name);
    return fs.existsSync(p) ? p : null;
  } else {
    // Group questions (Part 3, Part 4)
    const name = `Test_${nn}-${qStart}-${qEnd}.mp3`;
    const p = path.join(sourceDir, name);
    return fs.existsSync(p) ? p : null;
  }
}

/** Canonical audioFile name để lưu vào audio/ dir và audioFiles field */
function canonicalAudioFileName(testNum: number, qStart: number, qEnd: number): string {
  const nn = String(testNum).padStart(2, "0");
  if (qStart === qEnd) {
    const qq = String(qStart).padStart(2, "0");
    return `E24-T${nn}-${qq}.mp3`;
  } else {
    return `E24-T${nn}-${qStart}-${qEnd}.mp3`;
  }
}

async function uploadFile(localPath: string, storagePath: string): Promise<string> {
  const buffer = fs.readFileSync(localPath);
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, { contentType: "audio/mpeg", upsert: true });
  if (error) throw new Error(`Upload failed: ${storagePath} — ${error.message}`);
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// ─── Parse test number list ───────────────────────────────────────────────────

function parseTestNums(arg: string | undefined): number[] {
  if (!arg) return Array.from({ length: 10 }, (_, i) => i + 1);
  if (arg.includes("-")) {
    const [a, b] = arg.split("-").map(Number);
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  return arg.split(",").map(Number);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const sourceBase = process.argv[2];
  if (!sourceBase) {
    console.error('Usage: tsx scripts/upload-e24-audio.ts "<sourceDir>" [testNums]');
    console.error('  testNums: "1-10" | "1,3,5" | omit for all');
    process.exit(1);
  }

  const testNums = parseTestNums(process.argv[3]);
  const dataDir = path.join(__dirname, "data");

  await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {});

  let totalUploaded = 0;
  let totalSkipped = 0;

  for (const testNum of testNums) {
    const nn = String(testNum).padStart(2, "0");
    const transcriptDir = path.join(sourceBase, `transcripts_T${nn}`);
    const testDir = path.join(dataDir, `test${testNum}`);
    const parsedPath = path.join(testDir, "parsed.json");
    const audioDir = path.join(testDir, "audio");

    if (!fs.existsSync(transcriptDir)) {
      console.warn(`\n⚠  Folder not found: ${transcriptDir}`);
      continue;
    }
    if (!fs.existsSync(parsedPath)) {
      console.warn(`\n⚠  parsed.json not found: ${parsedPath}`);
      continue;
    }

    const rawJson = fs.readFileSync(parsedPath, "utf-8").replace(/^﻿/, "");
    const parsed: ParsedTest = JSON.parse(rawJson);

    console.log(`\n🎵  Test ${testNum} — ${parsed.testName} (${parsed.testSlug})`);

    fs.mkdirSync(audioDir, { recursive: true });

    let uploaded = 0;
    let skipped = 0;

    for (const lesson of parsed.lessons) {
      const { questionStart: qStart, questionEnd: qEnd } = lesson;
      const srcFile = findSourceFile(transcriptDir, testNum, qStart, qEnd);

      if (!srcFile) {
        const nn2 = String(testNum).padStart(2, "0");
        const expected = qStart === qEnd
          ? `Test_${nn2}-${String(qStart).padStart(2, "0")}.mp3`
          : `Test_${nn2}-${qStart}-${qEnd}.mp3`;
        console.warn(`  ⚠  Q${qStart}-${qEnd}: source not found (${expected})`);
        skipped++;
        continue;
      }

      const canonicalName = canonicalAudioFileName(testNum, qStart, qEnd);
      const localDst = path.join(audioDir, canonicalName);
      const storagePath = `tests/${parsed.testSlug}/q${qStart}-${qEnd}.mp3`;

      process.stdout.write(`  🎧  ${lesson.title} … `);

      try {
        // Copy to local audio/ dir (for WhisperX)
        fs.copyFileSync(srcFile, localDst);

        // Measure duration
        const audioDuration = getAudioDuration(localDst);

        // Upload to Supabase
        const audioUrl = await uploadFile(localDst, storagePath);

        // Update lesson in parsed
        lesson.audioFiles = [canonicalName];
        lesson.audioUrl = audioUrl;
        lesson.audioDuration = audioDuration;

        console.log(`✓  ${audioDuration.toFixed(1)}s`);
        uploaded++;
        totalUploaded++;
      } catch (err) {
        console.log(`✗  ERROR: ${(err as Error).message}`);
        skipped++;
        totalSkipped++;
      }
    }

    // Save updated parsed.json (no BOM)
    fs.writeFileSync(parsedPath, JSON.stringify(parsed, null, 2), "utf-8");

    console.log(`  → Uploaded: ${uploaded}  Skipped: ${skipped}`);
    if (uploaded > 0) {
      console.log(`  → Audio dir: ${audioDir}`);
      console.log(`  → Run WhisperX sau:`);
      console.log(`     py -3.11 scripts/whisperx_timestamps.py ${audioDir} ${parsedPath}`);
    }
  }

  console.log(`\n✅  Done! Total uploaded: ${totalUploaded}  Skipped: ${totalSkipped}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
