/* eslint-disable */
// Copy Speaking Part 2 "describe in steps" source images into public/ with URL-safe slugs.
const fs = require("fs");
const path = require("path");

const SRC = "D:\\Misc\\Speaking Part 2";
const DEST = path.join(__dirname, "..", "public", "images", "speaking-p2-steps");

// slug -> original filename
const MAP = {
  // EASY
  e01: "16731719.jpg",
  e02: "30789866.png",
  e03: "a1.jpg",
  e04: "9752333.png",
  e05: "14075513.jpg",
  e06: "99857427.jpg",
  e07: "anh (6).png",
  e08: "toie c.jpg",
  e09: "unnamed.jpg",
  // MEDIUM
  m01: "43654375.jpg",
  m02: "89860055.png",
  m03: "a1.png",
  m04: "a2.jpg",
  m05: "anh (8).png",
  m06: "12939339.jpg",
  m07: "43139031.jpg",
  m08: "70744220.jpg",
  m09: "79922633.jpg",
  m10: "88511636.png",
  m11: "anh (1).png",
  m12: "45718895.jpg",
  m13: "51205752.jpg",
  m14: "52291890.jpg",
  m15: "54997513.jpg",
  m16: "a1 (1).png",
  m17: "anh (2).png",
  m18: "anh (3).png",
  m19: "CD1JohnsKids-28.webp",
  m20: "ảnh 1.png",
  m21: "55638002.webp",
  m22: "a2.png",
  m23: "anh (5).png",
  m24: "anh (7).png",
  // HARD
  h01: "a2 (1).jpg",
  h02: "anh (4).png",
  h03: "ảnh 2.png",
  h04: "81123058.jpg",
  h05: "38239839.jpg",
  h06: "7225813.jpg",
  h07: "alexandra-tandy-photography-touching-a-sign.jpg",
  h08: "anh 1 (1).png",
  h09: "anh 1.png",
  h10: "anh.png",
  h11: "ảnh 1 (1).png",
  h12: "anh 2 (1).png",
  h13: "anh 2 (2).png",
  h14: "anh 2.png",
};

fs.mkdirSync(DEST, { recursive: true });

const used = new Set();
let ok = 0;
const result = {};
for (const [slug, orig] of Object.entries(MAP)) {
  const src = path.join(SRC, orig);
  if (!fs.existsSync(src)) {
    console.log(`MISSING: ${orig}`);
    continue;
  }
  if (used.has(orig)) console.log(`WARN duplicate source: ${orig}`);
  used.add(orig);
  const ext = path.extname(orig).toLowerCase();
  const outName = `${slug}${ext}`;
  fs.copyFileSync(src, path.join(DEST, outName));
  result[slug] = `/images/speaking-p2-steps/${outName}`;
  ok++;
}

fs.writeFileSync(path.join(__dirname, "p2-step-image-map.json"), JSON.stringify(result, null, 2) + "\n", "utf8");

// report any source file not mapped
const all = fs.readdirSync(SRC).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
const unmapped = all.filter((f) => !used.has(f));
console.log(`Copied ${ok}/${Object.keys(MAP).length} images -> ${DEST}`);
console.log(`Source files: ${all.length}, unmapped: ${unmapped.length}`);
if (unmapped.length) console.log("Unmapped:", unmapped.join(", "));
