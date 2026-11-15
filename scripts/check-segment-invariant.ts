#!/usr/bin/env tsx
/**
 * Kiểm chứng thay đổi ở lib/practice/segment.ts không làm ngắn khoảng nghe của
 * bất kỳ bài nào đang chạy, trên TOÀN BỘ dữ liệu.
 *
 * Bất biến phải giữ, với mọi câu có mốc hợp lệ:
 *   start      <= startTime   (vẫn tới được đầu cửa sổ trong DB)
 *   playUntil  >= endTime     (vẫn phát hết cửa sổ trong DB)
 * Nghĩa là thay đổi chỉ CO phần bù thêm, không bao giờ cắt vào cửa sổ DB.
 *
 * Đồng thời đo xem phần bù bị co ở bao nhiêu câu, và co nhiều nhất bấy nhiêu —
 * để biết thay đổi thực sự tác động tới đâu.
 */
import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { buildSegmentWindows, LEAD_IN, TAIL_PAD } from "../lib/practice/segment";

// Usage: tsx scripts/check-segment-invariant.ts

async function main() {
  const lessons = await prisma.lesson.findMany({
    select: {
      id: true, title: true, audioDuration: true,
      part: { select: { partNumber: true, testSet: { select: { name: true, slug: true } } } },
      sentences: { select: { content: true, startTime: true, endTime: true }, orderBy: { orderIndex: "asc" } },
    },
  });

  let n = 0, viol = 0, outside = 0;
  let headTrim = 0, tailTrim = 0;
  let maxHead = 0, maxTail = 0;
  const bySet = new Map<string, number>();
  const violations: string[] = [];

  for (const l of lessons) {
    const ws = buildSegmentWindows(l.sentences, l.audioDuration ?? 0);
    for (let i = 0; i < l.sentences.length; i++) {
      const s = l.sentences[i];
      const w = ws[i];
      if (s.startTime <= 0 && s.endTime <= 0) continue;
      n++;

      // bất biến
      if (s.startTime > 0 && w.start > s.startTime + 0.001) {
        viol++;
        violations.push(`${l.part.testSet.name} P${l.part.partNumber} ${l.title} #${i}: start ${w.start} > DB ${s.startTime}`);
      }
      if (s.endTime > 0 && Number.isFinite(w.playUntil) && w.playUntil < s.endTime - 0.001) {
        const dur = l.audioDuration ?? 0;
        // Mốc cuối trong DB vượt ra ngoài file: phần bị kẹp đi vốn KHÔNG CÓ
        // tiếng nào để nghe. Kẹp xuống độ dài file là đúng, và còn chữa được
        // lỗi cũ (t >= end + TAIL_PAD không bao giờ tới nên không tự phát lại).
        if (dur > 0 && s.endTime > dur && Math.abs(w.playUntil - dur) < 0.01) {
          outside++;
        } else {
          viol++;
          violations.push(`${l.part.testSet.name} P${l.part.partNumber} ${l.title} #${i}: playUntil ${w.playUntil} < DB ${s.endTime} (audio ${dur})`);
        }
      }

      // phần bù bị co so với cách cộng cứng cũ
      if (s.startTime > 0) {
        const oldStart = Math.max(0, s.startTime - LEAD_IN);
        const d = w.start - oldStart;
        if (d > 0.001) { headTrim++; maxHead = Math.max(maxHead, d); bySet.set(l.part.testSet.slug, (bySet.get(l.part.testSet.slug) ?? 0) + 1); }
      }
      if (s.endTime > 0 && Number.isFinite(w.playUntil)) {
        const oldEnd = s.endTime + TAIL_PAD;
        const d = oldEnd - w.playUntil;
        if (d > 0.001) { tailTrim++; maxTail = Math.max(maxTail, d); bySet.set(l.part.testSet.slug, (bySet.get(l.part.testSet.slug) ?? 0) + 1); }
      }
    }
  }

  console.log(`${lessons.length} bài, ${n} câu có mốc hợp lệ\n`);
  console.log(`VI PHẠM bất biến (cắt vào tiếng thật)  : ${viol}`);
  console.log(`kẹp xuống độ dài file (mốc DB vượt file): ${outside}  — không mất tiếng nào`);
  violations.slice(0, 15).forEach((v) => console.log(`  ! ${v}`));
  console.log(`\nphần bù ĐẦU bị co : ${headTrim} câu (nhiều nhất ${maxHead.toFixed(2)}s / ngân sách ${LEAD_IN}s)`);
  console.log(`phần bù ĐUÔI bị co: ${tailTrim} câu (nhiều nhất ${maxTail.toFixed(2)}s / ngân sách ${TAIL_PAD}s)`);
  console.log(`\nTác động theo bộ đề (số lần co):`);
  [...bySet.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([k, v]) => console.log(`  ${k.padEnd(22)} ${v}`));
  await prisma.$disconnect();
}
main();
