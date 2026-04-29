#!/usr/bin/env tsx
/**
 * Parse TOEIC transcript .txt files -> scripts/data/testN/parsed.json
 *
 * Supports all 4 parts:
 *   Part 1 (Q1-6)   : photos -- 4 statements (A/B/C/D), pure dictation
 *   Part 2 (Q7-31)  : question + 3 options (A/B/C) + Answer line
 *   Part 3 (Q32-70) : conversations, 3 questions per lesson
 *   Part 4 (Q71-100): talks, 3 questions per lesson
 *
 * Transcript file naming:
 *   Part 1 : E26-T01-1.txt ... E26-T01-6.txt  (one file per photo)
 *   Part 2 : E26-T01-7-31.txt  (all in one file, or individual E26-T01-7.txt etc.)
 *   Part 3 : E26-T01-32-34.txt, E26-T01-35-37.txt ...
 *   Part 4 : E26-T01-71-73.txt ...
 *
 * Part 1 transcript format:
 *   1.
 *   (A) A man is painting a wall.
 *   (B) Some tools are placed on the ground.
 *   (C) A ladder is leaning against a building.
 *   (D) Workers are wearing safety helmets.
 *
 * Part 2 transcript format:
 *   7.
 *   Has the project been completed yet?
 *   (A) Yes, we finished it yesterday.
 *   (B) The deadline is next Friday.
 *   (C) It was a difficult assignment.
 *   Answer: A
 *
 * Usage:
 *   tsx scripts/parse-transcripts.ts <testDir> [orderIndex]
 *   tsx scripts/parse-transcripts.ts scripts/data/test1 1
 */

import * as fs from "fs";
import * as path from "path";
import type { BlankDef, LessonDef, ParsedTest, SentenceDef } from "./types";

// --- Part ranges -------------------------------------------------------------

const PART1_END = 6;
const PART2_END = 31;
const PART3_END = 70;

function getPartNumber(qStart: number): 1 | 2 | 3 | 4 {
  if (qStart <= PART1_END) return 1;
  if (qStart <= PART2_END) return 2;
  if (qStart <= PART3_END) return 3;
  return 4;
}

// --- Word lists --------------------------------------------------------------

const STOP_WORDS = new Set([
  "about", "after", "again", "also", "another", "around", "because", "before",
  "being", "between", "both", "could", "doing", "during", "every", "going",
  "great", "hello", "here", "however", "just", "know", "like", "little",
  "look", "make", "might", "more", "much", "need", "never", "only", "other",
  "over", "people", "place", "please", "quite", "really", "right", "said",
  "should", "since", "some", "still", "take", "than", "that", "their",
  "there", "these", "thing", "things", "think", "those", "three", "through",
  "time", "today", "told", "under", "until", "usually", "very", "want",
  "well", "were", "what", "when", "where", "which", "while", "will", "with",
  "without", "work", "would", "your", "already", "actually", "probably",
  "something", "anything", "everything", "nothing", "someone", "anyone",
  "even", "then", "them", "they", "have", "from", "back", "come", "does",
  "each", "into", "been", "good", "this", "that", "many", "away", "okay",
  "sure", "let", "get", "put", "too", "all", "any", "can", "may",
  "here", "just", "know", "look", "made", "said", "year",
]);

const INDUSTRY_WORDS = new Set([
  "shipping", "bank", "banking", "hotel", "hospital", "university", "college",
  "school", "store", "shop", "restaurant", "cafe", "market", "center",
  "centre", "office", "agency", "services", "service", "group", "corp",
  "corporation", "institute", "foundation", "consulting", "management",
  "logistics", "construction", "engineering", "technology", "media",
  "publishing", "insurance", "finance", "investment", "retail", "wholesale",
  "transport", "transportation", "healthcare", "pharmacy", "clinic", "legal",
  "accounting", "manufacturing", "production", "distribution", "advertising",
  "marketing", "research", "development", "staffing", "recruitment", "supply",
  "sales", "trading", "industrial", "pharmaceutical", "automotive", "aviation",
  "realty", "properties", "catering", "printing", "packaging", "equipment",
]);

