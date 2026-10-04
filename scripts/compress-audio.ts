#!/usr/bin/env tsx
/**
 * compress-audio.ts
 *
 * Nén lại audio full-test rồi upload đè lên đúng path cũ trên Supabase Storage.
 * Nguồn gốc 128kbps stereo 44.1kHz → 64kbps mono 32kHz (strip ID3/ảnh bìa).
 * Vì ghi đè đúng path cũ nên KHÔNG phải sửa file data nào.
 *
 * Usage:
 *   tsx scripts/compress-audio.ts --dry-run          # chỉ ước lượng, không upload
 *   tsx scripts/compress-audio.ts                    # nén + upload tất cả
 *   tsx scripts/compress-audio.ts --bitrate 48k      # nén mạnh hơn
 *   tsx scripts/compress-audio.ts --year 2026        # chỉ 1 bộ đề
 *   tsx scripts/compress-audio.ts --tests 1,2,3
 *
 * Map path: lib/full-tests/data/est-{year}-test-{n}.json
 *   audioBase  = .../audio/tests/ets-{year}-test-{n}
 *   groups[].audio = q{s}-{e}.mp3
 *   → nguồn local: scripts/data/test{n}/audio/E{yy}-T{nn}-{...}.mp3
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFileSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const STORAGE_BUCKET = "audio";

// ─── Args ─────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const flag = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const dryRun = argv.includes("--dry-run");
const bitrate = flag("bitrate") ?? "64k";
const sampleRate = bitrate === "48k" ? "24000" : "32000";
const yearFilter = flag("year");
const testFilter = flag("tests")?.split(",").map(Number);

// ─── Map storage path → file nguồn local ──────────────────────────────────────

type Job = { storagePath: string; source: string };

function collectJobs(): Job[] {
  const dataDir = path.join(__dirname, "..", "lib", "full-tests", "data");
  const jobs: Job[] = [];

  for (const file of fs.readdirSync(dataDir).sort()) {
    const m = /^est-(\d{4})-test-(\d+)\.json$/.exec(file);
    if (!m) continue;
    const [, year, testNum] = m;
    if (yearFilter && year !== yearFilter) continue;
    if (testFilter && !testFilter.includes(Number(testNum))) continue;

    const parsed = JSON.parse(
      fs.readFileSync(path.join(dataDir, file), "utf-8").replace(/^﻿/, ""),
    ) as { audioBase?: string; groups?: { audio?: string }[] };

    const slug = parsed.audioBase?.split("/").pop();
    if (!slug) continue;

    const tn = Number(testNum);
    const nn = String(tn).padStart(2, "0");
    const prefix = `E${year.slice(2)}`;

    for (const group of parsed.groups ?? []) {
      const audio = group.audio;
      if (!audio) continue;
      const q = /^q(\d+)-(\d+)\.mp3$/.exec(audio);
      if (!q) continue;
      const [, qs, qe] = q;

      const localName =
        qs === qe
          ? `${prefix}-T${nn}-${String(Number(qs)).padStart(2, "0")}.mp3`
          : `${prefix}-T${nn}-${qs}-${qe}.mp3`;
      const source = path.join(__dirname, "data", `test${tn}`, "audio", localName);

      if (!fs.existsSync(source)) {
        console.warn(`⚠  Thiếu nguồn: ${source}`);
        continue;
      }
      jobs.push({ storagePath: `tests/${slug}/${audio}`, source });
    }
  }
  return jobs;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!dryRun && (!SUPABASE_URL || !SUPABASE_KEY)) {
    console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const jobs = collectJobs();
  console.log(`\n🎚  ${jobs.length} file — ${bitrate} mono ${sampleRate}Hz${dryRun ? "  (dry-run)" : ""}\n`);

  const supabase = dryRun ? null : createClient(SUPABASE_URL, SUPABASE_KEY);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "toeic-audio-"));

  let before = 0;
  let after = 0;
  let failed = 0;

  for (const [i, job] of jobs.entries()) {
    const out = path.join(tmpDir, `${i}.mp3`);
    const srcSize = fs.statSync(job.source).size;
    before += srcSize;

    try {
      // -map 0:a:0 + -map_metadata -1 → bỏ ảnh bìa/ID3 đang nhúng trong file gốc
      execFileSync("ffmpeg", [
        "-v", "error", "-y",
        "-i", job.source,
        "-map", "0:a:0",
        "-map_metadata", "-1",
        "-ac", "1",
        "-ar", sampleRate,
        "-b:a", bitrate,
        out,
      ]);

      const newSize = fs.statSync(out).size;
      after += newSize;

      if (supabase) {
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(job.storagePath, fs.readFileSync(out), {
            contentType: "audio/mpeg",
            upsert: true,
          });
        if (error) throw new Error(error.message);
      }

      const pct = ((newSize / srcSize) * 100).toFixed(0);
      console.log(`  ✓  ${job.storagePath}  ${(srcSize / 1048576).toFixed(1)}MB → ${(newSize / 1048576).toFixed(1)}MB (${pct}%)`);
    } catch (err) {
      failed++;
      console.log(`  ✗  ${job.storagePath} — ${(err as Error).message}`);
    } finally {
      fs.rmSync(out, { force: true });
    }
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });

  const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;
  console.log(`\n📦  ${mb(before)} → ${mb(after)}  (tiết kiệm ${mb(before - after)})`);
  if (failed) console.log(`⚠  ${failed} file lỗi`);
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
