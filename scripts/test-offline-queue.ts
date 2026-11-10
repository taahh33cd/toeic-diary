/**
 * Kiểm hàng đợi gửi lại kết quả (lib/vocab/offline-queue.ts).
 *
 *   npx tsx scripts/test-offline-queue.ts
 *
 * Hàng đợi hỏng thì học viên mất bài mà không ai biết — không có màn hình nào
 * báo "kết quả của bạn đã bốc hơi". Nên kiểm cả đường thành công lẫn mọi
 * đường thất bại, nhất là chỗ quyết định GIỮ hay BỎ một việc.
 */

// ── Giả lập localStorage và fetch trước khi nạp module ──
const kho = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => kho.get(k) ?? null,
  setItem: (k: string, v: string) => void kho.set(k, v),
  removeItem: (k: string) => void kho.delete(k),
  clear: () => kho.clear(),
};

type Lan = { url: string; body: Record<string, unknown> };
let daGoi: Lan[] = [];
let traLoi: (n: number) => { status: number; loi?: "mang" } = () => ({ status: 200 });

(globalThis as Record<string, unknown>).fetch = async (url: string, init: RequestInit) => {
  const body = JSON.parse(String(init.body));
  daGoi.push({ url, body });
  const r = traLoi(daGoi.length);
  if (r.loi === "mang") throw new TypeError("Failed to fetch");
  return {
    ok: r.status >= 200 && r.status < 300,
    status: r.status,
    json: async () => ({ ok: true, error: "hỏng dữ liệu" }),
  };
};

type Q = typeof import("@/lib/vocab/offline-queue");
let q: Q;

let pass = 0;
let fail = 0;
function check(ten: string, dk: boolean, ct = "") {
  if (dk) { pass++; console.log(`  ✓ ${ten}`); }
  else { fail++; console.log(`  ✗ ${ten}${ct ? ` — ${ct}` : ""}`); }
}
function dat() {
  kho.clear();
  daGoi = [];
  traLoi = () => ({ status: 200 });
}

