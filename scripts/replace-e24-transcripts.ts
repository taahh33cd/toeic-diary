#!/usr/bin/env tsx
/**
 * replace-e24-transcripts.ts
 *
 * Thay thế transcript trong scripts/data/testN/parsed.json bằng nội dung
 * từ folder ETS 2024, GIỮ NGUYÊN audio URL / audioDuration / timestamps.
 *
 * Chỉ cập nhật:
 *   - transcriptFull
 *   - sentences[].content, speaker, optionLabel, blanks
 *   - correctOption (cho Part 2)
 *
 * Không thay đổi:
 *   - testName, testSlug, examCode, testCode
 *   - audioFiles, audioUrl, audioDuration
 *   - startTime, endTime
 *
 * Usage:
 *   tsx scripts/replace-e24-transcripts.ts "<sourceDir>"
 *   tsx scripts/replace-e24-transcripts.ts "D:\Transcript 2024-...\Transcript 2024"
 */

import * as fs from "fs";
import * as path from "path";
import type { BlankDef, LessonDef, SentenceDef } from "./types";

// ─── Blank selection (identical to parse-transcripts.ts) ─────────────────────

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

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseSpeakerLine(line: string): { speaker: string; text: string } | null {
  const m = line.match(/^(W(?:-\w+)?|M(?:\d+|-\w+)?|Narrator|Man|Woman):\s*(.+)$/i);
  if (!m) return null;
  return { speaker: m[1].toUpperCase(), text: m[2].trim() };
}

