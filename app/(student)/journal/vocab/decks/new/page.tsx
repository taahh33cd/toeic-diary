"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeading } from "@/components/journal/paper/PageHeading";
import { Sheet } from "@/components/journal/paper/Sheet";
import { createDeck, enrichWords, type CardDraft } from "@/lib/vocab/client";
import FromContentPicker from "@/components/vocab/FromContentPicker";

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

  // Thẻ đã được AI điền; null = chưa chạy AI, dùng thẳng danh sách dán vào.
  const [daDien, setDaDien] = useState<CardDraft[] | null>(null);
  const [dangDien, setDangDien] = useState(false);
  const [conLuot, setConLuot] = useState<number | null>(null);

  /** "dan" = dán danh sách tay · "bai" = rút từ bài đã học */
  const [cheDo, setCheDo] = useState<"dan" | "bai">("dan");
  const [sourceRef, setSourceRef] = useState<string | null>(null);

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

  const thieuNghia = useMemo(() => cards.filter((c) => !c.meaningVi).length, [cards]);

  const soTrung = useMemo(() => {
    const tong = danDach.split("\n").filter((d) => tachDong(d)).length;
    return tong - cards.length;
  }, [danDach, cards.length]);

  async function dien() {
    if (cards.length === 0 || dangDien) return;
    setDangDien(true);
    setLoi(null);
    try {
      const { words, remaining } = await enrichWords(cards.map((c) => c.word));
      const theoTu = new Map(words.map((w) => [w.word.toLowerCase().replace(/\s+/g, " "), w]));
      // Nghĩa học viên TỰ gõ được giữ nguyên — AI chỉ bù phần còn trống.
      setDaDien(
        cards.map((c) => {
          const e = theoTu.get(c.word.toLowerCase().replace(/\s+/g, " "));
          if (!e) return c;
          return {
            ...c,
            ipa: c.ipa ?? e.ipa,
            pos: c.pos ?? e.pos,
            meaningVi: c.meaningVi ?? e.meaningVi,
            definition: c.definition ?? e.definition,
            example: c.example ?? e.example,
            audioUrl: c.audioUrl ?? e.audioUrl,
          };
        })
      );
      setConLuot(remaining);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không điền được");
    } finally {
      setDangDien(false);
    }
  }

  async function luu() {
    if (!title.trim()) {
      setLoi("Chưa đặt tên bộ thẻ");
      return;
    }
    const dsLuu = daDien ?? cards;
    if (dsLuu.length === 0) {
      setLoi(
        cheDo === "dan"
          ? "Chưa có từ nào — dán danh sách vào ô bên dưới"
          : "Chưa có từ nào — chọn một bài rồi bấm Rút từ vựng"
      );
      return;
    }
    setDangLuu(true);
    setLoi(null);
    try {
      const { deck } = await createDeck({
        title: title.trim(),
        description: description.trim() || undefined,
        part: part === "" ? undefined : part,
        cards: dsLuu,
        source: cheDo === "bai" ? "ai_content" : daDien ? "ai_bulk" : "manual",
        sourceRef: sourceRef ?? undefined,
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
        <div className="flex gap-2">
          {([
            ["dan", "📋 Dán danh sách"],
            ["bai", "✨ Rút từ bài đã học"],
          ] as const).map(([id, nhan]) => (
            <button
              key={id}
              onClick={() => {
                setCheDo(id);
                setDaDien(null);
                setSourceRef(null);
                setLoi(null);
              }}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-bold"
              style={{
                background: cheDo === id ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: cheDo === id ? "#fff" : "var(--text-primary)",
              }}
            >
              {nhan}
            </button>
          ))}
        </div>

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

        {cheDo === "dan" ? (
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
        ) : (
          <FromContentPicker
            onCards={(cs, label, ref) => {
              setDaDien(cs);
              setSourceRef(ref);
              // Gợi ý sẵn tên bộ theo bài, học viên sửa được
              if (!title.trim() && label) setTitle(label);
            }}
          />
        )}

        {(daDien ?? cards).length > 0 && (
          <div className="rounded-lg p-3" style={{ background: "var(--bg-secondary)" }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                {cheDo === "bai"
                  ? `AI rút được ${(daDien ?? []).length} từ`
                  : `Đọc được ${cards.length} từ`}
                {cheDo === "dan" && soTrung > 0 && (
                  <span className="font-normal" style={{ color: "var(--text-muted)" }}>
                    {" "}· bỏ {soTrung} dòng trùng
                  </span>
                )}
                {cheDo === "dan" && thieuNghia > 0 && !daDien && (
                  <span className="font-normal" style={{ color: "var(--text-muted)" }}>
                    {" "}· {thieuNghia} từ chưa có nghĩa
                  </span>
                )}
              </p>
              {cheDo === "dan" && (
              <button
                onClick={dien}
                disabled={dangDien}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{
                  background: daDien ? "var(--bg-elevated)" : "var(--accent-primary)",
                  color: daDien ? "var(--text-primary)" : "#fff",
                  opacity: dangDien ? 0.6 : 1,
                }}
              >
                {dangDien ? "Đang tra…" : daDien ? "✨ Điền lại" : "✨ AI điền nốt"}
              </button>
              )}
            </div>

            {daDien && (
              <p className="text-xs mb-2" style={{ color: "var(--accent-green, #4A7C59)" }}>
                {cheDo === "bai" ? "Lấy được" : "Đã điền"}{" "}
                {daDien.filter((c) => c.meaningVi).length}/{daDien.length} nghĩa,
                {" "}{daDien.filter((c) => c.ipa).length} phiên âm,
                {" "}{daDien.filter((c) => c.example).length} câu ví dụ.
                {conLuot !== null && conLuot >= 0 && ` Còn ${conLuot} lượt hôm nay.`}
                {" "}Kiểm lại rồi sửa trước khi lưu nhé — AI có lúc đoán sai.
              </p>
            )}

            <ul className="text-xs space-y-1.5" style={{ color: "var(--text-muted)" }}>
              {(daDien ?? cards).map((c, i) => (
                <li key={i}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{c.word}</span>
                    {c.ipa && <span className="font-mono">{c.ipa}</span>}
                    {daDien ? (
                      // Sửa được ngay tại đây: AI đoán sai nghĩa là chuyện
                      // thường (vd "quarterly" → "tạp chí quý" thay vì "hàng
                      // quý"), cảnh báo mà không cho sửa thì vô nghĩa.
                      <input
                        value={c.meaningVi ?? ""}
                        onChange={(e) =>
                          setDaDien((ds) =>
                            ds!.map((x, j) => (j === i ? { ...x, meaningVi: e.target.value } : x))
                          )
                        }
                        placeholder="nghĩa tiếng Việt"
                        className="flex-1 min-w-[140px] px-2 py-1 rounded text-xs outline-none"
                        style={{
                          background: "var(--bg-primary)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                        }}
                      />
                    ) : (
                      <span>{c.meaningVi ? `— ${c.meaningVi}` : "— (chưa có nghĩa)"}</span>
                    )}
                  </div>
                  {c.example && <span className="block italic opacity-75 pl-3">“{c.example}”</span>}
                </li>
              ))}
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
