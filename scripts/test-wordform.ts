/**
 * Kiểm bộ đối chiếu câu trả lời của giám khảo (lib/vocab/wordform.ts).
 *
 *   npx tsx scripts/test-wordform.ts
 *
 * Hàm này quyết định câu hỏi nào sống nào chết. Quy nhầm hai chữ về cùng một
 * phương án → câu hai đáp án lọt tới học viên. Quy trượt → loại oan câu tốt.
 * Cả hai đều âm thầm, nên phải chốt bằng test.
 */

import { chuan, chuBiKhoet, dungDe, quyVePhuongAn } from "@/lib/vocab/wordform";
import { O_TRONG } from "@/lib/vocab/cloze";

let pass = 0;
let fail = 0;
function check(ten: string, dk: boolean, ct = "") {
  if (dk) { pass++; console.log(`  ✓ ${ten}`); }
  else { fail++; console.log(`  ✗ ${ten}${ct ? ` — ${ct}` : ""}`); }
}

console.log("1. Chuẩn hoá");
{
  check("bỏ mạo từ dẫn đầu", chuan("an intersection") === "intersection", chuan("an intersection"));
  check("bỏ dấu câu", chuan("tire.") === "tire", chuan("tire."));
  check("không bỏ 'a' giữa câu", chuan("turnaround a time") === "turnaround a time");
  check("gộp khoảng trắng", chuan("  turnaround   time ") === "turnaround time");
}

console.log("\n2. Quy về phương án — ca loại oan thật gặp khi chạy 328 câu");
{
  const pa = ["intersection", "intersect", "intersecting", "intersected"];
  check('"intersection, an intersection" → MỘT đáp án',
    quyVePhuongAn(["intersection", "an intersection"], pa).length === 1,
    JSON.stringify(quyVePhuongAn(["intersection", "an intersection"], pa)));

  check('"implies, implies" → MỘT đáp án',
    quyVePhuongAn(["implies", "implies"], ["implies", "imply", "implying", "implied"]).length === 1);

  const pa2 = ["turnaround", "turn", "turning", "turned"];
  check('"turnaround time" quy về "turnaround"',
    quyVePhuongAn(["turnaround time"], pa2).join() === "turnaround",
    JSON.stringify(quyVePhuongAn(["turnaround time"], pa2)));
  check('"turnaround time" KHÔNG quy nhầm sang "turn"',
    !quyVePhuongAn(["turnaround time"], pa2).includes("turn"));
}

console.log("\n3. Hai đáp án THẬT thì phải giữ nguyên là hai");
{
  check('"luncheon, lunch" → hai',
    quyVePhuongAn(["luncheon", "lunch"], ["luncheon", "lunch", "lunches", "lunched"]).length === 2);
  check('"evoked, evokes" → hai',
    quyVePhuongAn(["evoked", "evokes"], ["evokes", "evoked", "evoking", "evocation"]).length === 2);
  check('"renovation, renovations" → hai',
    quyVePhuongAn(["renovation", "renovations"],
      ["renovation", "renovations", "renovating", "renovated"]).length === 2);
}

console.log("\n4. Chữ không thuộc phương án nào thì bỏ");
{
  const pa = ["intersection", "intersect", "intersecting", "intersected"];
  check('"intersections" không khớp phương án nào → rỗng',
    quyVePhuongAn(["intersections"], pa).length === 0,
    JSON.stringify(quyVePhuongAn(["intersections"], pa)));
  check("rỗng vào thì rỗng ra", quyVePhuongAn([], pa).length === 0);
  check("chuỗi rác bị bỏ", quyVePhuongAn(["", "   ", "???"], pa).length === 0);
}

console.log("\n5. Tìm chữ bị khoét");
{
  const vd = "They negotiated a new contract with the client.";
  const de = `They ${O_TRONG} a new contract with the client.`;
  check("lấy đúng dạng đã chia", chuBiKhoet(vd, de) === "negotiated", String(chuBiKhoet(vd, de)));
  check("bỏ dấu chấm dính liền chữ",
    chuBiKhoet("We met the client.", `We met the ${O_TRONG}`) === "client",
    String(chuBiKhoet("We met the client.", `We met the ${O_TRONG}`)));
  check("số tiếng lệch → null",
    chuBiKhoet("We met the client today.", `We met the ${O_TRONG}`) === null);

  const d = dungDe({ wordKey: "negotiate", word: "negotiate", example: vd });
  check("dungDe lấy đáp án là dạng trong câu, không phải chữ trên thẻ",
    d?.answer === "negotiated", String(d?.answer));
  check("thẻ không có ví dụ → null",
    dungDe({ wordKey: "x", word: "x", example: null }) === null);
  check("ví dụ không chứa từ → null",
    dungDe({ wordKey: "x", word: "invoice", example: "The weather is nice here today." }) === null);
}

console.log(`\n${"─".repeat(50)}\n${pass} đạt, ${fail} lỗi`);
process.exit(fail > 0 ? 1 : 0);
