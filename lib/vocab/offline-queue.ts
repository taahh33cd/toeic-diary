"use client";

/**
 * Hàng đợi gửi lại kết quả ôn khi mạng hỏng.
 *
 * Trước đây gửi hỏng là mất trắng: QuizRunner hiện "CHƯA được lưu" rồi thôi,
 * học viên làm xong 18 câu mà SRS không nhúc nhích. Mạng 4G chập chờn giữa
 * chừng là chuyện thường, nên đây là mất mát thật chứ không phải ca hiếm.
 *
 * Lưu ở localStorage chứ không IndexedDB: dữ liệu nhỏ (một lượt 18 câu chưa
 * tới 2 KB, bộ thẻ lớn nhất trong hệ thống cũng chỉ 35 KB), mà localStorage
 * ghi đồng bộ nên không có cửa sổ mất dữ liệu khi trình duyệt bị đóng đột
 * ngột giữa lúc đang ghi.
 *
 * Chống ghi trùng: mỗi việc mang một clientRef. Gửi lại một lượt mà server đã
 * nhận thì server nhận ra khoá cũ và trả về kết quả đã lưu (xem migration
 * 010). Không có khoá đó thì gửi lại sẽ đẩy SRS của cả chục từ thừa một bậc.
 */

const KHOA = "vocab:hangdoi:v1";
/** Bỏ việc quá cũ: gửi kết quả của hai tuần trước chỉ làm rối SRS. */
const HAN_MS = 14 * 86_400_000;
const TOI_DA = 50;

export interface ViecCho {
  /** Khoá chống trùng, đi theo việc suốt đời nó. */
  ref: string;
  url: string;
  body: unknown;
  taoLuc: number;
  /** Số lần đã thử gửi — để báo cho học viên khi một việc cứ hỏng mãi. */
  soLanThu: number;
}

function sinhRef(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `r${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
  }
}

function doc(): ViecCho[] {
  try {
    const raw = localStorage.getItem(KHOA);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as ViecCho[]) : [];
  } catch {
    return [];
  }
}

function ghi(ds: ViecCho[]) {
  try {
    localStorage.setItem(KHOA, JSON.stringify(ds.slice(-TOI_DA)));
  } catch {
    // Hết chỗ hoặc chế độ riêng tư — không có gì cứu được, đừng ném lỗi làm
    // hỏng luôn luồng đang chạy.
  }
  bao();
}

const nguoiNghe = new Set<(n: number) => void>();
function bao() {
  const n = doc().length;
  for (const f of nguoiNghe) f(n);
}

export function theoDoiHangDoi(f: (n: number) => void): () => void {
  nguoiNghe.add(f);
  f(doc().length);
  return () => {
    nguoiNghe.delete(f);
  };
}

export function demHangDoi(): number {
  return doc().length;
}

/** Thêm một việc vào hàng đợi. Trả về ref để nơi gọi ghi nhận. */
export function xepHang(url: string, body: unknown, ref?: string): string {
  const r = ref ?? sinhRef();
  const ds = doc();
  // Cùng một ref thì thay chứ đừng thêm: gọi hai lần cho một lượt là do thử
  // lại, không phải hai lượt khác nhau.
  const i = ds.findIndex((v) => v.ref === r);
  const viec: ViecCho = { ref: r, url, body, taoLuc: Date.now(), soLanThu: 0 };
  if (i >= 0) ds[i] = { ...viec, soLanThu: ds[i].soLanThu };
  else ds.push(viec);
  ghi(ds);
  return r;
}

export function boKhoiHang(ref: string) {
  ghi(doc().filter((v) => v.ref !== ref));
}

let dangDay = false;

/**
 * Thử gửi lại mọi việc đang chờ.
 *
 * Gặp lỗi mạng thì DỪNG luôn phần còn lại — mạng đang hỏng, thử tiếp 20 việc
 * nữa chỉ tốn pin. Gặp lỗi do dữ liệu (4xx) thì bỏ việc đó đi, vì gửi lại bao
 * nhiêu lần cũng vẫn hỏng, giữ lại chỉ làm tắc hàng mãi mãi.
 */
export async function dayHangDoi(): Promise<{ gui: number; conLai: number }> {
  if (dangDay) return { gui: 0, conLai: doc().length };
  dangDay = true;
  let gui = 0;
  try {
    const han = Date.now() - HAN_MS;
    let ds = doc().filter((v) => v.taoLuc >= han);
    if (ds.length !== doc().length) ghi(ds);

    for (const v of ds) {
      try {
        const res = await fetch(v.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(v.body),
        });
        if (res.ok) {
          boKhoiHang(v.ref);
          gui++;
          continue;
        }
        if (res.status >= 400 && res.status < 500) {
          // Dữ liệu hỏng hoặc hết phiên đăng nhập — gửi lại cũng vậy
          boKhoiHang(v.ref);
          continue;
        }
        // 5xx: server đang trục trặc, để dành thử lại sau
        break;
      } catch {
        // Lỗi mạng — dừng hẳn vòng lặp
        break;
      }
    }

    ds = doc();
    return { gui, conLai: ds.length };
  } finally {
    dangDay = false;
  }
}

/**
 * Gửi ngay, hỏng thì xếp hàng. Trả về kết quả server, hoặc null nếu đã xếp.
 *
 * Luôn kèm clientRef vào thân request kể cả lần gửi đầu: nếu lần đầu tới được
 * server mà phản hồi mất dọc đường, lần gửi lại mang đúng khoá đó và server
 * nhận ra, thay vì ghi thành lượt thứ hai.
 */
export async function guiHoacXepHang<T>(
  url: string,
  body: Record<string, unknown>
): Promise<{ ket: T | null; daXepHang: boolean }> {
  const ref = sinhRef();
  const thanBai = { ...body, clientRef: ref };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(thanBai),
    });
    if (res.ok) return { ket: (await res.json()) as T, daXepHang: false };
    if (res.status >= 400 && res.status < 500) {
      // Lỗi dữ liệu: xếp hàng vô ích, để nơi gọi báo lỗi thật
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(d.error ?? "Không lưu được kết quả");
    }
    xepHang(url, thanBai, ref);
    return { ket: null, daXepHang: true };
  } catch (e) {
    // Lỗi do 4xx đã ném ở trên thì để nó đi tiếp; chỉ lỗi mạng mới xếp hàng
    if (e instanceof Error && !(e instanceof TypeError)) throw e;
    xepHang(url, thanBai, ref);
    return { ket: null, daXepHang: true };
  }
}
