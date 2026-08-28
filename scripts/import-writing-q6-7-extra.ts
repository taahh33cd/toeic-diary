#!/usr/bin/env tsx
/**
 * import-writing-q6-7-extra.ts
 *
 * Bóc bộ đề Writing Q6-7 (Respond to a written request) từ thư mục nguồn
 * (mỗi thư mục "Test N" = 1 bộ 2 e-mail, mỗi e-mail 1 file .txt) thành
 * `lib/skills/data/writing-q6-7-extra.json`.
 *
 * Khác với 36 đề soạn tay trong `lib/skills/writing-q6-7.ts`, các đề ở đây
 * CHƯA có bài mẫu — chỉ có đề bài và mission tách tự động từ dòng Directions.
 *
 * Usage:
 *   tsx scripts/import-writing-q6-7-extra.ts "<sourceDir>" [--dry]
 */

import * as fs from "fs";
import * as path from "path";

const OUT = path.join(__dirname, "..", "lib", "skills", "data", "writing-q6-7-extra.json");

/** Tiêu đề `from` của 36 đề soạn tay — dùng để không nhập trùng. */
const EXISTING_FROM = new Set(
  [
    "Marilyn Aniston", "Jodie McMaster", "Jonathan Louise", "Ellen's Style", "Just Good Car",
    "Matthew Hanson", "George Pinkney", "Journal of Business News", "City Sports and Fitness Club",
    "Joan Andrews", "Riverdale Public Library", "William Hamm", "National Business Conference",
    "Elaine Meyer", "Piero Caggia", "Rachel Lin", "Libby Mills", "Seaview Hotel",
    "Brightmart Online", "Diane Foster", "Gino Marchetti", "Pageturner Books", "Professor Alan Grady",
    "Martin Cole", "Ardent Fitness", "Owen Barrett", "Northgate Travel", "Brookside Property Management",
    "Vertex Paper Company", "Sandra Kim", "Tara Willis", "Marco Ruiz", "Middletown City Council",
    "Sam Ortiz", "Victor Lam",
  ].map(norm),
);

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface OutPrompt {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  email: { from: string; to: string; subject: string; sent?: string; body: string[] };
  directions: string;
  missions: string[];
  /** Vai học viên phải đóng, bóc từ "as if you are …" */
  role: string;
  sourceTest: number;
}

// ── Bóc đề ───────────────────────────────────────────────────────────

const HEADER_RE = /^(FROM|TO|SUBJECT|SENT|DATE)\s*:\s*/i;

/** File nguồn hay có "FROM: FROM: x" do copy hai lần — bỏ tiền tố lặp. */
function headerValue(line: string): string {
  let v = line.replace(HEADER_RE, "").trim();
  while (HEADER_RE.test(v)) v = v.replace(HEADER_RE, "").trim();
  return v.replace(/\s*\[[^\]]*\]\s*$/, "").trim();
}

function headerKey(line: string): string {
  return (line.match(HEADER_RE)?.[1] ?? "").toUpperCase();
}

/** Dòng Directions là dòng chứa "Respond ... as if" hoặc "In your e-mail," */
function isDirections(line: string): boolean {
  return /respond\b/i.test(line) && /(as if|in your e-?mail|in your response)/i.test(line);
}

const VERBS =
  "ask|make|give|explain|describe|provide|suggest|offer|request|say|tell|indicate|state|mention|recommend|propose|confirm|apologize";
const COUNT = "one|two|three|four|an|a|\\d+";

/**
 * Tách mission từ mệnh đề nhiệm vụ. Nguồn viết rất đều: các nhiệm vụ nối bằng
 * ", " hoặc " and ", và mỗi nhiệm vụ mở đầu bằng một động từ mệnh lệnh.
 * Đoạn không mở đầu bằng động từ (vd "and ONE suggestion") được mượn động từ
 * của nhiệm vụ liền trước.
 */