const PERSON_NAMES = new Set([
  "james", "john", "robert", "michael", "william", "david", "richard",
  "joseph", "thomas", "charles", "mary", "patricia", "jennifer", "linda",
  "barbara", "elizabeth", "susan", "jessica", "sarah", "karen", "nancy",
  "lisa", "betty", "sandra", "ashley", "kimberly", "donna", "emily",
  "michelle", "amanda", "melissa", "stephanie", "rebecca", "sharon",
  "laura", "angela", "anna", "brenda", "pamela", "emma", "nicole",
  "helen", "samantha", "katherine", "mark", "donald", "george", "kenneth",
  "steven", "edward", "brian", "ronald", "anthony", "kevin", "jason",
  "matthew", "gary", "timothy", "larry", "jeffrey", "frank", "scott",
  "eric", "stephen", "andrew", "raymond", "gregory", "joshua", "jerry",
  "dennis", "walter", "patrick", "peter", "harold", "douglas", "henry",
  "carl", "arthur", "ryan", "roger", "joe", "juan", "jack", "albert",
  "jonathan", "justin", "terry", "gerald", "keith", "samuel", "willie",
  "ralph", "lawrence", "nicholas", "roy", "benjamin", "bruce", "brandon",
  "adam", "harry", "fred", "wayne", "billy", "steve", "louis", "jeremy",
  "aaron", "randy", "eugene", "carlos", "russell", "bobby", "victor",
  "martin", "ernest", "marlon", "paul", "mike", "tom", "alex", "chris",
  "kate", "sam", "bob", "ann", "sue", "ben", "dan", "kim", "amy", "tim",
  "jim", "ron", "ken", "ray", "lee", "ted", "ned",
]);

const CONTENT_VERBS = new Set([
  "scheduled", "schedule", "confirmed", "confirm", "attended", "attend",
  "presented", "present", "reviewed", "review", "submitted", "submit",
  "approved", "approve", "cancelled", "cancel", "postponed", "postpone",
  "arranged", "arrange", "prepared", "prepare", "delivered", "deliver",
  "received", "receive", "ordered", "order", "purchased", "purchase",
  "hired", "hire", "promoted", "promote", "transferred", "transfer",
  "completed", "complete", "finished", "finish", "installed", "install",
  "repaired", "repair", "updated", "update", "upgraded", "upgrade",
  "replaced", "replace", "negotiated", "negotiate", "discussed", "discuss",
  "announced", "announce", "reported", "report", "contacted", "contact",
  "recommended", "recommend", "requested", "request", "provided", "provide",
  "offered", "offer", "increased", "increase", "decreased", "decrease",
  "expanded", "expand", "reduced", "reduce", "improved", "improve",
  "developed", "develop", "launched", "launch", "released", "release",
  "introduced", "introduce", "demonstrated", "demonstrate", "explained",
  "explain", "described", "describe", "mentioned", "mention", "decided",
  "decide", "accepted", "accept", "agreed", "agree", "delayed", "delay",
  "extended", "extend", "revised", "revise", "assigned", "assign",
  "registered", "register", "reserved", "reserve", "invited", "invite",
  "interviewed", "interview", "applied", "apply", "opened", "open",
  "closed", "close", "signed", "sign", "printed", "print", "uploaded",
  "tested", "test",
]);

// --- Blank selection ---------------------------------------------------------

function makeHint(word: string): string {
  return word[0] + "_".repeat(Math.max(word.length - 1, 1));
}

