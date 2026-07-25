// Chuẩn hoá ảnh nguồn cho Writing Q1-5: resize max-width 900, xuất .jpg q80, đặt tên tuần tự.
// Chạy: node scripts/normalize-q15-images.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = "D:/Misc/Writing Part 1";
const OUT = "public/images/skills/writing-q1-5";

fs.mkdirSync(OUT, { recursive: true });

const files = fs
  .readdirSync(SRC)
  .filter((f) => fs.statSync(path.join(SRC, f)).isFile())
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

console.log(`source files: ${files.length}`);

const map = [];
let i = 0;
for (const f of files) {
  i += 1;
  const id = `q15-${String(i).padStart(3, "0")}`;
  const dest = path.join(OUT, `${id}.jpg`);
  const meta = await sharp(path.join(SRC, f)).metadata();
  await sharp(path.join(SRC, f))
    .resize({ width: 900, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(dest);
  const kb = Math.round(fs.statSync(dest).size / 1024);
  map.push({ id, source: f, w: meta.width, h: meta.height, kb });
  console.log(`${id}  <- ${f}  (${meta.width}x${meta.height} -> ${kb}KB)`);
}

fs.writeFileSync("scripts/writing-q1-5-source-map.json", JSON.stringify(map, null, 2));
console.log(`\ndone: ${map.length} images, ${Math.round(map.reduce((s, m) => s + m.kb, 0) / 1024)}MB`);
