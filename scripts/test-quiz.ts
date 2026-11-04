/**
 * Kiểm engine sinh câu hỏi quiz (lib/vocab/quiz.ts) — hàm thuần, không cần DB.
 *
 *   npx tsx scripts/test-quiz.ts
 */

import { chamGo, laDangGo, sinhCauHoi, type QuizType } from "@/lib/vocab/quiz";
import { O_TRONG } from "@/lib/vocab/cloze";
import type { CardRow, ProgressRow, WordFormRow } from "@/lib/vocab/client";

let pass = 0;
let fail = 0;
function check(ten: string, dk: boolean, ct = "") {
  if (dk) { pass++; console.log(`  ✓ ${ten}`); }
  else { fail++; console.log(`  ✗ ${ten}${ct ? ` — ${ct}` : ""}`); }
}

function the(
  word: string,
  o: { pos?: string; nghia?: string | null; anh?: string | null; viDu?: string } = {}
): CardRow {
  return {
    id: `c_${word}`,
    word,
    wordKey: word.toLowerCase(),
    ipa: `/${word}/`,
    pos: o.pos ?? "n",
    meaningVi: o.nghia === undefined ? `nghĩa ${word}` : o.nghia,
    definition: null,
    example: o.viDu ?? null,
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
  // Chạy 200 lượt: phép rải có xáo ngẫu nhiên nên lỗi chỉ lộ ở một số lượt —
  // kiểm một lần là đúng loại test lọt lỗi.
  let tongLienNhau = 0;
  let luotXau = 0;
  for (let lan = 0; lan < 200; lan++) {
    const { cauHoi: ds } = sinhCauHoi(SAU_THE, [], {
      modes: ["word-to-meaning", "meaning-to-word", "meaning-to-typing"],
    });
    let n = 0;
    for (let i = 1; i < ds.length; i++) if (ds[i].wordKey === ds[i - 1].wordKey) n++;
    tongLienNhau += n;
    if (n > 0) luotXau++;
  }
  check("200 lượt sinh đề: 0 cặp liền nhau trùng từ", tongLienNhau === 0,
    `${luotXau}/200 lượt có lỗi, tổng ${tongLienNhau} cặp`);

  // Trường hợp cực đoan: 2 từ × 3 dạng — vẫn tránh được hoàn toàn
  const { cauHoi: it } = sinhCauHoi([the("x"), the("y"), the("z"), the("w")], [], {
    modes: ["meaning-to-typing", "word-to-meaning", "meaning-to-word"],
  });
  let n2 = 0;
  for (let i = 1; i < it.length; i++) if (it[i].wordKey === it[i - 1].wordKey) n2++;
  check("bộ nhỏ 4 từ × 3 dạng cũng không có cặp liền nhau", n2 === 0, `${n2} cặp`);
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
console.log("\n9. Cả 12 dạng: số câu đúng với số thẻ đủ dữ liệu");
{
  // 6 thẻ: 4 có ảnh, 5 có nghĩa (thẻ "zeta" thiếu cả hai), 3 khoét lỗ được
  const vd = (w: string) => `The manager will send the ${w} to our client tomorrow.`;
  const cards = [
    the("alpha", { anh: "http://a.jpg", viDu: vd("alpha") }),
    the("beta", { anh: "http://b.jpg", viDu: vd("beta") }),
    the("gamma", { anh: "http://c.jpg", viDu: vd("gamma") }),
    the("delta", { anh: "http://d.jpg", viDu: "Send it now." }), // quá ngắn
    the("epsilon"),
    the("zeta", { nghia: null }),
  ];
  // mong đợi: dạng cần ảnh ở ĐỀ hoặc PHƯƠNG ÁN → 4 câu; cần nghĩa → 5 câu;
  // cần ví dụ khoét được → 3 câu; chỉ cần từ → 6 câu
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
    "cloze-to-word": 3,
    "cloze-to-typing": 3,
    // Không truyền bộ phương án nào vào → không câu nào
    "wordform-to-word": 0,
  };

  for (const [t, n] of Object.entries(mongDoi) as [QuizType, number][]) {
    const { cauHoi } = sinhCauHoi(cards, [], { modes: [t] });
    check(`${t.padEnd(18)} → ${n} câu`, cauHoi.length === n, `ra ${cauHoi.length}`);
  }
}

console.log("\n10. Đề bài không bao giờ trống");
{
  const cards = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"].map((w) =>
    the(w, { anh: `http://${w}.jpg`, viDu: `Please send the ${w} to the office before Friday.` })
  );
  const tatCa = Object.keys({
    "word-to-image": 0, "image-to-word": 0, "image-to-typing": 0, "listen-to-image": 0,
    "word-to-meaning": 0, "meaning-to-word": 0, "meaning-to-typing": 0,
    "listen-to-meaning": 0, "listen-to-word": 0, "listen-to-typing": 0,
    "cloze-to-word": 0, "cloze-to-typing": 0,
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

console.log("\n11. Dạng điền vào chỗ trống");
{
  const co = ["alpha", "beta", "gamma", "delta"].map((w) =>
    the(w, { viDu: `The manager will send the ${w} to our client tomorrow.` })
  );

  const { cauHoi } = sinhCauHoi(co, [], { modes: ["cloze-to-word"] });
  check("4 thẻ có ví dụ → 4 câu", cauHoi.length === 4, `ra ${cauHoi.length}`);
  check("đề bài là câu đã khoét lỗ",
    cauHoi.every((c) => c.de.chu?.includes(O_TRONG) === true),
    cauHoi.map((c) => c.de.chu).join(" | "));

  // Lỗi chết người: đáp án vẫn nằm trong đề thì câu hỏi vô nghĩa
  const tiengCua = (s: string) => s.toLowerCase().split(/[^a-z]+/i).filter(Boolean);
  const lo = cauHoi.filter((c) => tiengCua(c.de.chu ?? "").includes(c.word.toLowerCase()));
  check("đáp án không còn trong đề", lo.length === 0, lo.map((c) => c.de.chu).join(" | "));

  check("phương án là từ tiếng Anh, không phải nghĩa",
    cauHoi.every((c) => c.phuongAn?.every((p) => co.some((x) => x.word === p.label))),
    JSON.stringify(cauHoi[0]?.phuongAn));

  const go = sinhCauHoi(co, [], { modes: ["cloze-to-typing"] });
  check("dạng gõ không có phương án", go.cauHoi.every((c) => c.phuongAn === null));
  check("dạng gõ vẫn có đề đã khoét",
    go.cauHoi.every((c) => c.de.chu?.includes(O_TRONG) === true));

  // Thẻ không có ví dụ, và thẻ có ví dụ nhưng khoét không nổi
  const khong = [
    ...co,
    the("omega"),                                              // không ví dụ
    the("sigma", { viDu: "Send it now." }),                    // câu quá ngắn
    the("kappa", { viDu: "The weather is nice here today." }), // ví dụ không chứa từ
  ];
  const r = sinhCauHoi(khong, [], { modes: ["cloze-to-word"] });
  check("chỉ 4 thẻ khoét được ra câu", r.cauHoi.length === 4, `ra ${r.cauHoi.length}`);
  check("3 thẻ còn lại đếm vào thieuViDu", r.boQua.thieuViDu === 3, `${r.boQua.thieuViDu}`);
}

console.log("\n12. Dạng chọn dạng từ (Part 5 word form)");
{
  const co = ["imply", "renovate", "diversify", "launch"].map((w) => the(w));
  const bo: WordFormRow[] = [
    {
      id: "wf_1",
      wordKey: "imply",
      cloze: `The proposition ${O_TRONG} that my dog is a mammal.`,
      answer: "implies",
      distractors: ["imply", "implying", "implication"],
    },
    {
      id: "wf_2",
      wordKey: "renovate",
      cloze: `The ${O_TRONG} of the old building took six months.`,
      answer: "renovation",
      distractors: ["renovate", "renovating", "renovated"],
    },
  ];

  const { cauHoi, boQua } = sinhCauHoi(co, [], { modes: ["wordform-to-word"] }, bo);
  check("chỉ 2/4 thẻ có bộ phương án → 2 câu", cauHoi.length === 2, `ra ${cauHoi.length}`);
  check("2 thẻ còn lại đếm vào thieuDangTu", boQua.thieuDangTu === 2, `${boQua.thieuDangTu}`);

  // Lỗi dễ mắc nhất: chấm theo chữ trên thẻ ("imply") thay vì dạng đã chia
  const q = cauHoi.find((c) => c.wordKey === "imply")!;
  check('đáp án là dạng đã chia "implies", không phải "imply"',
    q.dapAn === "implies", q.dapAn);
  check("phương án đúng đúng là dạng đã chia",
    q.phuongAn?.find((x) => x.dung)?.label === "implies",
    JSON.stringify(q.phuongAn));

  check("đủ 4 phương án", cauHoi.every((c) => c.phuongAn?.length === 4),
    cauHoi.map((c) => c.phuongAn?.length).join());
  check("đúng MỘT phương án đúng",
    cauHoi.every((c) => c.phuongAn?.filter((x) => x.dung).length === 1));
  check("phương án KHÔNG lấy từ thẻ khác trong bộ",
    !q.phuongAn?.some((x) => ["renovate", "diversify", "launch"].includes(x.label ?? "")),
    JSON.stringify(q.phuongAn?.map((x) => x.label)));
  check("đề bài là câu đã khoét lỗ",
    cauHoi.every((c) => c.de.chu?.includes(O_TRONG) === true));
  check("mang theo formId để báo sai được",
    cauHoi.every((c) => c.formId === "wf_1" || c.formId === "wf_2"),
    cauHoi.map((c) => c.formId).join());

  // Không truyền bộ phương án thì dạng này phải tắt hẳn, không được bịa câu
  const khong = sinhCauHoi(co, [], { modes: ["wordform-to-word"] });
  check("không có bộ phương án → 0 câu", khong.cauHoi.length === 0,
    `ra ${khong.cauHoi.length}`);

  // Bộ phương án của từ không có trong bộ thẻ thì kệ, không được lôi vào
  const thua = sinhCauHoi([the("imply")], [], { modes: ["wordform-to-word"] }, bo);
  check("bỏ qua bộ phương án của từ không có trong bộ thẻ",
    thua.cauHoi.length === 1, `ra ${thua.cauHoi.length}`);
}

console.log(`\n${"─".repeat(50)}\n${pass} đạt, ${fail} lỗi`);
process.exit(fail > 0 ? 1 : 0);
