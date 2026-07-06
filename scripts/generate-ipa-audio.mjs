// Generate IPA audio mp3 via Google Cloud Text-to-Speech (API-key REST).
// Usage:  GOOGLE_TTS_KEY=xxx node scripts/generate-ipa-audio.mjs
//
// Collects every word that gets *played* in the IPA module:
//   - chart example words (chart.ts  `word: "..."`)
//   - audiochoice `audio` words (data/*.json)
// Writes public/audio/ipa/<slug>.mp3 and lib/subskills/ipa/audio-manifest.json.
// The API key is read from env only — never written to disk.

import fs from "node:fs";
import path from "node:path";

const KEY = process.env.GOOGLE_TTS_KEY;
if (!KEY) { console.error("Missing GOOGLE_TTS_KEY env"); process.exit(1); }

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "audio", "ipa");
const MANIFEST = path.join(ROOT, "lib", "subskills", "ipa", "audio-manifest.json");
const DATA_DIR = path.join(ROOT, "lib", "subskills", "ipa", "data");
const CHART = path.join(ROOT, "lib", "subskills", "ipa", "chart.ts");

const VOICE = { languageCode: "en-US", name: "en-US-Neural2-C" };
const AUDIO = { audioEncoding: "MP3", speakingRate: 0.9 };

const slug = (w) => w.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ── collect words ──
const words = new Set();

// chart words
const chartSrc = fs.readFileSync(CHART, "utf8");
for (const m of chartSrc.matchAll(/word:\s*"([^"]+)"/g)) words.add(m[1]);

// audiochoice words from data JSON
for (const f of fs.readdirSync(DATA_DIR).filter((x) => x.endsWith(".json"))) {
  const set = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8"));
  for (const ex of set.exercises) for (const it of ex.items) {
    if (it.kind === "audiochoice" && it.audio) words.add(it.audio);
    // also synth the option words so future item types can play them
    if (it.kind === "audiochoice") for (const o of it.options) words.add(o);
  }
}

const list = [...words].sort();
console.log(`Words to synth: ${list.length}`);

fs.mkdirSync(OUT_DIR, { recursive: true });

async function synth(word) {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { text: word }, voice: VOICE, audioConfig: AUDIO }),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  const { audioContent } = await res.json();
  return Buffer.from(audioContent, "base64");
}

const done = [];
let failed = 0;
for (const w of list) {
  const s = slug(w);
  const file = path.join(OUT_DIR, `${s}.mp3`);
  try {
    const buf = await synth(w);
    fs.writeFileSync(file, buf);
    done.push(s);
    process.stdout.write(".");
  } catch (e) {
    failed++;
    console.log(`\nFAIL "${w}": ${e.message}`);
    if (failed >= 3) { console.log("Aborting after 3 failures."); break; }
  }
}

if (failed < 3) {
  fs.writeFileSync(MANIFEST, JSON.stringify([...new Set(done)].sort(), null, 0) + "\n");
  console.log(`\nDone. mp3=${done.length} failed=${failed}. Manifest written.`);
} else {
  console.log("\nNot writing manifest due to failures.");
  process.exit(1);
}
