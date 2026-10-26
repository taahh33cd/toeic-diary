/**
 * Kiểm công thức SRS (lib/vocab/srs.ts applyReview) — hàm thuần, không cần DB.
 *
 *   npx tsx scripts/test-srs-apply.ts
 */

import {
  applyReview,
  emptyState,
  isDueRow,
  MASTERY_THRESHOLD,
  speedThresholdFor,
  SPEED_THRESHOLD_MS,
  type SrsState,
} from "@/lib/vocab/srs";

let pass = 0;
let fail = 0;

function check(ten: string, dieuKien: boolean, chiTiet = "") {
  if (dieuKien) {
    pass++;
    console.log(`  ✓ ${ten}`);
  } else {
    fail++;
    console.log(`  ✗ ${ten}${chiTiet ? ` — ${chiTiet}` : ""}`);
  }
}

const NOW = new Date("2026-10-26T10:00:00Z");

/** Số ngày giữa dueAt và NOW. */
function cachNgay(s: SrsState): number | null {
  if (!s.dueAt) return null;
  const moc = Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), NOW.getUTCDate());
  return Math.round((s.dueAt.getTime() - moc) / 86_400_000);
}

console.log("1. Từ mới");
{
  const dung = applyReview(emptyState(), { kind: "quiz", correct: true, answerMs: 2000, quizType: "word-to-meaning" }, NOW);
  check("đúng lần đầu → ôn lại sau 1 ngày", cachNgay(dung) === 1, `${cachNgay(dung)} ngày`);
  check("repCount lên 1", dung.repCount === 1);
  check("ease nhích lên 2.55", Math.abs(dung.ease - 2.55) < 1e-9, `${dung.ease}`);

  const sai = applyReview(emptyState(), { kind: "quiz", correct: false, quizType: "word-to-meaning" }, NOW);
  check("sai lần đầu → đến hạn ngay hôm nay", cachNgay(sai) === 0, `${cachNgay(sai)} ngày`);
  check("repCount vẫn 0", sai.repCount === 0);
  check("wrongCount lên 1", sai.wrongCount === 1);
  check("ease hạ còn 2.3", Math.abs(sai.ease - 2.3) < 1e-9, `${sai.ease}`);
}

console.log("\n2. Nhanh vs chậm");
{
  const goc: SrsState = { ...emptyState(), repCount: 3, intervalDays: 7, ease: 2.5 };
  const nguong = speedThresholdFor("word-to-meaning");
  check("ngưỡng dạng chọn chữ = 6s", nguong === SPEED_THRESHOLD_MS.choiceText);

  const nhanh = applyReview(goc, { kind: "quiz", correct: true, answerMs: nguong - 1, quizType: "word-to-meaning" }, NOW);
  const cham = applyReview(goc, { kind: "quiz", correct: true, answerMs: nguong + 1, quizType: "word-to-meaning" }, NOW);
  check("đúng nhanh: 7 × 2.5 = 18 ngày", cachNgay(nhanh) === 18, `${cachNgay(nhanh)}`);
  check("đúng chậm: 7 × 2.5 × 0.8 = 14 ngày", cachNgay(cham) === 14, `${cachNgay(cham)}`);
  check("nhanh thì ease tăng, chậm thì không", nhanh.ease > goc.ease && cham.ease === goc.ease,
    `nhanh=${nhanh.ease} chậm=${cham.ease}`);
  check("dạng gõ được ngưỡng 15s", speedThresholdFor("listen-to-typing") === SPEED_THRESHOLD_MS.typing);
  check("dạng ảnh được ngưỡng 8s", speedThresholdFor("listen-to-image") === SPEED_THRESHOLD_MS.choiceImage);
  check("không có answerMs thì coi như nhanh", cachNgay(applyReview(goc, { kind: "quiz", correct: true }, NOW)) === 18);
}

console.log("\n3. Lật thẻ — nửa trọng số");
{
  const denHan: SrsState = {
    ...emptyState(), repCount: 3, intervalDays: 7, ease: 2.5,
    dueAt: new Date("2026-10-26T00:00:00Z"),
  };
  const thuoc = applyReview(denHan, { kind: "flip", known: true }, NOW);
  // hệ số lật = 1 + (2.5-1)/2 = 1.75 → 7 × 1.75 = 12.25 → 12; quiz đúng nhanh cho 18
  check("lật Thuộc: 7 × 1.75 ≈ 12 ngày, ít hơn quiz (18)", cachNgay(thuoc) === 12, `${cachNgay(thuoc)}`);
  check("repCount lên 1", thuoc.repCount === 4);
  check("ease không đổi khi lật thẻ", thuoc.ease === denHan.ease, `${thuoc.ease}`);

  const chuaThuoc = applyReview(denHan, { kind: "flip", known: false }, NOW);
  check("lật Chưa thuộc → đến hạn hôm nay", cachNgay(chuaThuoc) === 0, `${cachNgay(chuaThuoc)}`);
  check("lật Chưa thuộc KHÔNG tính là trả lời sai", chuaThuoc.wrongCount === 0, `wrongCount=${chuaThuoc.wrongCount}`);
  check("ease chỉ hạ 0.10 (quiz sai hạ 0.20)", Math.abs(chuaThuoc.ease - 2.4) < 1e-9, `${chuaThuoc.ease}`);
}

