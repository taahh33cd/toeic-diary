"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeading } from "@/components/journal/paper/PageHeading";
import { Sheet } from "@/components/journal/paper/Sheet";
import { createDeck, type CardDraft } from "@/lib/vocab/client";

const RED = "var(--accent-red, #B94040)";

/**
 * Tách một dòng dán vào thành từ + nghĩa.
 *
 * Nhận cả Tab (dán từ Excel/Sheets), dấu gạch ngang và dấu phẩy — học viên dán
 * từ đâu cũng được, không phải học cú pháp riêng. Tab ưu tiên trước vì nghĩa
 * tiếng Việt hay có dấu phẩy trong chính nó ("rót, đổ").
 */
function tachDong(dong: string): { word: string; meaningVi?: string } | null {
  const s = dong.trim();
  if (!s) return null;

  for (const sep of ["\t", " - ", " – ", " — ", " : ", ": ", "="]) {
    const i = s.indexOf(sep);
    if (i > 0) {
      return { word: s.slice(0, i).trim(), meaningVi: s.slice(i + sep.length).trim() || undefined };
    }
  }
  // Dấu phẩy: chỉ coi là phân cách khi phần trước nó trông như một từ/cụm Anh
  const c = s.indexOf(",");
  if (c > 0 && /^[A-Za-z][A-Za-z\s'’-]*$/.test(s.slice(0, c).trim())) {
    return { word: s.slice(0, c).trim(), meaningVi: s.slice(c + 1).trim() || undefined };
  }
  return { word: s };
}

export default function NewDeckPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [part, setPart] = useState<number | "">("");
  const [danDach, setDanDach] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const cards = useMemo<CardDraft[]>(() => {
    const seen = new Set<string>();
    const out: CardDraft[] = [];
    for (const dong of danDach.split("\n")) {
      const r = tachDong(dong);
      if (!r) continue;
      const k = r.word.toLowerCase().replace(/\s+/g, " ");
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(r);
    }
    return out;
  }, [danDach]);

  const soTrung = useMemo(() => {
    const tong = danDach.split("\n").filter((d) => tachDong(d)).length;
    return tong - cards.length;
  }, [danDach, cards.length]);

  async function luu() {
    if (!title.trim()) {
      setLoi("Chưa đặt tên bộ thẻ");
      return;
    }
    if (cards.length === 0) {
      setLoi("Chưa có từ nào — dán danh sách vào ô bên dưới");
      return;
    }
    setDangLuu(true);
    setLoi(null);
    try {
      const { deck } = await createDeck({
        title: title.trim(),
        description: description.trim() || undefined,
        part: part === "" ? undefined : part,
        cards,
      });
      window.dispatchEvent(new Event("decks:changed"));
      router.push(`/journal/vocab/decks/${deck.id}`);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không lưu được bộ thẻ");
      setDangLuu(false);
    }
  }

  return (
    <div className="space-y-4" style={{ maxWidth: 760 }}>
      <PageHeading
        title="Tạo bộ thẻ"
        note="Dán danh sách từ — mỗi dòng một từ, kèm nghĩa nếu có"
        actions={
          <Link
            href="/journal/vocab"
            className="px-3 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
          >
            ← Sổ từ vựng
          </Link>
        }
      />

      <Sheet stack className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>
            TÊN BỘ THẺ *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Part 7 — hợp đồng & thanh toán"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            autoFocus
          />
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr auto" }}>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>
              MÔ TẢ (tuỳ chọn)
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú ngắn cho chính mình"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>
              PART
            </label>
            <select
              value={part}
              onChange={(e) => setPart(e.target.value === "" ? "" : Number(e.target.value))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                <option key={p} value={p}>Part {p}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>
            DANH SÁCH TỪ *
          </label>
          <textarea
            value={danDach}
            onChange={(e) => setDanDach(e.target.value)}
            rows={10}
            placeholder={"negotiate\tđàm phán\ndeadline - hạn chót\ninvoice: hoá đơn\nwarehouse"}
            className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
          <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
            Mỗi dòng một từ. Nghĩa đặt sau Tab, dấu <code>-</code>, <code>:</code> hoặc <code>,</code> — dán
            thẳng từ Excel cũng được. Để trống phần nghĩa thì điền sau.
          </p>
        </div>

        {cards.length > 0 && (
          <div className="rounded-lg p-3" style={{ background: "var(--bg-secondary)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              Đọc được {cards.length} từ
              {soTrung > 0 && (
                <span className="font-normal" style={{ color: "var(--text-muted)" }}>
                  {" "}· bỏ {soTrung} dòng trùng
                </span>
              )}
            </p>
            <ul className="text-xs space-y-0.5" style={{ color: "var(--text-muted)" }}>
              {cards.slice(0, 6).map((c, i) => (
                <li key={i}>
                  <span style={{ color: "var(--text-primary)" }}>{c.word}</span>
                  {c.meaningVi ? ` — ${c.meaningVi}` : " — (chưa có nghĩa)"}
                </li>
              ))}
              {cards.length > 6 && <li>… còn {cards.length - 6} từ nữa</li>}
            </ul>
          </div>
        )}

        {loi && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(185,64,64,.1)", color: RED }}>
            {loi}
          </p>
        )}

        <button
          onClick={luu}
          disabled={dangLuu}
          className="w-full py-3 rounded-xl font-bold text-sm"
          style={{ background: "var(--accent-primary)", color: "#fff", opacity: dangLuu ? 0.6 : 1 }}
        >
          {dangLuu ? "Đang lưu…" : `Tạo bộ ${cards.length > 0 ? `(${cards.length} thẻ)` : ""}`}
        </button>

        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Nghĩa, phiên âm và ví dụ còn thiếu sẽ được AI điền ở bước sau.
        </p>
      </Sheet>
    </div>
  );
}
