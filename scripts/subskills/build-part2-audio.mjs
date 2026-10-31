// Sinh audio TTS cho toàn bộ bài tập Part 2 (/subskills/listening/part2).
//
// Khu này vốn không có một file âm thanh nào — học viên đọc chữ để làm bài, nên
// "nghe câu hỏi ngắn" chỉ là cái tên. Script này đọc câu tiếng Anh của từng item,
// sinh mp3 bằng Azure Neural TTS, đẩy lên Supabase Storage và ghi ra một file
// map song song với từng bộ đề (không đụng vào file dữ liệu gốc).
//
// Giọng đọc xoay vòng qua 4 chất giọng của đề TOEIC thật (Mỹ, Anh, Úc, Canada)
// × 2 giới, chọn theo mã băm của chính câu đó nên lần chạy nào cũng ra như nhau.
//
// Chạy:
//   node scripts/subskills/build-part2-audio.mjs --dry     # chỉ đếm, không gọi API
//   node scripts/subskills/build-part2-audio.mjs           # sinh + đẩy + ghi map

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA_DIR = join(ROOT, "lib", "subskills", "data");
const OUT_FILE = join(DATA_DIR, "part2-audio.json");
const CACHE_DIR = join(ROOT, "scripts", "data", "part2-audio");
const BUCKET = "audio";
const PREFIX = "subskills/part2";

const DRY = process.argv.includes("--dry");

// ─────────────────────────────────────
// Env
// ─────────────────────────────────────

/** Đọc .env + .env.local thủ công để script chạy được ngoài Next. */
function loadEnv() {
  for (const f of [".env", ".env.local"]) {
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const v = m[2].replace(/^"(.*)"$/, "$1");
      // .env.local do `vercel env pull` hay ghi key sensitive thành rỗng — đừng đè
      if (v === "" && process.env[m[1]]) continue;
      process.env[m[1]] = v;
    }
  }
}
loadEnv();

const AZ_REGION = process.env.AZURE_SPEECH_REGION;
const AZ_KEY = process.env.AZURE_SPEECH_KEY;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ─────────────────────────────────────
// Giọng đọc — 4 chất giọng của đề TOEIC thật
// ─────────────────────────────────────

const VOICES = [
  "en-US-JennyNeural",
  "en-US-GuyNeural",
  "en-GB-SoniaNeural",
  "en-GB-RyanNeural",
  "en-AU-NatashaNeural",
  "en-AU-WilliamNeural",
  "en-CA-ClaraNeural",
  "en-CA-LiamNeural",
];

const keyOf = (text) => createHash("sha1").update(text).digest("hex").slice(0, 16);
const voiceOf = (k) => VOICES[parseInt(k.slice(0, 4), 16) % VOICES.length];

/** Giọng trả lời phải khác giọng hỏi — đề thật luôn hai người. */
function answerVoice(questionVoice, k) {
  const others = VOICES.filter((v) => v !== questionVoice);
  return others[parseInt(k.slice(4, 8), 16) % others.length];
}

// ─────────────────────────────────────
// Rút câu tiếng Anh cần đọc của từng dạng bài
// ─────────────────────────────────────

const tidy = (s) => String(s).replace(/\s+/g, " ").trim();
/**
 * Phát hiện chuỗi tiếng Việt để không đọc nhầm bằng giọng tiếng Anh.
 * Liệt kê tay từng chữ có dấu là thiếu sót (sót "ế", "ấ", "ộ"…), nên tách NFD
 * rồi bắt dấu thanh — đủ cho dữ liệu Part 2 vì phần tiếng Anh không có dấu.
 */
const isVi = (s) =>
  /[ăâđêôơưĂÂĐÊÔƠƯ]/.test(s) || /[̣̀́̃̉]/.test(s.normalize("NFD"));

/** Câu hoàn chỉnh của bài điền từ: lấy phương án đầu cho mỗi ô trống. */
function fillSentence(item) {
  return tidy(item.template.replace(/\{(\d+)\}/g, (_, i) => item.blanks[Number(i)]?.[0] ?? "___"));
}

/**
 * Trả về { audio, optionAudio } cho một item — audio là câu học viên cần nghe.
 * Dạng nào chưa có câu tiếng Anh hoàn chỉnh thì trả về null.
 */
