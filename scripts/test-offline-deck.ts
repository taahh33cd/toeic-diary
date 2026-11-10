/**
 * Kiểm bản lưu bộ thẻ trên máy (lib/vocab/offline-deck.ts).
 *
 *   npx tsx scripts/test-offline-deck.ts
 *
 * Phần dễ sai âm thầm nhất là lúc localStorage đầy: dọn không đủ thì bộ mới
 * không bao giờ lưu được nữa, dọn quá tay thì mất sạch bản lưu của học viên.
 */

const kho = new Map<string, string>();
let chatChoi = 0; // > 0 = localStorage còn bấy nhiêu chỗ (tính theo số khoá)

function dungLocalStorage() {
  (globalThis as Record<string, unknown>).localStorage = {
    get length() {
      return kho.size;
    },
    key: (i: number) => [...kho.keys()][i] ?? null,
    getItem: (k: string) => kho.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (chatChoi > 0 && !kho.has(k) && kho.size >= chatChoi) {
        throw new Error("QuotaExceededError");
      }
      kho.set(k, v);
    },
    removeItem: (k: string) => void kho.delete(k),
  };
}
dungLocalStorage();

type D = typeof import("@/lib/vocab/offline-deck");
let od: D;

let pass = 0;
let fail = 0;
function check(ten: string, dk: boolean, ct = "") {
  if (dk) { pass++; console.log(`  ✓ ${ten}`); }
  else { fail++; console.log(`  ✗ ${ten}${ct ? ` — ${ct}` : ""}`); }
}

// Đủ hình dạng để docBoThe chấp nhận
function boThe(id: string, soThe = 2) {
  return {
    deck: {
      id,
      title: `Bộ ${id}`,
      cardCount: soThe,
      cards: Array.from({ length: soThe }, (_, i) => ({ wordKey: `w${i}`, word: `w${i}` })),
    },
    progress: [],
  } as never;
}

function dat() {
  kho.clear();
  chatChoi = 0;
}

async function main() {
  od = await import("@/lib/vocab/offline-deck");

  console.log("1. Lưu rồi đọc lại");
  {
    dat();
    od.luuBoThe("d1", boThe("d1", 3));
    const r = od.docBoThe("d1");
    check("đọc lại được", r !== null);
    check("đúng bộ đã lưu", r?.data.deck.id === "d1", String(r?.data.deck.id));
    check("có mốc thời gian lưu", typeof r?.luuLuc === "number" && r.luuLuc > 0);
  }

  console.log("\n2. Chưa lưu thì trả null, không ném lỗi");
  {
    dat();
    check("bộ lạ → null", od.docBoThe("chua-co") === null);
  }

  console.log("\n3. Bản quá 30 ngày bị bỏ");
  {
    dat();
    od.luuBoThe("d1", boThe("d1"));
    const raw = JSON.parse(kho.get("vocab:bo:d1")!);
    raw.luuLuc = Date.now() - 31 * 86_400_000;
    kho.set("vocab:bo:d1", JSON.stringify(raw));
    check("trả null", od.docBoThe("d1") === null);
    check("và dọn luôn khỏi kho", !kho.has("vocab:bo:d1"));
  }

  console.log("\n4. Dữ liệu hỏng thì trả null chứ đừng vỡ");
  {
    dat();
    kho.set("vocab:bo:d1", "{không phải json");
    check("JSON hỏng → null", od.docBoThe("d1") === null);
    kho.set("vocab:bo:d2", JSON.stringify({ luuLuc: Date.now(), data: { linh: "tinh" } }));
    check("thiếu deck → null", od.docBoThe("d2") === null);
  }

  console.log("\n5. Xoá bộ thì xoá cả bản lưu");
  {
    dat();
    od.luuBoThe("d1", boThe("d1"));
    od.xoaBoThe("d1");
    check("không còn đọc được", od.docBoThe("d1") === null);
  }

  console.log("\n6. Kho đầy: phải dọn rồi lưu được bộ mới");
  {
    // Đây là ca quan trọng nhất. Không dọn thì từ lúc đầy trở đi học viên
    // không còn bộ nào lưu được, mà chẳng có dấu hiệu gì báo cho họ biết.
    dat();
    chatChoi = 4;
    for (const id of ["a", "b", "c", "d"]) od.luuBoThe(id, boThe(id));
    check("4 bộ đầu lưu được", kho.size === 4, String(kho.size));

    od.luuBoThe("e", boThe("e"));
    check("bộ thứ 5 vẫn lưu được sau khi dọn", od.docBoThe("e") !== null,
      `kho còn ${kho.size} khoá`);
    check("có dọn bớt chứ không giữ hết", kho.size <= 4, String(kho.size));
    check("không dọn sạch trơn", kho.size >= 2, String(kho.size));
  }

  console.log("\n7. Dọn ưu tiên bỏ bản CŨ NHẤT");
  {
    dat();
    chatChoi = 3;
    od.luuBoThe("cu", boThe("cu"));
    // Lùi bản "cu" về 10 ngày trước, vẫn trong hạn nhưng cũ nhất
    const raw = JSON.parse(kho.get("vocab:bo:cu")!);
    raw.luuLuc = Date.now() - 10 * 86_400_000;
    kho.set("vocab:bo:cu", JSON.stringify(raw));
    od.luuBoThe("moi1", boThe("moi1"));
    od.luuBoThe("moi2", boThe("moi2"));
    od.luuBoThe("them", boThe("them"));
    check("bản cũ nhất bị bỏ trước", od.docBoThe("cu") === null);
    check("bộ vừa lưu còn nguyên", od.docBoThe("them") !== null);
  }

  console.log("\n8. localStorage không dùng được thì im lặng bỏ qua");
  {
    dat();
    const cu = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      get length() { throw new Error("chế độ riêng tư"); },
      key: () => { throw new Error("x"); },
      getItem: () => { throw new Error("x"); },
      setItem: () => { throw new Error("x"); },
      removeItem: () => { throw new Error("x"); },
    };
    let nem = false;
    try {
      od.luuBoThe("d1", boThe("d1"));
      od.docBoThe("d1");
      od.xoaBoThe("d1");
    } catch {
      nem = true;
    }
    (globalThis as Record<string, unknown>).localStorage = cu;
    check("không ném lỗi ra ngoài", !nem);
  }

  console.log(`\n${"─".repeat(50)}\n${pass} đạt, ${fail} lỗi`);
  process.exit(fail > 0 ? 1 : 0);
}

main();

// Đánh dấu file là module để hai script test không dùng chung phạm vi
// toàn cục — trùng tên biến ở đó làm `next build` hỏng ở bước type check.
export {};