function selectBlanks(sentence: string): BlankDef[] {
  const words = sentence.split(/\s+/);

  type Run = { start: number; end: number };
  const orgRuns: Run[] = [];
  let runStart = -1;

  for (let i = 1; i < words.length; i++) {
    const w = words[i].replace(/[^a-zA-Z]/g, "");
    if (/^[A-Z]/.test(w) && w.length > 1) {
      if (runStart === -1) runStart = i;
    } else {
      if (runStart !== -1) {
        if (i - runStart >= 2) orgRuns.push({ start: runStart, end: i - 1 });
        runStart = -1;
      }
    }
  }
  if (runStart !== -1 && words.length - runStart >= 2) {
    orgRuns.push({ start: runStart, end: words.length - 1 });
  }

  const industryPositions = new Set<number>();
  for (const run of orgRuns) {
    for (let i = run.start; i <= run.end; i++) {
      const clean = words[i].replace(/[^a-zA-Z]/g, "").toLowerCase();
      if (INDUSTRY_WORDS.has(clean)) { industryPositions.add(i); break; }
    }
  }

  const inOrgRun = (idx: number) => orgRuns.some((r) => idx >= r.start && idx <= r.end);

  interface Candidate { position: number; word: string; score: number; }
  const candidates: Candidate[] = [];

  words.forEach((raw, idx) => {
    const clean = raw.replace(/[^a-zA-Z'-]/g, "");
    const lower = clean.toLowerCase();

    if (clean.length < 4) return;
    if (STOP_WORDS.has(lower)) return;
    if (inOrgRun(idx) && !industryPositions.has(idx)) return;
    if (idx > 0 && /^[A-Z]/.test(clean) && !inOrgRun(idx)) {
      if (PERSON_NAMES.has(lower)) return;
      if (/^[A-Z][a-z]+$/.test(clean) && clean.length <= 12) return;
    }

    let score = 0;
    if (industryPositions.has(idx)) score += 100;
    if (CONTENT_VERBS.has(lower)) score += 80;
    if (clean.length >= 6 && clean.length <= 10) score += 20;
    else if (clean.length >= 5) score += 10;
    if (idx > 0 && idx < words.length - 1) score += 10;
    if (idx === 0 || idx === words.length - 1) score -= 20;

    if (score > 0) candidates.push({ position: idx, word: clean, score });
  });

  if (candidates.length === 0) return [];

  candidates.sort((a, b) => b.score - a.score);
  const selected: Candidate[] = [candidates[0]];

  if (candidates.length > 1) {
    const minDist = Math.max(3, Math.floor(words.length / 3));
    const second = candidates.find((c) => Math.abs(c.position - selected[0].position) >= minDist);
    if (second) selected.push(second);
    else if (candidates[1]) selected.push(candidates[1]);
  }

  selected.sort((a, b) => a.position - b.position);
  return selected
    .filter((c) => c.word.length > 0)
    .map((c) => ({ position: c.position, answer: c.word, hint: makeHint(c.word) }));
}

// --- Filename parsing --------------------------------------------------------

interface FileMeta { examCode: string; testCode: string; qStart: number; qEnd: number; }

function parseFilename(filename: string): FileMeta | null {
  const base = path.basename(filename, ".txt");
  const match = base.match(/^(E\d+)-(T\d+)-(\d+)(?:-(\d+))?$/i);
  if (!match) return null;
  const qStart = parseInt(match[3], 10);
  const qEnd = parseInt(match[4] ?? match[3], 10);
  return { examCode: match[1].toUpperCase(), testCode: match[2].toUpperCase(), qStart, qEnd };
}

// --- Line helpers ------------------------------------------------------------

function parseSpeakerLine(line: string): { speaker: string; text: string } | null {
  const m = line.match(/^(W|M\d?|Narrator|Man|Woman):\s*(.+)$/i);
  if (!m) return null;
  return { speaker: m[1].toUpperCase(), text: m[2].trim() };
}

function parseNumberedLine(line: string): number | null {
  const m = line.trim().match(/^(\d+)\.\s*$/);
  return m ? parseInt(m[1], 10) : null;
}

function parseOptionLine(line: string): { label: string; text: string } | null {
  const m = line.trim().match(/^\(([A-D])\)\s+(.+)$/);
  if (!m) return null;
  return { label: m[1], text: m[2].trim() };
}

function parseAnswerLine(line: string): string | null {
  const m = line.trim().match(/^Answer:\s*([A-D])$/i);
  return m ? m[1].toUpperCase() : null;
}

function splitIntoSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]+(?:\s|$)/g);
  if (!parts || parts.length <= 1) return [text.trim()];
  return parts.map((s) => s.trim()).filter(Boolean);
}

// --- Part 1 parser -----------------------------------------------------------

function parsePart1File(filePath: string, meta: FileMeta): LessonDef | null {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const options: { label: string; text: string }[] = [];
  let questionNum = meta.qStart;

  for (const line of lines) {
    const qNum = parseNumberedLine(line);
    if (qNum !== null) { questionNum = qNum; continue; }
    const opt = parseOptionLine(line);
    if (opt) options.push(opt);
  }

  if (options.length === 0) return null;

  const sentences: SentenceDef[] = options.map((opt, i) => ({
    orderIndex: i,
    speaker: null,
    content: opt.text,
    startTime: 0,
    endTime: 0,
    optionLabel: opt.label,
    blanks: selectBlanks(opt.text),
  }));

  return {
    title: `Question ${questionNum}`,
    questionStart: questionNum,
    questionEnd: questionNum,
    part: 1,
    transcriptFull: options.map((o) => `(${o.label}) ${o.text}`).join("\n"),
    sentences,
    correctOption: null,
    explanation: "",
    audioFiles: [`${meta.examCode}-${meta.testCode}-${String(questionNum).padStart(2, "0")}.mp3`],
    audioUrl: "",
    audioDuration: 0,
  };
}

