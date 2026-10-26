/**
 * Đo chất lượng chuỗi điền nghĩa (lib/vocab/enrich.ts) trên từ TOEIC thật.
 *
 *   npx tsx scripts/test-enrich.ts
 *
 * Gọi API thật (từ điển + Gemini) nên tốn quota — chạy khi cần đánh giá, đừng
 * cắm vào CI. In bảng để soi mắt thường, và kiểm vài bất biến cứng.
 */

import "dotenv/config";
import { enrichWords } from "@/lib/vocab/enrich";

const BO_TU = [
  // thương mại — lõi TOEIC
  "negotiate", "invoice", "warehouse", "reimburse", "itinerary",
  // dễ sai loại từ
  "complimentary", "subsequent",
  // cụm nhiều từ
  "take over", "due diligence",
  // từ hiếm, từ điển hay trượt
  "onboarding",
  // trùng để kiểm lọc
  "NEGOTIATE",
];

function cat(s: string | undefined, n: number) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

async function main() {
  console.log(`Điền cho ${BO_TU.length} từ (có 1 bản trùng)…\n`);
  const t0 = Date.now();
  const kq = await enrichWords(BO_TU);
  const giay = ((Date.now() - t0) / 1000).toFixed(1);

  console.log("từ".padEnd(16) + "IPA".padEnd(20) + "loại".padEnd(6) + "nghĩa".padEnd(30) + "nguồn");
  console.log("─".repeat(96));
  for (const r of kq) {
    console.log(
      cat(r.word, 15).padEnd(16) +
        cat(r.ipa, 19).padEnd(20) +
        cat(r.pos, 5).padEnd(6) +
        cat(r.meaningVi, 29).padEnd(30) +
        (r.viSource ?? "—")
    );
  }

  console.log("\nVí dụ sinh ra:");
  for (const r of kq.slice(0, 5)) {
    console.log(`  ${r.word}: ${cat(r.example, 80)}`);
  }

  // ── Bất biến ──
  let loi = 0;
  const check = (ten: string, dk: boolean, ct = "") => {
    console.log(`  ${dk ? "✓" : "✗"} ${ten}${dk ? "" : ` — ${ct}`}`);
    if (!dk) loi++;
  };

  console.log("\nKiểm:");
  check("lọc trùng khác hoa/thường", kq.length === BO_TU.length - 1, `trả về ${kq.length}`);

  const coNghia = kq.filter((r) => r.meaningVi).length;
  check(
    `≥90% có nghĩa tiếng Việt (${coNghia}/${kq.length})`,
    coNghia / kq.length >= 0.9,
    `chỉ ${Math.round((coNghia / kq.length) * 100)}%`
  );

  const coIpa = kq.filter((r) => r.ipa).length;
  check(`có IPA cho phần lớn từ đơn (${coIpa}/${kq.length})`, coIpa >= 6, `chỉ ${coIpa}`);

  const ipaXau = kq.filter((r) => r.ipa && (r.ipa.startsWith("//") || !r.ipa.startsWith("/") || !r.ipa.endsWith("/")));
  check("IPA luôn đúng dạng /.../, không có // thừa", ipaXau.length === 0,
    ipaXau.map((r) => `${r.word}=${r.ipa}`).join(", "));

  const viDuSai = kq.filter(
    (r) => r.example && !r.example.toLowerCase().includes(r.word.toLowerCase().split(" ")[0])
  );
  check("câu ví dụ có dùng chính từ đó", viDuSai.length <= 1,
    viDuSai.map((r) => r.word).join(", "));

  const viDai = kq.filter((r) => r.meaningVi && r.meaningVi.length > 60);
  check("nghĩa ngắn gọn (≤60 ký tự)", viDai.length === 0,
    viDai.map((r) => `${r.word}="${r.meaningVi}"`).join(" | "));

  console.log(`\nMất ${giay}s cho ${kq.length} từ · ${loi === 0 ? "đạt hết" : `${loi} mục không đạt`}`);
  process.exit(loi > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