function splitMissions(clause: string): string[] {
  const parts = clause
    .replace(/\.$/, "")
    .split(/,\s+and\s+|,\s+|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: string[] = [];
  for (const part of parts) {
    const startsWithVerb = new RegExp(`^(${VERBS})\\b`, "i").test(part);
    if (startsWithVerb || out.length === 0) {
      out.push(part);
      continue;
    }
    // "ONE suggestion" → mượn động từ của nhiệm vụ trước ("give ONE suggestion")
    if (new RegExp(`^(at least\\s+)?(${COUNT})\\b`, "i").test(part)) {
      const verb = out[out.length - 1].match(new RegExp(`^(${VERBS})`, "i"))?.[1] ?? "give";
      out.push(`${verb} ${part}`);
      continue;
    }
    // Mảnh vụn không phải nhiệm vụ riêng → nối vào nhiệm vụ trước
    out[out.length - 1] += ` and ${part}`;
  }
  return out.map((m) => m.charAt(0).toUpperCase() + m.slice(1));
}

function missionClause(directions: string): string {
  const m = directions.match(/in your (?:e-?mail|response)[^,]*,\s*(.+)$/i);
  if (m) return m[1].trim();
  // Không có "In your e-mail," → lấy phần sau câu đầu ("Respond … as if you are X. Say ONE …")
  const sentences = directions.split(/(?<=\.)\s+/);
  return sentences.slice(1).join(" ").trim() || directions;
}

function extractRole(directions: string): string {
  const m = directions.match(/as if you (?:are|were|have|work)\s+([^.]+?)(?:\.|$)/i);
  return m ? m[1].trim() : "";
}

/**
 * Độ khó tự gán: vai đòi hỏi sự tế nhị (từ chối, xin lỗi, khiếu nại) là hard;
 * mọi nhiệm vụ cùng một loại động từ là easy; còn lại medium.
 */
function difficulty(directions: string, missions: string[]): OutPrompt["difficulty"] {
  if (/refuse|apolog|complain|compensat|overdue|unsatisfactor|dissatisf/i.test(directions)) return "hard";
  const verbs = new Set(missions.map((m) => (m.match(new RegExp(`^(${VERBS})`, "i"))?.[1] ?? "").toLowerCase()));
  if (missions.length <= 1 || verbs.size <= 1) return "easy";
  return "medium";
}

function parseFile(file: string, testNo: number): OutPrompt | null {
  const lines = fs.readFileSync(file, "utf-8").replace(/\r/g, "").split("\n").map((l) => l.trim());

  const header: Record<string, string> = {};
  const body: string[] = [];
  let directions = "";
  let seenHeader = false;

  for (const line of lines) {
    if (!line) continue;
    if (isDirections(line)) {
      // Dòng Directions cuối cùng thắng (vài file mở đầu bằng "Read the e-mail below. Respond…")
      directions = directions ? `${directions} ${line}` : line;
      continue;
    }
    if (HEADER_RE.test(line)) {
      header[headerKey(line)] = headerValue(line);
      seenHeader = true;
      continue;
    }
    if (/^(read the e-?mail|read the following)/i.test(line)) continue;
    if (seenHeader) body.push(line);
  }

  if (!header.FROM || !directions) return null;

  const missions = splitMissions(missionClause(directions));
  return {
    id: "",
    difficulty: difficulty(directions, missions),
    email: {
      from: header.FROM,
      to: header.TO ?? "",
      subject: header.SUBJECT ?? "",
      sent: header.SENT ?? header.DATE ?? undefined,
      body,
    },
    directions,
    missions,
    role: extractRole(directions),
    sourceTest: testNo,
  };
}

// ── Chạy ─────────────────────────────────────────────────────────────

function main() {
  const sourceBase = process.argv[2];
  const dry = process.argv.includes("--dry");
  if (!sourceBase) {
    console.error('Usage: tsx scripts/import-writing-q6-7-extra.ts "<sourceDir>" [--dry]');
    process.exit(1);
  }

  const dirs = fs
    .readdirSync(sourceBase, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => (Number(a.replace(/\D/g, "")) || 0) - (Number(b.replace(/\D/g, "")) || 0));

  const out: OutPrompt[] = [];
  const seen = new Set<string>();
  let skippedDup = 0;
  let skippedExisting = 0;
  let failed = 0;

  for (const dir of dirs) {
    const testNo = Number(dir.replace(/\D/g, "")) || 0;
    const files = fs.readdirSync(path.join(sourceBase, dir)).filter((f) => f.toLowerCase().endsWith(".txt")).sort();
    for (const f of files) {
      const p = parseFile(path.join(sourceBase, dir, f), testNo);
      if (!p) {
        console.error(`  ✗ ${dir}/${f} — không bóc được header hoặc Directions`);
        failed++;
        continue;
      }
      // Trùng trong chính thư mục nguồn (vd Test 3 ≡ Test 19, Test 7 ≡ Test 15)
      const key = `${norm(p.email.from)}|${norm(p.email.subject)}`;
      if (seen.has(key)) { skippedDup++; continue; }
      seen.add(key);
      // Trùng với 36 đề soạn tay
      if (EXISTING_FROM.has(norm(p.email.from)) || [...EXISTING_FROM].some((e) => norm(p.email.from).startsWith(e))) {
        skippedExisting++;
        continue;
      }
      out.push(p);
    }
  }

  out.forEach((p, i) => { p.id = `q67x-${String(i + 1).padStart(2, "0")}`; });

  const byDiff = out.reduce<Record<string, number>>((a, p) => ((a[p.difficulty] = (a[p.difficulty] ?? 0) + 1), a), {});
  console.log(`\n${out.length} đề mới  ·  bỏ ${skippedDup} trùng nội bộ, ${skippedExisting} trùng đề cũ, ${failed} lỗi`);
  console.log(`độ khó: ${JSON.stringify(byDiff)}`);
  console.log(`mission/đề: ${out.map((p) => p.missions.length).join(" ")}`);

  if (!dry) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf-8");
    console.log(`→ ${path.relative(process.cwd(), OUT)}`);
  }
}

main();
