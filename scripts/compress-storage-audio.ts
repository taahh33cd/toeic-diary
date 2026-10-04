#!/usr/bin/env tsx
/**
 * compress-storage-audio.ts
 *
 * Nén audio đang nằm sẵn trên Supabase Storage (không cần nguồn local):
 * tải về → đo bitrate → nén 64kbps mono 32kHz → upload đè đúng path cũ.
 * Dùng cho listening-practice / speaking / practice, nơi không map được
 * sang scripts/data/ như bộ full-test (xem compress-audio.ts).
 *
 * Tự bỏ qua: file không phải audio, file đã mono và <= 72kbps, và file
 * nén xong không nhỏ hơn đáng kể (>=5%) — để không làm hỏng file đã tối ưu.
 *
 * Usage:
 *   tsx scripts/compress-storage-audio.ts --dry-run
 *   tsx scripts/compress-storage-audio.ts
 *   tsx scripts/compress-storage-audio.ts --prefix speaking
 *   tsx scripts/compress-storage-audio.ts --bitrate 48k
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFileSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "audio";

const argv = process.argv.slice(2);
const flag = (n: string) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const dryRun = argv.includes("--dry-run");
const bitrate = flag("bitrate") ?? "64k";
const sampleRate = bitrate === "48k" ? "24000" : "32000";
const targetBps = parseInt(bitrate) * 1000;
const prefixes = flag("prefix")?.split(",") ?? ["listening-practice", "speaking", "practice"];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/** Liệt kê đệ quy mọi file dưới 1 prefix. */
async function listAll(prefix: string): Promise<{ path: string; size: number }[]> {
  const out: { path: string; size: number }[] = [];
  const walk = async (dir: string) => {
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(dir, { limit: 100, offset });
      if (error) throw new Error(`list ${dir}: ${error.message}`);
      if (!data?.length) break;
      for (const entry of data) {
        const full = `${dir}/${entry.name}`;
        // id === null => đây là "folder" ảo, đi sâu thêm
        if (entry.id === null) await walk(full);
        else out.push({ path: full, size: (entry.metadata?.size as number) ?? 0 });
      }
      if (data.length < 100) break;
    }
  };
  await walk(prefix);
  return out;
}

/** Đọc bitrate + số kênh của stream audio đầu tiên. */
function probe(file: string): { bps: number; channels: number } | null {
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-select_streams", "a:0",
       "-show_entries", "stream=bit_rate,channels", "-of", "csv=p=0", file],
      { encoding: "utf-8" },
    ).trim();
    const [bps, channels] = out.split(",").map(Number);
    return Number.isFinite(channels) ? { bps: bps || 0, channels } : null;
  } catch {
    return null;
  }
}

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "toeic-storage-"));
  const src = path.join(tmp, "in.mp3");
  const dst = path.join(tmp, "out.mp3");

  let before = 0, after = 0, done = 0, skipped = 0, failed = 0;

  for (const prefix of prefixes) {
    const files = (await listAll(prefix)).filter((f) => f.path.endsWith(".mp3"));
    console.log(`\n📂  ${prefix} — ${files.length} file mp3${dryRun ? "  (dry-run)" : ""}`);

    for (const file of files) {
      before += file.size;
      try {
        const { data, error } = await supabase.storage.from(BUCKET).download(file.path);
        if (error || !data) throw new Error(error?.message ?? "download rỗng");
        fs.writeFileSync(src, Buffer.from(await data.arrayBuffer()));

        const info = probe(src);
        if (!info) {
          console.log(`  –  ${file.path} — không đọc được, bỏ qua`);
          after += file.size; skipped++; continue;
        }
        if (info.channels === 1 && info.bps > 0 && info.bps <= targetBps * 1.125) {
          console.log(`  –  ${file.path} — đã ${Math.round(info.bps / 1000)}kbps mono, bỏ qua`);
          after += file.size; skipped++; continue;
        }

        execFileSync("ffmpeg", [
          "-v", "error", "-y", "-i", src,
          "-map", "0:a:0", "-map_metadata", "-1",
          "-ac", "1", "-ar", sampleRate, "-b:a", bitrate, dst,
        ]);

        const newSize = fs.statSync(dst).size;
        if (newSize >= file.size * 0.95) {
          console.log(`  –  ${file.path} — nén không lợi, bỏ qua`);
          after += file.size; skipped++; continue;
        }

        if (!dryRun) {
          const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(file.path, fs.readFileSync(dst), {
              contentType: "audio/mpeg",
              upsert: true,
            });
          if (upErr) throw new Error(upErr.message);
        }

        after += newSize;
        done++;
        console.log(`  ✓  ${file.path}  ${(file.size / 1048576).toFixed(2)}MB → ${(newSize / 1048576).toFixed(2)}MB (${Math.round((newSize / file.size) * 100)}%)`);
      } catch (err) {
        after += file.size;
        failed++;
        console.log(`  ✗  ${file.path} — ${(err as Error).message}`);
      }
    }
  }

  fs.rmSync(tmp, { recursive: true, force: true });
  const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;
  console.log(`\n📦  ${mb(before)} → ${mb(after)}  (tiết kiệm ${mb(before - after)})`);
  console.log(`    nén ${done} · bỏ qua ${skipped} · lỗi ${failed}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
