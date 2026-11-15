#!/usr/bin/env tsx
/**
 * check-timestamps.ts
 *
 * Soi mốc thời gian của từng bài trong một bộ đề, tìm những kiểu hỏng mà
 * học viên gặp phải khi nghe từng câu:
 *
 *   ZERO      mốc 0-0            → bấm vào câu, audio không chạy
 *   REVERSED  end <= start       → khoảng rỗng, phát xong ngay
 *   OVERLAP   câu sau bắt đầu trước khi câu trước kết thúc
 *   GAP       khoảng lặng dài giữa hai câu (nghe thiếu tiếng)
 *   OVERRUN   end vượt quá độ dài audio
 *   SLOW/FAST giây/từ lệch quá xa → cửa sổ lệch so với lời đọc
 *
 * Usage:
 *   tsx scripts/check-timestamps.ts <setSlug>...
 */

import "dotenv/config";
import { prisma } from "../lib/db/prisma";

const SUSPECT_FAST = 0.16; // s/từ — nhanh bất thường, cửa sổ ngắn hơn lời đọc
const SUSPECT_SLOW = 0.95; // s/từ — chậm bất thường, cửa sổ trùm sang câu khác
const BIG_GAP = 3.0; // giây lặng giữa hai câu

async function main() {
  const slugs = process.argv.slice(2);
  if (slugs.length === 0) {
    console.error("Usage: tsx scripts/check-timestamps.ts <setSlug>...");
    process.exit(1);
  }

  for (const slug of slugs) {
    const testSet = await prisma.testSet.findFirst({
      where: { slug },
      select: {
        name: true,
        slug: true,
        parts: {
          select: {
            partNumber: true,
            lessons: {
              select: {
                id: true,
                title: true,
                orderIndex: true,
                audioUrl: true,
                audioDuration: true,
                sentences: {
                  select: { orderIndex: true, content: true, startTime: true, endTime: true },
                  orderBy: { orderIndex: "asc" },
                },
              },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { partNumber: "asc" },
        },
      },
    });

    if (!testSet) {
      console.log(`\n### ${slug}: KHÔNG TÌM THẤY bộ đề\n`);
      continue;
    }

    console.log(`\n### ${testSet.name}  (${testSet.slug})`);

    let totalLessons = 0;
    let badLessons = 0;
    const counts: Record<string, number> = {};

    for (const part of testSet.parts) {
      for (const lesson of part.lessons) {
        totalLessons++;
        const s = lesson.sentences;
        const issues: string[] = [];

        if (s.length === 0) {
          issues.push("KHÔNG CÓ CÂU NÀO");
        }

        for (let i = 0; i < s.length; i++) {
          const cur = s[i];
          const words = cur.content.trim().split(/\s+/).length;
          const dur = cur.endTime - cur.startTime;
          const tag = `#${cur.orderIndex}`;

          if (cur.startTime === 0 && cur.endTime === 0) {
            issues.push(`${tag} ZERO mốc 0-0`);
          } else if (dur <= 0) {
            issues.push(`${tag} REVERSED ${cur.startTime.toFixed(2)}→${cur.endTime.toFixed(2)}`);
          } else {
            const perWord = dur / words;
            if (perWord < SUSPECT_FAST) {
              issues.push(`${tag} FAST ${perWord.toFixed(2)}s/từ (${words} từ trong ${dur.toFixed(2)}s)`);
            } else if (perWord > SUSPECT_SLOW) {
              issues.push(`${tag} SLOW ${perWord.toFixed(2)}s/từ (${words} từ trong ${dur.toFixed(2)}s)`);
            }
          }

          if (lesson.audioDuration && cur.endTime > lesson.audioDuration + 0.5) {
            issues.push(`${tag} OVERRUN end ${cur.endTime.toFixed(2)} > audio ${lesson.audioDuration.toFixed(2)}`);
          }

          if (i > 0) {
            const prev = s[i - 1];
            if (cur.startTime > 0 && prev.endTime > 0) {
              if (cur.startTime < prev.endTime - 0.05) {
                issues.push(`${tag} OVERLAP start ${cur.startTime.toFixed(2)} < prev end ${prev.endTime.toFixed(2)}`);
              } else if (cur.startTime - prev.endTime > BIG_GAP) {
                issues.push(`${tag} GAP ${(cur.startTime - prev.endTime).toFixed(2)}s lặng`);
              }
            }
          }
        }

        if (issues.length === 0) continue;
        badLessons++;
        for (const it of issues) {
          const kind = it.split(" ").find((w) => w === w.toUpperCase() && /[A-Z]{3}/.test(w)) ?? "OTHER";
          counts[kind] = (counts[kind] ?? 0) + 1;
        }
        const span = s.length
          ? `${s[0].startTime.toFixed(1)}–${Math.max(...s.map((x) => x.endTime)).toFixed(1)}s`
          : "—";
        console.log(
          `\nP${part.partNumber} · ${lesson.title}  (${s.length} câu, ${span}` +
            `${lesson.audioDuration ? `, audio ${lesson.audioDuration.toFixed(1)}s` : ", audio ?"})`
        );
        for (const it of issues) console.log(`    ${it}`);
      }
    }

    console.log(`\n${testSet.slug}: ${badLessons}/${totalLessons} bài có vấn đề`);
    console.log(
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k}=${v}`)
        .join("  ") || "(sạch)"
    );
  }

  await prisma.$disconnect();
}

main();
