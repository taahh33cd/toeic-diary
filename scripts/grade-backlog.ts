/**
 * Chấm bù những bài đã gửi còn nằm chờ, cho các part đã có AI chấm.
 *
 * Chạy một lượt sau khi cắm thêm một part vào engine:
 *   npx tsx scripts/grade-backlog.ts            # xem sẽ chấm bài nào (không ghi)
 *   npx tsx scripts/grade-backlog.ts --apply    # ghi vào DB
 *   npx tsx scripts/grade-backlog.ts --apply --limit 3
 *
 * Bỏ qua bài đã có `feedback` (bài học viên xin thầy chấm lại) và bài nháp.
 * Không tính vào hạn mức mỗi ngày của học viên, không gửi thông báo —
 * học viên thấy nhận xét khi mở sổ tay.
 */

import "./env";
import pg from "pg";
import {
  AI_GRADABLE_UNITS,
  estimateBand,
  sanitizeItems,
  scaleFor,
} from "../lib/submissions";
import { aiConfigured, gradeSubmission } from "../lib/ai/grade";

type Row = {
  id: string;
  skill: string;
  unit: string;
  test_key: string;
  title: string;
  items: unknown;
};

async function main() {
  const apply = process.argv.includes("--apply");
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg !== -1 ? Number(process.argv[limitArg + 1]) || 50 : 50;

  if (!aiConfigured()) throw new Error("Thiếu GEMINI_API_KEY");

  const pairs = Object.entries(AI_GRADABLE_UNITS).flatMap(([skill, units]) =>
    units.map((unit) => ({ skill, unit })),
  );
  if (pairs.length === 0) {
    console.log("Chưa part nào có AI chấm.");
    return;
  }
  console.log(`Part có AI chấm: ${pairs.map((p) => `${p.skill} ${p.unit}`).join(", ")}`);

  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  const { rows } = await c.query<Row>(
    `SELECT id, skill, unit, test_key, title, items
       FROM skill_submissions
      WHERE status = 'submitted' AND feedback IS NULL
        AND (skill, unit) IN (${pairs.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ")})
      ORDER BY submitted_at ASC
      LIMIT ${limit}`,
    pairs.flatMap((p) => [p.skill, p.unit]),
  );

  console.log(`${rows.length} bài chờ chấm${apply ? "" : " (chạy thử, không ghi DB)"}\n`);

  let ok = 0;
  let failed = 0;
  for (const r of rows) {
    const items = sanitizeItems(r.items);
    try {
      const feedback = await gradeSubmission({
        skill: r.skill,
        unit: r.unit,
        testKey: r.test_key,
        items,
      });
      if (!feedback) {
        console.log(`– ${r.title}: engine bỏ qua`);
        continue;
      }
      // Chỉ bài thi thử trọn bộ mới quy ra 0-200 (xem route chấm).
      const band = r.unit === "mock" ? estimateBand(feedback, scaleFor(r.skill, r.unit)) : null;
      const scores = feedback.items.map((f) => f.score ?? "–").join("/");

      if (apply) {
        await c.query(
          `UPDATE skill_submissions
              SET feedback = $2, status = 'graded', graded_at = now(), band = $3, updated_at = now()
            WHERE id = $1 AND status = 'submitted' AND feedback IS NULL`,
          [r.id, JSON.stringify(feedback), band],
        );
      }
      ok++;
      console.log(`✓ ${r.title} — điểm ${scores}, ${feedback.annotations?.length ?? 0} chỗ tô`);
    } catch (e) {
      failed++;
      console.log(`✗ ${r.title}: ${(e instanceof Error ? e.message : String(e)).slice(0, 160)}`);
    }
  }

  await c.end();
  console.log(`\nXong: ${ok} bài chấm được, ${failed} bài lỗi.${apply ? "" : " Thêm --apply để ghi vào DB."}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
