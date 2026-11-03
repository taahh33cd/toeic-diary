/**
 * Khoét lỗ một câu ví dụ để thành câu hỏi điền từ kiểu Part 5.
 *
 * Việc khó nằm ở chỗ câu ví dụ hay dùng từ ở DẠNG ĐÃ CHIA — thẻ "negotiate"
 * nhưng câu lại là "They negotiated a new contract". Khoét không trúng là để
 * nguyên đáp án trong đề, câu hỏi thành vô nghĩa.
 *
 * Nguyên tắc: thà TỪ CHỐI tạo câu còn hơn tạo ra câu lộ đáp án. Hàm trả null
 * khi không chắc, và luôn kiểm lại lần cuối xem đề còn sót từ gốc không.
 */

export const O_TRONG = "______";

/**
 * Mọi gốc có thể có của một tiếng.
 *
 * Trả TẬP hợp chứ không một chuỗi, vì bỏ đuôi xong còn phải đoán xem gốc có
 * chữ "e" cuối hay không: "negotiated" bỏ "ed" ra "negotiat", gốc thật là
 * "negotiate". Thiếu bước này thì "negotiate" không khớp câu "They negotiated
 * a new contract" — đúng loại câu AI hay sinh ra nhất.
 */
function cacGoc(t: string): Set<string> {
  const s = t.toLowerCase().replace(/[^a-z'-]/g, "");
  const ra = new Set<string>();
  if (!s) return ra;
  ra.add(s);
  if (s.length <= 3) return ra;

  for (const [duoi, bu] of [
    ["ies", "y"],
    ["ied", "y"],
    ["ying", "ie"],
    ["ing", ""],
    ["ed", ""],
    ["es", ""],
    ["s", ""],
    ["d", ""],
  ] as const) {
    if (!s.endsWith(duoi) || s.length - duoi.length < 3) continue;
    const than = s.slice(0, s.length - duoi.length) + bu;
    ra.add(than);
    ra.add(than + "e");                                   // negotiat → negotiate
    if (/(.)\1$/.test(than)) ra.add(than.slice(0, -1));    // stopp → stop
  }
  return ra;
}

/** Hai tiếng có cùng gốc không — đủ để coi là cùng một từ đã chia dạng. */
function cungGoc(a: string, b: string): boolean {
  const ga = cacGoc(a);
  for (const g of cacGoc(b)) if (ga.has(g)) return true;
  return false;
}

/**
 * Trong đề còn tiếng nào CÙNG HỌ với đáp án không.
 *
 * Khác cungGoc: bắt cả từ phái sinh chứ không chỉ từ chia dạng. Câu "The
 * building inspector will ______ the site" đã khoét đúng chữ "inspect", nhưng
 * "inspector" nằm đó thì nhìn là đoán ra — câu hỏi không đo được gì.
 *
 * Chỉ xét từ dài ≥5 ký tự: với từ ngắn như "top" thì tiền tố 3 chữ trùng với
 * "topic" là chuyện ngẫu nhiên, chặn theo sẽ loại oan quá nhiều câu.
 */
function conTuCungHo(cau: string, tu: string): boolean {
  const g = tu.toLowerCase().replace(/[^a-z'-]/g, "");
  if (g.length < 5) return false;
  const tienTo = g.slice(0, Math.min(6, g.length));
  return cau
    .split(/[^a-zA-Z'-]+/)
    .filter(Boolean)
    .some((t) => t.toLowerCase().startsWith(tienTo));
}

/**
 * Trả câu đã khoét lỗ, hoặc null nếu không khoét được chắc chắn.
 *
 * Câu quá ngắn cũng trả null: "Great job!" khoét đi thì chẳng còn ngữ cảnh gì
 * để đoán, câu hỏi biến thành trò may rủi.
 */
export function taoChoTrong(example: string, word: string): string | null {
  const cau = example.trim();
  if (!cau) return null;

  const tu = word.trim();
  if (!tu) return null;

  let ra: string | null = null;

  if (tu.includes(" ")) {
    // Cụm nhiều từ: chỉ nhận khớp nguyên cụm, không đoán biến cách
    const re = new RegExp(`\\b${tu.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(cau)) ra = cau.replace(re, O_TRONG);
  } else {
    // Từ đơn: duyệt từng tiếng, khoét tiếng đầu tiên cùng gốc
    const phan = cau.split(/(\b)/);
    let daKhoet = false;
    const moi = phan.map((p) => {
      if (daKhoet || !/[a-zA-Z]/.test(p)) return p;
      if (cungGoc(p, tu)) {
        daKhoet = true;
        return O_TRONG;
      }
      return p;
    });
    if (daKhoet) ra = moi.join("");
  }

  if (!ra) return null;

  // Đề phải còn đủ ngữ cảnh: dưới 5 tiếng thì đoán bằng may rủi
  const soTieng = ra.replace(O_TRONG, "").trim().split(/\s+/).filter(Boolean).length;
  if (soTieng < 5) return null;

  // Chốt chặn cuối: đề không được còn sót từ đó, biến cách, hay từ cùng họ
  const conSot = ra
    .split(/[^a-zA-Z'-]+/)
    .filter(Boolean)
    .some((t) => cungGoc(t, tu));
  if (conSot || conTuCungHo(ra, tu)) return null;

  return ra;
}
