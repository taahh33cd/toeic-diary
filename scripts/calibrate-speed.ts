/**
 * Đo ngưỡng "trả lời nhanh" của quiz từ vựng bằng answerMs THẬT.
 *
 *   npx tsx scripts/calibrate-speed.ts
 *   npx tsx scripts/calibrate-speed.ts --ngay=30     # chỉ lấy 30 ngày gần đây
 *
 * SPEED_THRESHOLD_MS trong lib/vocab/srs.ts hiện là PHỎNG ĐOÁN (6s/8s/15s).
 * Script này in phân vị thật để thay bằng số đo được. Nó KHÔNG tự sửa code —
 * đổi ngưỡng là đổi lịch ôn của mọi học viên, phải do người quyết định.
 *
 * Ngưỡng đề xuất lấy ở phân vị 70 của các câu TRẢ LỜI ĐÚNG: ý nghĩa của
 * "nhanh" là "nhanh so với chính học viên khi họ thật sự nhớ", nên câu sai
 * (thường là ngồi nghĩ lâu rồi đoán) không được tính vào.
 */

import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { SPEED_THRESHOLD_MS } from "@/lib/vocab/srs";

/** Dưới ngần này câu thì mọi con số đều là nhiễu. */
const TOI_THIEU = 30;

interface Hang {
  nhom: string;
  soCau: bigint;
  p25: number;
  p50: number;
  p70: number;
  p90: number;
  soNguoi: bigint;
}

function giay(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

async function main() {
  const argNgay = process.argv.find((a) => a.startsWith("--ngay="));
  const ngay = argNgay ? Number(argNgay.slice(7)) : 365;

  const rows = await prisma.$queryRaw<Hang[]>`
    SELECT CASE
             WHEN i.quiz_type LIKE '%-to-typing' THEN 'typing'
             WHEN i.quiz_type LIKE '%-to-image'  THEN 'choiceImage'
             ELSE 'choiceText'
           END AS nhom,
           count(*)                   AS "soCau",
           count(DISTINCT s.user_id)  AS "soNguoi",
           percentile_cont(0.25) WITHIN GROUP (ORDER BY i.answer_ms) AS p25,
           percentile_cont(0.50) WITHIN GROUP (ORDER BY i.answer_ms) AS p50,
           percentile_cont(0.70) WITHIN GROUP (ORDER BY i.answer_ms) AS p70,
           percentile_cont(0.90) WITHIN GROUP (ORDER BY i.answer_ms) AS p90
    FROM vocab_quiz_items i
    JOIN vocab_quiz_sessions s ON s.id = i.session_id
    WHERE i.answer_ms IS NOT NULL
      AND i.correct = true
      AND i.answer_ms BETWEEN 300 AND 120000
      AND s.finished_at > now() - make_interval(days => ${ngay})
    GROUP BY 1
    ORDER BY 1`;

  console.log(`\nDữ liệu ${ngay} ngày gần nhất, chỉ tính câu TRẢ LỜI ĐÚNG.`);
  console.log("Đã loại câu dưới 0,3s (bấm nhầm) và trên 120s (bỏ máy đi chỗ khác).\n");

  if (rows.length === 0) {
    console.log("Chưa có câu quiz nào. Chạy lại sau khi học viên dùng một thời gian.");
    await prisma.$disconnect();
    return;
  }

  console.log("nhóm          số câu  người   p25     p50     p70     p90     ngưỡng hiện tại");
  console.log("─".repeat(84));

  const deXuat: Record<string, number> = {};
  for (const r of rows) {
    const n = Number(r.soCau);
    const hienTai = SPEED_THRESHOLD_MS[r.nhom as keyof typeof SPEED_THRESHOLD_MS];
    console.log(
      `${r.nhom.padEnd(13)} ${String(n).padStart(6)} ${String(Number(r.soNguoi)).padStart(6)}  ` +
        `${giay(r.p25).padStart(6)}  ${giay(r.p50).padStart(6)}  ${giay(r.p70).padStart(6)}  ` +
        `${giay(r.p90).padStart(6)}   ${giay(hienTai)}`
    );
    if (n >= TOI_THIEU) deXuat[r.nhom] = Math.round(r.p70 / 500) * 500;
  }

  console.log("\n" + "─".repeat(84));

  const thieu = rows.filter((r) => Number(r.soCau) < TOI_THIEU);
  for (const r of thieu) {
    console.log(
      `⚠ ${r.nhom}: mới ${Number(r.soCau)} câu, cần ít nhất ${TOI_THIEU} — chưa đề xuất ngưỡng.`
    );
  }

  if (Object.keys(deXuat).length === 0) {
    console.log("\nChưa nhóm nào đủ dữ liệu. Giữ nguyên ngưỡng phỏng đoán hiện tại.");
  } else {
    console.log("\nĐỀ XUẤT (phân vị 70, làm tròn 0,5s) — sửa tay vào lib/vocab/srs.ts:\n");
    console.log("export const SPEED_THRESHOLD_MS = {");
    for (const k of ["choiceText", "choiceImage", "typing"] as const) {
      const moi = deXuat[k];
      const cu = SPEED_THRESHOLD_MS[k];
      const ghiChu = moi === undefined ? "  // chưa đủ dữ liệu, giữ nguyên" : moi === cu ? "  // không đổi" : `  // trước: ${giay(cu)}`;
      console.log(`  ${k}: ${(moi ?? cu).toLocaleString("en-US").replace(/,/g, "_")},${ghiChu}`);
    }
    console.log("};");
    console.log(
      "\nĐổi ngưỡng là đổi lịch ôn của MỌI học viên — cân nhắc rồi hẵng sửa, và\n" +
        "chạy lại script này sau vài tuần để xem số có ổn định không."
    );
  }

  // Một học viên làm quá nhiều câu sẽ kéo lệch phân vị — cảnh báo nếu có
  const lech = await prisma.$queryRaw<{ user_id: string; n: bigint }[]>`
    SELECT s.user_id, count(*) AS n
    FROM vocab_quiz_items i JOIN vocab_quiz_sessions s ON s.id = i.session_id
    WHERE i.answer_ms IS NOT NULL AND i.correct = true
    GROUP BY s.user_id ORDER BY count(*) DESC LIMIT 3`;
  const tong = rows.reduce((n, r) => n + Number(r.soCau), 0);
  const dauTien = lech[0] ? Number(lech[0].n) : 0;
  if (tong > 0 && dauTien / tong > 0.6) {
    console.log(
      `\n⚠ ${Math.round((dauTien / tong) * 100)}% số câu đến từ MỘT học viên — ` +
        "phân vị đang phản ánh một người chứ không phải cả lớp."
    );
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