// --- Part 2 parser -----------------------------------------------------------

function parsePart2File(filePath: string, meta: FileMeta): LessonDef[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).map((l) => l.trim());
  const lessons: LessonDef[] = [];

  let currentNum: number | null = null;
  let currentLines: string[] = [];

  function flush() {
    if (currentNum === null || currentLines.length === 0) return;
    const lesson = parsePart2Block(currentNum, currentLines, meta);
    if (lesson) lessons.push(lesson);
    currentLines = [];
  }

  let hasNumberedLine = false;
  for (const line of lines) {
    const qNum = parseNumberedLine(line);
    if (qNum !== null && qNum >= 7 && qNum <= 31) {
      flush();
      currentNum = qNum;
      hasNumberedLine = true;
      continue;
    }
    currentLines.push(line);
  }

  if (hasNumberedLine) {
    flush();
  } else {
    // Single-question file with no numbered line
    const lesson = parsePart2Block(meta.qStart, currentLines.filter(Boolean), meta);
    if (lesson) lessons.push(lesson);
  }

  return lessons;
}

function parsePart2Block(qNum: number, lines: string[], meta: FileMeta): LessonDef | null {
  const options: { label: string; text: string }[] = [];
  let questionText = "";
  let correctOption: string | null = null;

  for (const line of lines) {
    if (!line) continue;
    const ans = parseAnswerLine(line);
    if (ans) { correctOption = ans; continue; }
    const opt = parseOptionLine(line);
    if (opt) { options.push(opt); continue; }
    if (!questionText) questionText = line;
  }

  if (!questionText || options.length === 0) return null;

  const sentences: SentenceDef[] = [
    {
      orderIndex: 0,
      speaker: null,
      content: questionText,
      startTime: 0,
      endTime: 0,
      optionLabel: null,
      blanks: selectBlanks(questionText),
    },
    ...options.map((opt, i) => ({
      orderIndex: i + 1,
      speaker: null as string | null,
      content: opt.text,
      startTime: 0,
      endTime: 0,
      optionLabel: opt.label,
      blanks: selectBlanks(opt.text),
    })),
  ];

  return {
    title: `Question ${qNum}`,
    questionStart: qNum,
    questionEnd: qNum,
    part: 2,
    transcriptFull: [questionText, ...options.map((o) => `(${o.label}) ${o.text}`)].join("\n"),
    sentences,
    correctOption,
    explanation: "",
    audioFiles: [`${meta.examCode}-${meta.testCode}-${String(qNum).padStart(2, "0")}.mp3`],
    audioUrl: "",
    audioDuration: 0,
  };
}

// --- Part 3/4 parser ---------------------------------------------------------

function parsePart34File(filePath: string, meta: FileMeta): LessonDef[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const rawSections = content.split(/\r?\n(\r?\n)+/);
  const lessons: LessonDef[] = [];
  for (const section of rawSections) {
    const lines = section.split(/\r?\n/);
    if (lines.every((l) => !l.trim())) continue;
    const lesson = parsePart34Section(lines, meta);
    if (lesson) lessons.push(lesson);
  }
  return lessons;
}