function targetsFor(kind, item) {
  switch (kind) {
    case "wordbank": {
      // Cấp dễ: prompt là câu hỏi tiếng Anh. Cấp medium: prompt là gợi ý tiếng
      // Việt, câu tiếng Anh nằm ở chuỗi mảnh đã xếp đúng thứ tự.
      const text = isVi(item.prompt) ? tidy(item.chunks.join(" ")) : tidy(item.prompt);
      return { audio: text.endsWith("?") ? text : text + "?" };
    }
    case "fill":
      return { audio: fillSentence(item) };
    case "keyword":
      return { audio: tidy(item.prompt) };
    case "freewrite":
      return { audio: tidy(item.answer) };
    case "mcq":
      return {
        audio: tidy(item.prompt),
        // Cấp dễ để phương án bằng tiếng Việt — chưa đọc được, chờ đợt viết lại
        optionAudio: item.options.every((o) => !isVi(o)) ? item.options.map(tidy) : null,
      };
    case "match":
      return {
        audio: tidy(item.question),
        optionAudio: item.options.every((o) => !isVi(o)) ? item.options.map(tidy) : null,
      };
    default:
      return null;
  }
}

// ─────────────────────────────────────
// Quét toàn bộ bộ đề
// ─────────────────────────────────────

const files = readdirSync(DATA_DIR)
  .filter((n) => n.endsWith(".json") && n !== "part2-audio.json") // chính file map này
  .sort();

/** text → { key, voice } */
const wanted = new Map();
const maps = {};

for (const name of files) {
  const set = JSON.parse(readFileSync(join(DATA_DIR, name), "utf8"));
  const exercises = [];
  for (const ex of set.exercises) {
    const items = [];
    for (const item of ex.items) {
      const t = targetsFor(ex.kind, item);
      if (!t || !t.audio) {
        items.push({});
        continue;
      }
      const qk = keyOf(t.audio);
      const qv = voiceOf(qk);
      wanted.set(t.audio, { key: qk, voice: qv });
      const entry = { audio: qk };
      if (t.optionAudio) {
        entry.optionAudio = t.optionAudio.map((o) => {
          const ok = keyOf(o);
          wanted.set(o, { key: ok, voice: answerVoice(qv, ok) });
          return ok;
        });
      }
      items.push(entry);
    }
    exercises.push({ items });
  }
  maps[name] = { exercises };
}

const byVoice = {};
for (const { voice } of wanted.values()) byVoice[voice] = (byVoice[voice] ?? 0) + 1;
const chars = [...wanted.keys()].reduce((a, s) => a + s.length, 0);
console.log(`Bộ đề: ${files.length}`);
console.log(`Câu cần đọc (đã gộp trùng): ${wanted.size} — ${chars.toLocaleString("vi-VN")} ký tự`);
console.log("Phân bổ giọng:", byVoice);

if (DRY) {
  console.log("\n5 câu đầu:");
  let n = 0;
  for (const [text, meta] of wanted) {
    console.log(`  [${meta.voice}] ${text}`);
    if (++n >= 5) break;
  }
  process.exit(0);
}

// ─────────────────────────────────────
// Sinh mp3 + đẩy lên Supabase
// ─────────────────────────────────────

if (!AZ_REGION || !AZ_KEY) {
  console.error("Thiếu AZURE_SPEECH_REGION / AZURE_SPEECH_KEY");
  process.exit(1);
}
if (!SB_URL || !SB_KEY) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SB_URL, SB_KEY);
mkdirSync(CACHE_DIR, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function synth(text, voice) {
  const locale = voice.split("-").slice(0, 2).join("-");
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">` +
    `<voice name="${voice}"><prosody rate="-4%">${esc(text)}</prosody></voice></speak>`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(`https://${AZ_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": AZ_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "toeic-diary-part2",
      },
      body: ssml,
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, attempt * 1500));
      continue;
    }
    throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  throw new Error("TTS thất bại sau 4 lần thử");
}

let made = 0;
let cached = 0;
let uploaded = 0;
let bytes = 0;
let done = 0;
const entries = [...wanted.entries()];
const CONCURRENCY = 6;

async function handle([text, { key, voice }]) {
  const local = join(CACHE_DIR, `${key}.mp3`);
  let buf;
  if (existsSync(local)) {
    buf = readFileSync(local);
    cached++;
  } else {
    buf = await synth(text, voice);
    writeFileSync(local, buf);
    made++;
  }
  bytes += buf.length;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(`${PREFIX}/${key}.mp3`, buf, { contentType: "audio/mpeg", upsert: true });
  if (error) throw new Error(`Upload ${key}: ${error.message}`);
  uploaded++;

  done++;
  if (done % 100 === 0 || done === entries.length) {
    console.log(`  ${done}/${entries.length} — sinh mới ${made}, dùng lại ${cached}`);
  }
}

let cursor = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < entries.length) {
      await handle(entries[cursor++]);
    }
  })
);

// ghi gọn: file này đi thẳng vào bundle nên không xuống dòng cho nhẹ
writeFileSync(OUT_FILE, JSON.stringify(maps) + "\n", "utf8");

console.log(`\nXong: ${uploaded} file trên Supabase (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
console.log(`Map ghi vào ${OUT_FILE} (${Object.keys(maps).length} bộ đề)`);