function stripSpeakerPrefix(line: string): string {
  return line.replace(/^(?:W(?:-\w+)?|M(?:\d+|-\w+)?|Narrator|Man|Woman):\s*/i, "");
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

// ─── Parse a single .txt file → new lesson content ───────────────────────────

interface ParsedLesson {
  questionStart: number;
  questionEnd: number;
  part: 1 | 2 | 3 | 4;
  transcriptFull: string;
  sentences: SentenceDef[];
  correctOption: string | null;
}

function parseTxtFile(filePath: string): ParsedLesson[] {
  const base = path.basename(filePath, ".txt");
  const match = base.match(/^(E\d+)-(T\d+)-(\d+)(?:-(\d+))?$/i);
  if (!match) return [];

  const qStart = parseInt(match[3], 10);
  const qEnd = parseInt(match[4] ?? match[3], 10);
  const part: 1 | 2 | 3 | 4 =
    qStart <= 6 ? 1 : qStart <= 31 ? 2 : qStart <= 70 ? 3 : 4;

  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split(/\r?\n/);

  if (part === 1) return [parsePart1(qStart, lines)].filter(Boolean) as ParsedLesson[];
  if (part === 2) return parsePart2(lines, qStart, qEnd);
  return parsePart34(lines, qStart, qEnd, part);
}

function parsePart1(qNum: number, lines: string[]): ParsedLesson | null {
  const options: { label: string; text: string }[] = [];
  for (const line of lines) {
    const opt = parseOptionLine(line.trim());
    if (opt) options.push(opt);
  }
  if (options.length === 0) return null;

  return {
    questionStart: qNum,
    questionEnd: qNum,
    part: 1,
    transcriptFull: options.map((o) => `(${o.label}) ${o.text}`).join("\n"),
    sentences: options.map((opt, i) => ({
      orderIndex: i,
      speaker: null,
      content: opt.text,
      startTime: 0,
      endTime: 0,
      optionLabel: opt.label,
      blanks: selectBlanks(opt.text),
    })),
    correctOption: null,
  };
}

function parsePart2(lines: string[], qStartFile: number, qEndFile: number): ParsedLesson[] {
  // Support both single-question files and multi-question files
  const trimmed = lines.map((l) => l.trim());

  // Check if there are numbered question markers
  const numbered = trimmed.some((l) => /^(\d+)\.\s*$/.test(l));

  if (!numbered) {
    const lesson = parsePart2Block(qStartFile, trimmed.filter(Boolean));
    return lesson ? [lesson] : [];
  }

  const lessons: ParsedLesson[] = [];
  let currentNum: number | null = null;
  let currentLines: string[] = [];

  function flush() {
    if (currentNum === null) return;
    const lesson = parsePart2Block(currentNum, currentLines.filter(Boolean));
    if (lesson) lessons.push(lesson);
    currentLines = [];
  }

  for (const line of trimmed) {
    const qMatch = line.match(/^(\d+)\.\s*$/);
    if (qMatch) {
      flush();
      currentNum = parseInt(qMatch[1], 10);
      continue;
    }
    currentLines.push(line);
  }
  flush();
  return lessons;
}

function parsePart2Block(qNum: number, lines: string[]): ParsedLesson | null {
  const options: { label: string; text: string }[] = [];
  let questionText = "";
  let correctOption: string | null = null;

  for (const line of lines) {
    if (!line) continue;
    const stripped = stripSpeakerPrefix(line);
    const ans = parseAnswerLine(stripped);
    if (ans) { correctOption = ans; continue; }
    const opt = parseOptionLine(stripped);
    if (opt) { options.push(opt); continue; }
    if (!questionText) questionText = stripped;
  }

  if (!questionText || options.length === 0) return null;

  return {
    questionStart: qNum,
    questionEnd: qNum,
    part: 2,
    transcriptFull: [questionText, ...options.map((o) => `(${o.label}) ${o.text}`)].join("\n"),
    sentences: [
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
    ],
    correctOption,
  };
}

function parsePart34(lines: string[], qStart: number, qEnd: number, part: 3 | 4): ParsedLesson[] {
  const spokenLines: Array<{ speaker: string | null; text: string }> = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^\([A-D]\)/.test(line)) continue;
    if (/^(\d+)\.\s+.+$/.test(line)) continue;

    const s = parseSpeakerLine(line);
    if (s) {
      for (const sent of splitIntoSentences(s.text)) {
        spokenLines.push({ speaker: s.speaker, text: sent });
      }
      continue;
    }
    for (const sent of splitIntoSentences(line)) {
      spokenLines.push({ speaker: null, text: sent });
    }
  }

  if (spokenLines.length === 0) return [];

  return [{
    questionStart: qStart,
    questionEnd: qEnd,
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
  }];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const sourceDir = process.argv[2];
  if (!sourceDir) {
    console.error("Usage: tsx scripts/replace-e24-transcripts.ts <sourceDir>");
    console.error('Example: tsx scripts/replace-e24-transcripts.ts "D:\\Transcript 2024"');
    process.exit(1);
  }

  const dataDir = path.join(__dirname, "data");

  for (let testNum = 1; testNum <= 10; testNum++) {
    const paddedNum = String(testNum).padStart(2, "0");
    const transcriptFolder = path.join(sourceDir, `transcripts_T${paddedNum}`);
    const testDir = path.join(dataDir, `test${testNum}`);
    const parsedPath = path.join(testDir, "parsed.json");

    if (!fs.existsSync(transcriptFolder)) {
      console.warn(`\n⚠  Transcript folder not found: ${transcriptFolder}`);
      continue;
    }
    if (!fs.existsSync(parsedPath)) {
      console.warn(`\n⚠  parsed.json not found: ${parsedPath}`);
      continue;
    }

    console.log(`\nTest ${testNum} — ${transcriptFolder}`);

    // Parse all E24 .txt files
    const txtFiles = fs.readdirSync(transcriptFolder)
      .filter((f) => f.toLowerCase().endsWith(".txt"))
      .sort();

    const newLessons: ParsedLesson[] = [];
    for (const f of txtFiles) {
      newLessons.push(...parseTxtFile(path.join(transcriptFolder, f)));
    }
    newLessons.sort((a, b) => a.questionStart - b.questionStart);

    if (newLessons.length === 0) {
      console.warn(`  ⚠  No lessons parsed — skipping`);
      continue;
    }

    // Build lookup map from existing parsed.json by questionStart
    const rawJson = fs.readFileSync(parsedPath, "utf-8").replace(/^﻿/, "");
    const existing = JSON.parse(rawJson);
    const audioMap = new Map<number, { audioFiles: string[]; audioUrl: string; audioDuration: number }>();
    for (const lesson of existing.lessons) {
      audioMap.set(lesson.questionStart, {
        audioFiles: lesson.audioFiles,
        audioUrl: lesson.audioUrl,
        audioDuration: lesson.audioDuration,
      });
    }

    // Merge: new transcript content + existing audio data
    const mergedLessons: LessonDef[] = newLessons.map((nl) => {
      const audio = audioMap.get(nl.questionStart) ?? {
        audioFiles: [],
        audioUrl: "",
        audioDuration: 0,
      };

      if (!audioMap.has(nl.questionStart)) {
        console.warn(`  ⚠  No audio data for Q${nl.questionStart}–${nl.questionEnd}`);
      }

      const title =
        nl.questionStart === nl.questionEnd
          ? `Question ${nl.questionStart}`
          : `Questions ${nl.questionStart}–${nl.questionEnd}`;

      return {
        title,
        questionStart: nl.questionStart,
        questionEnd: nl.questionEnd,
        part: nl.part,
        transcriptFull: nl.transcriptFull,
        sentences: nl.sentences,
        correctOption: nl.correctOption,
        explanation: "",
        audioFiles: audio.audioFiles,
        audioUrl: audio.audioUrl,
        audioDuration: audio.audioDuration,
      };
    });

    // Write updated parsed.json (keep top-level metadata unchanged)
    const updated = {
      ...existing,
      lessons: mergedLessons,
    };

    fs.writeFileSync(parsedPath, JSON.stringify(updated, null, 2), "utf-8");

    const totalBlanks = mergedLessons.reduce(
      (s, l) => s + l.sentences.reduce((ss, sen) => ss + sen.blanks.length, 0),
      0
    );
    const missingAudio = mergedLessons.filter((l) => !l.audioUrl).length;

    console.log(`  ✓ ${mergedLessons.length} lessons, ${totalBlanks} blanks`);
    if (missingAudio > 0) console.log(`  ⚠  ${missingAudio} lessons missing audioUrl`);
    for (const p of [1, 2, 3, 4]) {
      const count = mergedLessons.filter((l) => l.part === p).length;
      if (count > 0) console.log(`    Part ${p}: ${count} lessons`);
    }
  }

  console.log("\n✅  Done! Run import-content.ts to push updates to DB.\n");
}

main();
