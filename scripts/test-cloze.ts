/**
 * Kiểm việc khoét lỗ câu ví dụ (lib/vocab/cloze.ts).
 *
 *   npx tsx scripts/test-cloze.ts
 *
 * Lỗi nguy hiểm nhất ở đây là tạo ra câu VẪN CÒN đáp án trong đề — kiểm kỹ
 * phần đó, kể cả trên dữ liệu thật trong DB.
 */

import "dotenv/config";
import { O_TRONG, taoChoTrong } from "@/lib/vocab/cloze";
import { prisma } from "@/lib/db/prisma";

let pass = 0;
let fail = 0;
function check(ten: string, dk: boolean, ct = "") {
  if (dk) { pass++; console.log(`  ✓ ${ten}`); }
  else { fail++; console.log(`  ✗ ${ten}${ct ? ` — ${ct}` : ""}`); }
}

console.log("1. Khoét đúng dạng nguyên thể");
{
  const r = taoChoTrong("Please send the invoice to the accounting department.", "invoice");
  check("khoét được", r !== null, "trả null");
  check("có ô trống", r?.includes(O_TRONG) === true, r ?? "");
  check("giữ nguyên phần còn lại", r === `Please send the ${O_TRONG} to the accounting department.`, r ?? "");
}

console.log("\n2. Khoét được cả khi câu dùng dạng đã chia");
{
  const ca: [string, string][] = [
    ["They negotiated a new contract with the client.", "negotiate"],
    ["The company is negotiating better terms this month.", "negotiate"],
    ["She reimburses employees for travel expenses monthly.", "reimburse"],
    ["All applicants must submit their forms by Friday.", "applicant"],
    ["The manager studies the report every single morning.", "study"],
    ["He stopped the machine before the inspection began.", "stop"],
  ];
  for (const [cau, tu] of ca) {
    const r = taoChoTrong(cau, tu);
    check(`"${tu}" trong "${cau.slice(0, 34)}…"`, r !== null && r.includes(O_TRONG), r ?? "null");
  }
}

console.log("\n3. KHÔNG BAO GIỜ để sót đáp án trong đề");
{
  const ca: [string, string][] = [
    ["They negotiated a new contract with the client.", "negotiate"],
    ["The company is negotiating better terms this month.", "negotiate"],
    ["Please send the invoice to the accounting department.", "invoice"],
    ["All applicants must submit their forms by Friday.", "applicant"],
    ["The report reports on quarterly figures for the board.", "report"],
  ];
  let sot = 0;
  for (const [cau, tu] of ca) {
    const r = taoChoTrong(cau, tu);
    if (!r) continue;
    // Chữ gốc không được xuất hiện lại dưới bất kỳ dạng nào
    const con = new RegExp(`\\b${tu.slice(0, Math.max(4, tu.length - 2))}`, "i").test(r);
    if (con) { sot++; console.log(`    sót: "${r}" (từ "${tu}")`); }
  }
  check("không câu nào còn sót gốc từ", sot === 0, `${sot} câu sót`);
}

console.log("\n4. Từ chối khi không chắc");
{
  check("câu không chứa từ → null", taoChoTrong("The weather is nice today here.", "invoice") === null);
  check("câu rỗng → null", taoChoTrong("", "invoice") === null);
  check("câu quá ngắn → null", taoChoTrong("Send the invoice now.", "invoice") === null,
    String(taoChoTrong("Send the invoice now.", "invoice")));
  check("cụm nhiều từ không khớp nguyên cụm → null",
    taoChoTrong("He will take it over tomorrow at the office.", "take over") === null);
}

console.log("\n5. Cụm nhiều từ khớp nguyên cụm thì khoét được");
{
  const r = taoChoTrong("The new manager will take over the department next week.", "take over");
  check("khoét được cụm", r !== null && r.includes(O_TRONG), r ?? "null");
  check("không còn chữ 'take over'", r !== null && !/take over/i.test(r), r ?? "");
}

async function kiemDuLieuThat() {
  console.log("\n6. Chạy trên TOÀN BỘ câu ví dụ thật trong DB");
  const the = await prisma.vocabCard.findMany({
    where: { example: { not: null } },
    select: { word: true, example: true },
    take: 500,
  });
  if (the.length === 0) {
    console.log("  (chưa có thẻ nào có ví dụ — bỏ qua)");
    return;
  }

  let khoetDuoc = 0;
  const sot: string[] = [];
  for (const c of the) {
    const r = taoChoTrong(c.example!, c.word);
    if (!r) continue;
    khoetDuoc++;
    const g = c.word.trim().toLowerCase();
    const canhBao = r
      .split(/[^a-zA-Z'-]+/)
      .filter(Boolean)
      .some((t) => t.toLowerCase().startsWith(g.slice(0, Math.max(4, g.length - 2))));
    if (canhBao) sot.push(`"${c.word}" → ${r}`);
  }

  console.log(`  ${khoetDuoc}/${the.length} thẻ khoét được (${Math.round((khoetDuoc / the.length) * 100)}%)`);
  check("không thẻ thật nào bị lộ đáp án", sot.length === 0,
    sot.slice(0, 3).join(" | "));
  check("tỷ lệ khoét được trên 50%", khoetDuoc / the.length > 0.5,
    `chỉ ${Math.round((khoetDuoc / the.length) * 100)}%`);
}

kiemDuLieuThat()
  .then(async () => {
    await prisma.$disconnect();
    console.log(`\n${"─".repeat(50)}\n${pass} đạt, ${fail} lỗi`);
    process.exit(fail > 0 ? 1 : 0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