function parsePart34Section(lines: string[], meta: FileMeta): LessonDef | null {
  const spokenLines: Array<{ speaker: string | null; text: string }> = [];
  const questionNums: number[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^\([A-D]\)/.test(line)) continue;

    const qMatch = line.match(/^(\d+)\.\s+.+$/);
    if (qMatch) { questionNums.push(parseInt(qMatch[1], 10)); continue; }

    const s = parseSpeakerLine(line);
    if (s) { spokenLines.push(s); continue; }

    for (const sent of splitIntoSentences(line)) {
      spokenLines.push({ speaker: null, text: sent });
    }
  }

  if (spokenLines.length === 0 || questionNums.length === 0) return null;

  const questionStart = Math.min(...questionNums);
  const questionEnd = Math.max(...questionNums);
  if (questionStart < 32) return null;

  const part: 3 | 4 = questionStart <= PART3_END ? 3 : 4;

  return {
    title: `Questions ${questionStart}\u2013${questionEnd}`,
    questionStart,
    questionEnd,
    part,
    transcriptFull: spokenLines.map((l) => (l.speaker ? `${l.speaker}: ${l.text}` : l.text)).join("\n"),
    sentences: spokenLines.map((l, i) => ({
      orderIndex: i,
      speaker: l.speaker,
      content: l.text,
      startTime: 0,
      endTime: 0,
      optionLabel: null,
      blanks: selectBlanks(l.text),
    })),
    correctOption: null,
    explanation: "",
    audioFiles: [`${meta.examCode}-${meta.testCode}-${questionStart}-${questionEnd}.mp3`],
    audioUrl: "",
    audioDuration: 0,
  };
}

// --- File dispatcher ---------------------------------------------------------

function parseTxtFile(filePath: string): LessonDef[] {
  const meta = parseFilename(path.basename(filePath));
  if (!meta) {
    console.warn(`  [skip] Unrecognised filename: ${path.basename(filePath)}`);
    return [];
  }

  const part = getPartNumber(meta.qStart);

  if (part === 1) {
    console.log(`  [Part 1] ${path.basename(filePath)}`);
    const lesson = parsePart1File(filePath, meta);
    if (lesson) {
      console.log(`      Q${meta.qStart} -- ${lesson.sentences.length} options`);
      return [lesson];
    }
    return [];
  }

  if (part === 2) {
    console.log(`  [Part 2] ${path.basename(filePath)}`);
    const lessons = parsePart2File(filePath, meta);
    for (const l of lessons) {
      console.log(`      Q${l.questionStart} -- ${l.sentences.length} sentences, answer: ${l.correctOption ?? "?"}`);
    }
    return lessons;
  }

  console.log(`  [Part ${part}] ${path.basename(filePath)}`);
  const lessons = parsePart34File(filePath, meta);
  for (const l of lessons) {
    console.log(`      ${l.title} -- ${l.sentences.length} sentences`);
  }
  return lessons;
}

// --- Main --------------------------------------------------------------------

function main() {
  const testDir = process.argv[2];
  const orderIndex = parseInt(process.argv[3] ?? "1", 10);

  if (!testDir) {
    console.error("Usage: tsx scripts/parse-transcripts.ts <testDir> [orderIndex]");
    process.exit(1);
  }

  const transcriptsDir = path.join(testDir, "transcripts");
  if (!fs.existsSync(transcriptsDir)) {
    console.error(`Directory not found: ${transcriptsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(transcriptsDir).filter((f) => f.toLowerCase().endsWith(".txt")).sort();
  if (files.length === 0) { console.error("No .txt files found"); process.exit(1); }

  let examCode = "E26", testCode = "T01";
  for (const f of files) {
    const meta = parseFilename(f);
    if (meta) { examCode = meta.examCode; testCode = meta.testCode; break; }
  }

  const testNum = parseInt(testCode.replace(/\D/g, ""), 10) || 1;
  const testName = `ETS 2026 Test ${testNum}`;
  const testSlug = `ets-2026-test-${testNum}`;

  console.log(`\nParsing ${testName} (${examCode}-${testCode})`);
  console.log(`Source: ${transcriptsDir}\n`);

  const allLessons: LessonDef[] = [];
  for (const filename of files) {
    allLessons.push(...parseTxtFile(path.join(transcriptsDir, filename)));
  }
  allLessons.sort((a, b) => a.questionStart - b.questionStart);

  const parsed: ParsedTest = { testName, testSlug, orderIndex, examCode, testCode, lessons: allLessons };
  const outputPath = path.join(testDir, "parsed.json");
  fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2), "utf-8");

  const totalBlanks = allLessons.reduce((s, l) => s + l.sentences.reduce((ss, sen) => ss + sen.blanks.length, 0), 0);
  console.log(`\nDone!`);
  for (const p of [1, 2, 3, 4]) {
    const c = allLessons.filter((l) => l.part === p).length;
    if (c > 0) console.log(`    Part ${p} lessons : ${c}`);
  }
  console.log(`    Total blanks   : ${totalBlanks}`);
  console.log(`    Output         : ${outputPath}\n`);
}

main();
