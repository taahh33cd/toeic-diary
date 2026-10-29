/**
 * Kiểm engine sinh câu hỏi quiz (lib/vocab/quiz.ts) — hàm thuần, không cần DB.
 *
 *   npx tsx scripts/test-quiz.ts
 */

import { chamGo, laDangGo, sinhCauHoi, type QuizType } from "@/lib/vocab/quiz";
import type { CardRow, ProgressRow } from "@/lib/vocab/client";

let pass = 0;
let fail = 0;
function check(ten: string, dk: boolean, ct = "") {
  if (dk) { pass++; console.log(`  ✓ ${ten}`); }
  else { fail++; console.log(`  ✗ ${ten}${ct ? ` — ${ct}` : ""}`); }
}

function the(
  word: string,
  o: { pos?: string; nghia?: string | null; anh?: string | null } = {}
): CardRow {
  return {
    id: `c_${word}`,
    word,
    wordKey: word.toLowerCase(),
    ipa: `/${word}/`,
    pos: o.pos ?? "n",
    meaningVi: o.nghia === undefined ? `nghĩa ${word}` : o.nghia,
    definition: null,
    example: null,
    imageUrl: o.anh === undefined ? null : o.anh,
    audioUrl: null,
    order: 0,
  };
}

function td(wordKey: string, o: Partial<ProgressRow> = {}): ProgressRow {
  return {
    wordKey,
    repCount: 0,
    intervalDays: 0,
    mastered: false,
    wrongCount: 0,
    seenCount: 0,
    lastReview: null,
    dueAt: null,
    ...o,
  };
}

const SAU_THE = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"].map((w) => the(w));

console.log("1. Mỗi thẻ sinh câu cho MỌI dạng đã chọn (lỗi của bản gốc)");
{
  const modes: QuizType[] = ["word-to-meaning", "meaning-to-word", "meaning-to-typing"];
  const { cauHoi } = sinhCauHoi(SAU_THE, [], { modes });
  check(
    "6 thẻ × 3 dạng = 18 câu, không phải 6",
    cauHoi.length === 18,
    `ra ${cauHoi.length} câu`
  );
  const soDang = new Set(cauHoi.map((c) => c.type)).size;
  check("đủ cả 3 dạng xuất hiện", soDang === 3, `${soDang} dạng`);
  const moiTu = new Map<string, number>();
  for (const c of cauHoi) moiTu.set(c.wordKey, (moiTu.get(c.wordKey) ?? 0) + 1);
  check("mỗi từ đúng 3 câu", [...moiTu.values()].every((n) => n === 3));
}

console.log("\n2. Thẻ thiếu dữ liệu bị bỏ đúng dạng, không làm hỏng cả bộ");
{
  const cards = [
    the("alpha", { anh: "http://a.jpg" }),
    the("beta", { anh: "http://b.jpg" }),
    the("gamma", { anh: "http://c.jpg" }),
    the("delta", { anh: "http://d.jpg" }),
    the("epsilon"), // không ảnh
    the("zeta", { nghia: null }), // không nghĩa
  ];
  const { cauHoi, boQua } = sinhCauHoi(cards, [], {
    modes: ["word-to-image", "word-to-meaning"],
  });
  const anh = cauHoi.filter((c) => c.type === "word-to-image");
  const nghia = cauHoi.filter((c) => c.type === "word-to-meaning");
  check("dạng ảnh chỉ lấy 4 thẻ có ảnh", anh.length === 4, `${anh.length}`);
  check("dạng nghĩa bỏ thẻ không nghĩa", nghia.length === 5, `${nghia.length}`);
  check("đếm được số thẻ bỏ vì thiếu ảnh", boQua.thieuAnh === 2, `${boQua.thieuAnh}`);
  check("đếm được số thẻ bỏ vì thiếu nghĩa", boQua.thieuNghia === 1, `${boQua.thieuNghia}`);
}