console.log("\n4. Lật thẻ chưa tới hạn thì không đẩy lịch");
{
  const chuaToiHan: SrsState = {
    ...emptyState(), repCount: 3, intervalDays: 7, ease: 2.5,
    dueAt: new Date("2026-11-02T00:00:00Z"), // còn 7 ngày
  };
  const xem = applyReview(chuaToiHan, { kind: "flip", known: true }, NOW);
  check("dueAt giữ nguyên", xem.dueAt?.getTime() === chuaToiHan.dueAt?.getTime());
  check("repCount giữ nguyên", xem.repCount === 3, `${xem.repCount}`);
  check("vẫn ghi nhận đã xem", xem.seenCount === 1, `${xem.seenCount}`);

  // Nhưng quiz thì vẫn tính, dù chưa tới hạn — học viên chủ động làm quiz sớm
  const quizSom = applyReview(chuaToiHan, { kind: "quiz", correct: true, answerMs: 1000, quizType: "word-to-meaning" }, NOW);
  check("quiz sớm vẫn được tính", quizSom.repCount === 4 && cachNgay(quizSom) === 18, `${cachNgay(quizSom)}`);
}

console.log("\n5. Thuộc hẳn và trần giãn cách");
{
  let s: SrsState = { ...emptyState(), repCount: MASTERY_THRESHOLD - 1, intervalDays: 30, ease: 2.5 };
  s = applyReview(s, { kind: "quiz", correct: true, answerMs: 1000, quizType: "word-to-meaning" }, NOW);
  check("đủ 10 lần đúng → mastered", s.mastered === true, `repCount=${s.repCount}`);
  check("giãn cách chặn ở trần 60 ngày", s.intervalDays === 60, `${s.intervalDays}`);
  check("từ đã thuộc không còn đến hạn", isDueRow(s, NOW) === false);

  const saiLai = applyReview(s, { kind: "quiz", correct: false, quizType: "word-to-meaning" }, NOW);
  check("thuộc rồi sai lại → bỏ cờ mastered", saiLai.mastered === false);
  check("tính là 1 lapse", saiLai.lapses === 1, `${saiLai.lapses}`);
  check("đến hạn lại ngay", isDueRow(saiLai, NOW) === true);
  check("repCount không bị trừ", saiLai.repCount === MASTERY_THRESHOLD, `${saiLai.repCount}`);

  const dungLai = applyReview(saiLai, { kind: "quiz", correct: true, answerMs: 1000, quizType: "word-to-meaning" }, NOW);
  check("sai rồi đúng lại → bắt đầu lại từ 1 ngày", cachNgay(dungLai) === 1, `${cachNgay(dungLai)}`);
}

console.log("\n6. Chặn ease trong khoảng [1.3, 2.8]");
{
  let s = { ...emptyState(), repCount: 2, intervalDays: 3, ease: 1.4 };
  s = applyReview(s, { kind: "quiz", correct: false }, NOW);
  check("ease không xuống dưới 1.3", s.ease === 1.3, `${s.ease}`);

  let t = { ...emptyState(), repCount: 2, intervalDays: 3, ease: 2.78 };
  t = applyReview(t, { kind: "quiz", correct: true, answerMs: 500, quizType: "word-to-meaning" }, NOW);
  check("ease không vượt 2.8", t.ease === 2.8, `${t.ease}`);
}

console.log("\n7. Lịch phải LUÔN tiến, không được đứng im");
{
  // Lỗi mà test này bắt được: hệ số ease × 0.5 cho round(1 × 1.25) = 1, nên lật
  // thẻ mãi không thoát mốc 1 ngày — mọi từ đến hạn lại mỗi ngày vĩnh viễn.
  let s: SrsState = { ...emptyState(), repCount: 1, intervalDays: 1, ease: 2.5 };
  const moc: number[] = [];
  for (let i = 0; i < 5; i++) {
    s = applyReview(s, { kind: "flip", known: true }, NOW);
    moc.push(s.intervalDays);
    s = { ...s, dueAt: new Date(NOW.getTime() - 86_400_000) }; // giả lập đã tới hạn
  }
  check(
    "lật Thuộc 5 lần: giãn cách tăng đều",
    moc.every((v, i) => i === 0 || v > moc[i - 1]),
    `${moc.join(" → ")} ngày`
  );

  const yeu = applyReview(
    { ...emptyState(), repCount: 1, intervalDays: 10, ease: 1.3 },
    { kind: "flip", known: true },
    NOW
  );
  check("ease thấp nhất (1.3) từ mốc 10 ngày vẫn tiến", (cachNgay(yeu) ?? 0) >= 11, `${cachNgay(yeu)}`);

  const quizCham = applyReview(
    { ...emptyState(), repCount: 1, intervalDays: 10, ease: 1.3 },
    { kind: "quiz", correct: true, answerMs: 99_000, quizType: "word-to-meaning" },
    NOW
  );
  check("quiz đúng chậm với ease 1.3 cũng không đứng im", (cachNgay(quizCham) ?? 0) >= 11, `${cachNgay(quizCham)}`);
}

console.log(`\n${"─".repeat(50)}\n${pass} đạt, ${fail} lỗi`);
process.exit(fail > 0 ? 1 : 0);
