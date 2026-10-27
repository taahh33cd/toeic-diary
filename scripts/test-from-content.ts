/**
 * Đo nguồn "sinh bộ từ nội dung đã học" trên dữ liệu thật của một học viên.
 *
 *   npx tsx scripts/test-from-content.ts [studentCode]
 *
 * Gọi Gemini thật nên tốn quota — chạy khi cần đánh giá, không cắm vào CI.
 */

import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { layVanBan, listSources, rutTuVung, type ContentSource } from "@/lib/vocab/from-content";

const NGUON: ContentSource[] = ["lesson", "reading", "wrong-answers", "error-log"];

function cat(s: string, n: number) {
  const m = s.replace(/\s+/g, " ").trim();
  return m.length > n ? m.slice(0, n - 1) + "…" : m;
}

async function main() {
  const code = process.argv[2];
  const user = code
    ? await prisma.profile.findFirst({ where: { studentCode: code }, select: { id: true, studentCode: true } })
    : // Không truyền mã thì lấy học viên có nhiều dữ liệu nhất để kiểm cho đủ nguồn
      await prisma.profile.findFirst({
        where: { studentCode: { not: null }, fullTestAttempts: { some: { status: "done" } } },
        select: { id: true, studentCode: true },
      });

  if (!user) {
    console.log("Không tìm thấy học viên phù hợp.");
    return;
  }
  console.log(`Học viên: ${user.studentCode}\n`);

  let tongLoi = 0;

  for (const source of NGUON) {
    console.log(`\n${"═".repeat(70)}\nNGUỒN: ${source}`);
    const options = await listSources(user.id, user.studentCode, source);
    console.log(`  ${options.length} lựa chọn`);
    if (options.length === 0) {
      console.log("  (học viên này chưa có dữ liệu cho nguồn đó — bỏ qua)");
      continue;
    }
    for (const o of options.slice(0, 3)) {
      console.log(`    · ${o.label}${o.note ? `  [${o.note}]` : ""}`);
    }

    const chon = options[0];
    const { text, label } = await layVanBan(user.id, user.studentCode, source, chon.id);
    console.log(`\n  Lấy: ${label}`);
    console.log(`  Văn bản ${text.length} ký tự: "${cat(text, 150)}"`);

    if (!text.trim()) {
      console.log("  ✗ không lấy được văn bản");
      tongLoi++;
      continue;
    }

    const t0 = Date.now();
    const cards = await rutTuVung(text, 8);
    const giay = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n  AI rút ${cards.length} từ trong ${giay}s:`);
    for (const c of cards) {
      console.log(`    ${c.word.padEnd(18)} ${(c.ipa ?? "—").padEnd(20)} ${c.meaningVi ?? "—"}`);
      if (c.example) console.log(`      vd: ${cat(c.example, 70)}`);
    }

    // Bất biến
    if (cards.length === 0) {
      console.log("  ✗ không rút được từ nào");
      tongLoi++;
      continue;
    }
    const thieuNghia = cards.filter((c) => !c.meaningVi).length;
    const thieuVd = cards.filter((c) => !c.example).length;
    const chepLai = cards.filter(
      (c) => c.example && text.toLowerCase().includes(c.example.toLowerCase().slice(0, 40))
    );
    console.log(
      `  ${thieuNghia === 0 ? "✓" : "✗"} mọi từ có nghĩa (thiếu ${thieuNghia})\n` +
        `  ${thieuVd === 0 ? "✓" : "✗"} mọi từ có ví dụ (thiếu ${thieuVd})\n` +
        `  ${chepLai.length === 0 ? "✓" : "✗"} ví dụ không chép lại câu trong bài (${chepLai.length} câu chép)`
    );
    if (thieuNghia > 0 || thieuVd > 0) tongLoi++;
  }

  console.log(`\n${"═".repeat(70)}`);
  console.log(tongLoi === 0 ? "Mọi nguồn có dữ liệu đều đạt." : `${tongLoi} nguồn có vấn đề.`);
  await prisma.$disconnect();
  process.exit(tongLoi > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