console.log("\n3. Phương án: đúng 4 lựa chọn, đúng 1 đáp án đúng");
{
  const { cauHoi } = sinhCauHoi(SAU_THE, [], { modes: ["word-to-meaning"] });
  const saiSo = cauHoi.filter((c) => (c.phuongAn?.length ?? 0) !== 4);
  check("mọi câu trắc nghiệm có 4 phương án", saiSo.length === 0, `${saiSo.length} câu lệch`);
  const saiDung = cauHoi.filter((c) => c.phuongAn!.filter((p) => p.dung).length !== 1);
  check("mỗi câu đúng 1 đáp án đúng", saiDung.length === 0, `${saiDung.length} câu lệch`);
  const trungPA = cauHoi.filter(
    (c) => new Set(c.phuongAn!.map((p) => p.id)).size !== c.phuongAn!.length
  );
  check("phương án không trùng nhau", trungPA.length === 0, `${trungPA.length} câu trùng`);
  const tuTrongPA = cauHoi.filter((c) => c.phuongAn!.some((p) => p.id === c.wordKey && !p.dung));
  check("từ của chính câu không xuất hiện làm nhiễu", tuTrongPA.length === 0);
}

console.log("\n4. Nhiễu ưu tiên cùng loại từ");
{
  const cards = [
    the("run", { pos: "v" }), the("walk", { pos: "v" }),
    the("jump", { pos: "v" }), the("swim", { pos: "v" }),
    the("table", { pos: "n" }), the("chair", { pos: "n" }),
    the("quickly", { pos: "adv" }), the("slowly", { pos: "adv" }),
  ];
  const { cauHoi } = sinhCauHoi(cards, [], { modes: ["word-to-meaning"] });
  const cauV = cauHoi.find((c) => c.wordKey === "run")!;
  const posCuaPA = cauV.phuongAn!.map((p) => cards.find((c) => c.wordKey === p.id)!.pos);
  const soV = posCuaPA.filter((p) => p === "v").length;
  check("câu của động từ có ít nhất 3/4 phương án là động từ", soV >= 3, `${soV}/4`);
}

console.log("\n5. Bộ quá nhỏ thì bỏ câu trắc nghiệm, không ra câu 2 phương án");
{
  const { cauHoi } = sinhCauHoi([the("a"), the("b"), the("c")], [], {
    modes: ["word-to-meaning"],
  });
  check("3 thẻ không đủ 4 phương án → 0 câu trắc nghiệm", cauHoi.length === 0, `${cauHoi.length}`);

  const { cauHoi: go } = sinhCauHoi([the("a"), the("b"), the("c")], [], {
    modes: ["meaning-to-typing"],
  });
  check("nhưng dạng gõ vẫn chạy được với bộ nhỏ", go.length === 3, `${go.length}`);
  check("dạng gõ không có phương án", go.every((c) => c.phuongAn === null));
}

console.log("\n6. Không hai câu cùng từ nằm liền nhau");
{
  const { cauHoi } = sinhCauHoi(SAU_THE, [], {
    modes: ["word-to-meaning", "meaning-to-word", "meaning-to-typing"],
  });
  let lienNhau = 0;
  for (let i = 1; i < cauHoi.length; i++) {
    if (cauHoi[i].wordKey === cauHoi[i - 1].wordKey) lienNhau++;
  }
  check("0 cặp liền nhau trùng từ", lienNhau === 0, `${lienNhau} cặp`);
}

console.log("\n7. Lọc đến hạn và ưu tiên từ hay sai");
{
  const prog: ProgressRow[] = [
    td("alpha", { mastered: true }),                                  // đã thuộc → loại
    td("beta", { dueAt: new Date(Date.now() + 864e5).toISOString() }), // chưa tới hạn → loại
    td("gamma", { wrongCount: 9, dueAt: null }),
    td("delta", { wrongCount: 1, dueAt: null }),
  ];
  const { cauHoi } = sinhCauHoi(SAU_THE, prog, {
    modes: ["meaning-to-typing"],
    chiDenHan: true,
  });
  const tu = cauHoi.map((c) => c.wordKey);
  check("bỏ từ đã thuộc", !tu.includes("alpha"));
  check("bỏ từ chưa tới hạn", !tu.includes("beta"));
  check("giữ từ chưa có tiến độ", tu.includes("epsilon") && tu.includes("zeta"));

  const { cauHoi: cat } = sinhCauHoi(SAU_THE, prog, {
    modes: ["meaning-to-typing"],
    chiDenHan: true,
    soCau: 2,
  });
  check("cắt đúng số câu yêu cầu", cat.length === 2, `${cat.length}`);
  check("từ hay sai nhất lọt vào phần được giữ", cat.some((c) => c.wordKey === "gamma"),
    cat.map((c) => c.wordKey).join(","));
}

