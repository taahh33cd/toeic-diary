"use client";

import type { DeckDetail } from "./client";

/**
 * Bản sao bộ thẻ trên máy, để học tiếp khi mất mạng.
 *
 * Chỉ giữ bộ ĐÃ MỞ, không tải trước gì cả: học viên mở bộ nào thì bộ đó nằm
 * lại, đúng thứ họ sắp cần. Bộ lớn nhất trong hệ thống là 35 KB JSON nên
 * localStorage (~5 MB) thừa sức cho vài chục bộ.
 *
 * Bản sao này KHÔNG phải nguồn sự thật. Có mạng thì luôn lấy từ server; bản
 * lưu chỉ được dùng khi mạng hỏng, và màn hình phải nói rõ đang xem bản cũ —
 * tiến độ ôn lưu ở đây có thể đã lạc hậu so với lần học trên máy khác.
 */

const TIEN_TO = "vocab:bo:";
const HAN_MS = 30 * 86_400_000;

interface BanLuu {
  luuLuc: number;
  data: DeckDetail;
}

export function luuBoThe(id: string, data: DeckDetail) {
  try {
    localStorage.setItem(TIEN_TO + id, JSON.stringify({ luuLuc: Date.now(), data }));
  } catch {
    // Hết chỗ: dọn bản cũ rồi thử lại đúng một lần. Không dọn thì bộ mới
    // không bao giờ lưu được nữa vì chỗ đã bị bộ cũ chiếm hết.
    try {
      donBoCu();
      localStorage.setItem(TIEN_TO + id, JSON.stringify({ luuLuc: Date.now(), data }));
    } catch {
      // Chịu — mất offline cho bộ này, nhưng đừng làm hỏng luồng đang chạy
    }
  }
}

export function docBoThe(id: string): { data: DeckDetail; luuLuc: number } | null {
  try {
    const raw = localStorage.getItem(TIEN_TO + id);
    if (!raw) return null;
    const v = JSON.parse(raw) as BanLuu;
    if (!v?.data?.deck || typeof v.luuLuc !== "number") return null;
    if (Date.now() - v.luuLuc > HAN_MS) {
      localStorage.removeItem(TIEN_TO + id);
      return null;
    }
    return { data: v.data, luuLuc: v.luuLuc };
  } catch {
    return null;
  }
}

export function xoaBoThe(id: string) {
  try {
    localStorage.removeItem(TIEN_TO + id);
  } catch {
    // không sao
  }
}

/** Bỏ các bản lưu quá hạn; nếu vẫn chưa đủ chỗ thì bỏ tiếp bản cũ nhất. */
function donBoCu() {
  const han = Date.now() - HAN_MS;
  const con: { k: string; luuLuc: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(TIEN_TO)) continue;
    try {
      const v = JSON.parse(localStorage.getItem(k) ?? "{}") as BanLuu;
      if (!v?.luuLuc || v.luuLuc < han) localStorage.removeItem(k);
      else con.push({ k, luuLuc: v.luuLuc });
    } catch {
      localStorage.removeItem(k);
    }
  }
  con.sort((a, b) => a.luuLuc - b.luuLuc);
  for (const c of con.slice(0, Math.ceil(con.length / 2))) localStorage.removeItem(c.k);
}