async function main() {
  // Nạp SAU khi đã giả lập localStorage/fetch ở trên
  q = await import("@/lib/vocab/offline-queue");

  console.log("1. Gửi được thì không xếp hàng");
  {
    dat();
    const r = await q.guiHoacXepHang<{ ok: boolean }>("/api/x", { a: 1 });
    check("trả về kết quả server", r.ket !== null && r.daXepHang === false);
    check("hàng đợi rỗng", q.demHangDoi() === 0, String(q.demHangDoi()));
    check("có kèm clientRef ngay lần gửi đầu",
      typeof daGoi[0]?.body.clientRef === "string", JSON.stringify(daGoi[0]?.body));
  }

  console.log("\n2. Lỗi MẠNG thì xếp hàng, không mất bài");
  {
    dat();
    traLoi = () => ({ status: 0, loi: "mang" });
    const r = await q.guiHoacXepHang("/api/x", { a: 1 });
    check("báo đã xếp hàng", r.daXepHang === true && r.ket === null);
    check("hàng đợi có 1 việc", q.demHangDoi() === 1, String(q.demHangDoi()));
  }

  console.log("\n3. Gửi lại dùng ĐÚNG clientRef của lần đầu");
  {
    // Đây là chỗ chống ghi trùng. Sinh ref mới khi gửi lại thì server không
    // nhận ra lượt cũ và sẽ đẩy SRS của cả chục từ thừa một bậc.
    const refDau = daGoi[0]?.body.clientRef;
    traLoi = () => ({ status: 200 });
    const kq = await q.dayHangDoi();
    check("gửi lại thành công", kq.gui === 1 && kq.conLai === 0, JSON.stringify(kq));
    check("ref giữ nguyên qua lần gửi lại",
      daGoi[daGoi.length - 1]?.body.clientRef === refDau,
      `${refDau} → ${daGoi[daGoi.length - 1]?.body.clientRef}`);
  }

  console.log("\n4. Lỗi 4xx thì BỎ, đừng tắc hàng mãi mãi");
  {
    dat();
    traLoi = () => ({ status: 400 });
    let nem = false;
    try {
      await q.guiHoacXepHang("/api/x", { a: 1 });
    } catch {
      nem = true;
    }
    check("ném lỗi cho nơi gọi biết mà báo", nem);
    check("không xếp hàng việc hỏng dữ liệu", q.demHangDoi() === 0, String(q.demHangDoi()));

    // Việc đã nằm sẵn trong hàng mà server trả 4xx thì cũng phải bỏ
    q.xepHang("/api/x", { a: 2 });
    const kq = await q.dayHangDoi();
    check("việc cũ bị 4xx thì bỏ khỏi hàng", q.demHangDoi() === 0, String(q.demHangDoi()));
    check("không tính là gửi thành công", kq.gui === 0, String(kq.gui));
  }

  console.log("\n5. Lỗi 5xx thì GIỮ lại, thử sau");
  {
    dat();
    q.xepHang("/api/x", { a: 1 });
    traLoi = () => ({ status: 503 });
    await q.dayHangDoi();
    check("vẫn còn trong hàng", q.demHangDoi() === 1, String(q.demHangDoi()));
    traLoi = () => ({ status: 200 });
    const kq = await q.dayHangDoi();
    check("lần sau server khoẻ thì gửi được", kq.gui === 1 && q.demHangDoi() === 0);
  }

  console.log("\n6. Mạng hỏng giữa chừng thì DỪNG, không thử nốt cả hàng");
  {
    dat();
    for (let i = 0; i < 5; i++) q.xepHang("/api/x", { i });
    traLoi = (n) => (n <= 2 ? { status: 200 } : { status: 0, loi: "mang" });
    const kq = await q.dayHangDoi();
    check("gửi được 2 việc đầu", kq.gui === 2, String(kq.gui));
    check("dừng ngay ở việc hỏng, không thử nốt 2 việc sau",
      daGoi.length === 3, `gọi ${daGoi.length} lần`);
    check("3 việc còn lại vẫn nằm trong hàng", q.demHangDoi() === 3, String(q.demHangDoi()));
  }

  console.log("\n7. Không nhân đôi khi xếp cùng một ref hai lần");
  {
    dat();
    q.xepHang("/api/x", { a: 1 }, "ref-co-dinh");
    q.xepHang("/api/x", { a: 2 }, "ref-co-dinh");
    check("vẫn chỉ 1 việc", q.demHangDoi() === 1, String(q.demHangDoi()));
  }

  console.log("\n8. Việc quá cũ bị bỏ");
  {
    dat();
    q.xepHang("/api/x", { a: 1 });
    // Lùi thời gian tạo về 20 ngày trước
    const ds = JSON.parse(kho.get("vocab:hangdoi:v1")!);
    ds[0].taoLuc = Date.now() - 20 * 86_400_000;
    kho.set("vocab:hangdoi:v1", JSON.stringify(ds));
    const kq = await q.dayHangDoi();
    check("không gửi kết quả của 20 ngày trước", kq.gui === 0 && daGoi.length === 0,
      `gửi ${kq.gui}, gọi ${daGoi.length}`);
    check("và dọn khỏi hàng", q.demHangDoi() === 0, String(q.demHangDoi()));
  }

  console.log("\n9. localStorage hỏng thì không làm sập luồng đang chạy");
  {
    dat();
    const cu = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: () => { throw new Error("chế độ riêng tư"); },
      setItem: () => { throw new Error("hết chỗ"); },
    };
    let nem = false;
    try {
      q.xepHang("/api/x", { a: 1 });
      q.demHangDoi();
      await q.dayHangDoi();
    } catch {
      nem = true;
    }
    (globalThis as Record<string, unknown>).localStorage = cu;
    check("không ném lỗi ra ngoài", !nem);
  }

  console.log("\n10. Có người theo dõi thì được báo khi hàng đổi");
  {
    dat();
    const thay: number[] = [];
    const thoi = q.theoDoiHangDoi((n) => thay.push(n));
    q.xepHang("/api/x", { a: 1 });
    q.xepHang("/api/x", { a: 2 });
    thoi();
    q.xepHang("/api/x", { a: 3 });
    check("báo ngay lúc đăng ký và mỗi lần đổi", thay.join(",") === "0,1,2", thay.join(","));
    check("thôi theo dõi thì không báo nữa", thay.length === 3, String(thay.length));
  }

  console.log(`\n${"─".repeat(50)}\n${pass} đạt, ${fail} lỗi`);
  process.exit(fail > 0 ? 1 : 0);
}

main();

// Đánh dấu file là module để hai script test không dùng chung phạm vi
// toàn cục — trùng tên biến ở đó làm `next build` hỏng ở bước type check.
export {};