console.log("\n8. Chấm dạng gõ");
{
  check("bỏ qua hoa/thường", chamGo("NEGOTIATE", "negotiate"));
  check("bỏ qua khoảng trắng thừa", chamGo("  take   over ", "take over"));
  check("sai chính tả là sai", !chamGo("negociate", "negotiate"));
  check("nhận diện đúng dạng gõ", laDangGo("listen-to-typing") && !laDangGo("listen-to-word"));
}


// ── Quét toàn bộ 10 dạng ────────────────────────────────────────────────────
// Thêm sau khi lọt lỗi: canGi() dò bằng t.includes("-image") nên hai dạng
// image-to-* không bị coi là cần ảnh — thẻ trắng vẫn sinh câu, đề bài rỗng.
console.log("\n9. Cả 10 dạng: số câu đúng với số thẻ đủ dữ liệu");
{
  // 6 thẻ: 4 có ảnh, 5 có nghĩa (thẻ "zeta" thiếu cả hai)
  const cards = [
    the("alpha", { anh: "http://a.jpg" }),
    the("beta", { anh: "http://b.jpg" }),
    the("gamma", { anh: "http://c.jpg" }),
    the("delta", { anh: "http://d.jpg" }),
    the("epsilon"),
    the("zeta", { nghia: null }),
  ];
  // mong đợi: dạng cần ảnh ở ĐỀ hoặc PHƯƠNG ÁN → 4 câu; cần nghĩa → 5 câu;
  // chỉ cần từ → 6 câu
  const mongDoi: Record<QuizType, number> = {
    "word-to-image": 4,
    "image-to-word": 4,
    "image-to-typing": 4,
    "listen-to-image": 4,
    "word-to-meaning": 5,
    "meaning-to-word": 5,
    "meaning-to-typing": 5,
    "listen-to-meaning": 5,
    "listen-to-word": 6,
    "listen-to-typing": 6,
  };

  for (const [t, n] of Object.entries(mongDoi) as [QuizType, number][]) {
    const { cauHoi } = sinhCauHoi(cards, [], { modes: [t] });
    check(`${t.padEnd(18)} → ${n} câu`, cauHoi.length === n, `ra ${cauHoi.length}`);
  }
}

console.log("\n10. Đề bài không bao giờ trống");
{
  const cards = ["a", "b", "c", "d", "e", "f"].map((w) =>
    the(w, { anh: `http://${w}.jpg` })
  );
  const tatCa = Object.keys({
    "word-to-image": 0, "image-to-word": 0, "image-to-typing": 0, "listen-to-image": 0,
    "word-to-meaning": 0, "meaning-to-word": 0, "meaning-to-typing": 0,
    "listen-to-meaning": 0, "listen-to-word": 0, "listen-to-typing": 0,
  }) as QuizType[];
  const { cauHoi } = sinhCauHoi(cards, [], { modes: tatCa });
  const deRong = cauHoi.filter((c) => !c.de.chu && !c.de.anh && !c.de.nghe);
  check("mọi câu có đề bài (chữ, ảnh hoặc nghe)", deRong.length === 0,
    deRong.map((c) => `${c.wordKey}/${c.type}`).join(", "));

  const paRong = cauHoi.filter(
    (c) => c.phuongAn && c.phuongAn.some((p) => !p.label && !p.imageUrl)
  );
  check("mọi phương án có nội dung hiện ra", paRong.length === 0,
    paRong.map((c) => c.type).join(", "));
}

console.log(`\n${"─".repeat(50)}\n${pass} đạt, ${fail} lỗi`);
process.exit(fail > 0 ? 1 : 0);
