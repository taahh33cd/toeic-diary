"use client";

import { useMemo, useState } from "react";
import { Sheet } from "@/components/journal/paper/Sheet";
import { enrichWords, patchDeck, putCards, type CardRow, type DeckSummary } from "@/lib/vocab/client";
import { normalizeWord } from "@/lib/vocab/normalize";
import type { CardDraft } from "@/lib/vocab/types";

const RED = "var(--accent-red, #B94040)";
const AMBER = "rgb(234,179,8)";

type Dong = CardDraft & {
  /** wordKey lúc mở màn sửa — để biết học viên có đổi chữ của từ không. */
  khoaGoc: string;
};

function tuThe(c: CardRow): Dong {
  return {
    word: c.word,
    ipa: c.ipa ?? undefined,
    pos: c.pos ?? undefined,
    meaningVi: c.meaningVi ?? undefined,
    example: c.example ?? undefined,
    definition: c.definition ?? undefined,
    imageUrl: c.imageUrl ?? undefined,
    audioUrl: c.audioUrl ?? undefined,
    khoaGoc: c.wordKey,
  };
}

const O = {
  padding: "5px 8px",
  borderRadius: 6,
  fontSize: ".78rem",
  outline: "none",
  width: "100%",
  background: "var(--bg-primary)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
} as const;

export default function DeckEditor({
  deck,
  cards,
  onDone,
  onCancel,
}: {
  deck: DeckSummary;
  cards: CardRow[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description ?? "");
  const [part, setPart] = useState<number | "">(deck.part ?? "");
  const [dong, setDong] = useState<Dong[]>(() => cards.map(tuThe));

  const [dangLuu, setDangLuu] = useState(false);
  const [dangDien, setDangDien] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [daDien, setDaDien] = useState<number | null>(null);

  function sua(i: number, k: keyof CardDraft, v: string) {
    setDong((ds) => ds.map((d, j) => (j === i ? { ...d, [k]: v || undefined } : d)));
  }

  const thieu = useMemo(
    () => dong.filter((d) => !d.meaningVi || !d.ipa || !d.example).length,
    [dong]
  );

  /**
   * Đổi CHỮ của từ làm đổi wordKey, mà tiến độ ôn khoá theo wordKey — thẻ sẽ
   * mất liên kết với số lần đã ôn của từ cũ. Sửa lỗi gõ thì chấp nhận được,
   * nhưng phải nói trước chứ không để học viên mất công ôn mà không biết.
   */
  const doiTu = useMemo(
    () => dong.filter((d) => d.word.trim() && normalizeWord(d.word) !== d.khoaGoc),
    [dong]
  );

  const trung = useMemo(() => {
    const dem = new Map<string, number>();
    for (const d of dong) {
      const k = normalizeWord(d.word);
      if (k) dem.set(k, (dem.get(k) ?? 0) + 1);
    }
    return [...dem.entries()].filter(([, n]) => n > 1).map(([k]) => k);
  }, [dong]);

  async function dienThieu() {
    const cho = dong.filter((d) => d.word.trim() && (!d.meaningVi || !d.ipa || !d.example));
    if (cho.length === 0 || dangDien) return;
    setDangDien(true);
    setLoi(null);
    try {
      const { words } = await enrichWords(cho.slice(0, 50).map((d) => d.word));
      const theo = new Map(words.map((w) => [normalizeWord(w.word), w]));

      // Dựng mảng mới NGOÀI hàm cập nhật state rồi mới đếm. Đếm bên trong
      // updater của setState là đọc hụt: React chỉ chạy updater lúc render
      // lại, nên biến đếm vẫn bằng 0 ở dòng setDaDien ngay sau đó.
      let n = 0;
      const moiDs = dong.map((d) => {
        const e = theo.get(normalizeWord(d.word));
        if (!e) return d;
        const moi = {
          ...d,
          // Chỉ bù chỗ TRỐNG — không đè lên thứ học viên đã tự viết
          ipa: d.ipa ?? e.ipa,
          pos: d.pos ?? e.pos,
          meaningVi: d.meaningVi ?? e.meaningVi,
          example: d.example ?? e.example,
          audioUrl: d.audioUrl ?? e.audioUrl,
        };
        if (moi.ipa !== d.ipa || moi.meaningVi !== d.meaningVi || moi.example !== d.example) n++;
        return moi;
      });
      setDong(moiDs);
      setDaDien(n);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không điền được");
    } finally {
      setDangDien(false);
    }
  }

  async function luu() {
    const sach = dong.filter((d) => d.word.trim());
    if (sach.length === 0) {
      setLoi("Bộ phải có ít nhất một thẻ");
      return;
    }
    if (trung.length > 0) {
      setLoi(`Từ bị trùng trong bộ: ${trung.join(", ")}. Sửa hoặc xoá bớt trước khi lưu.`);
      return;
    }
    if (!title.trim()) {
      setLoi("Tên bộ không được để trống");
      return;
    }

    setDangLuu(true);
    setLoi(null);
    try {
      if (
        title.trim() !== deck.title ||
        description.trim() !== (deck.description ?? "") ||
        (part === "" ? null : part) !== deck.part
      ) {
        await patchDeck(deck.id, {
          title: title.trim(),
          description: description.trim(),
          part: part === "" ? null : part,
        });
      }
      // khoaGoc chỉ dùng để so sánh trong màn sửa, không gửi lên server
      await putCards(
        deck.id,
        sach.map((d) => {
          const c = { ...d } as Partial<Dong>;
          delete c.khoaGoc;
          return c as CardDraft;
        })
      );
      window.dispatchEvent(new Event("decks:changed"));
      window.dispatchEvent(new Event("vocab:changed"));
      onDone();
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không lưu được");
      setDangLuu(false);
    }
  }

  return (
    <div className="space-y-4">
      <Sheet className="p-4 space-y-3">
        <div className="grid gap-3" style={{ gridTemplateColumns: "2fr 1fr auto" }}>
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-muted)" }}>
              TÊN BỘ
            </label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={O} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-muted)" }}>
              MÔ TẢ
            </label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} style={O} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-muted)" }}>
              PART
            </label>
            <select
              value={part}
              onChange={(e) => setPart(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ ...O, width: "auto" }}
            >
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                <option key={p} value={p}>Part {p}</option>
              ))}
            </select>
          </div>
        </div>
      </Sheet>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {dong.length} thẻ
          {thieu > 0 && ` · ${thieu} thẻ còn thiếu nghĩa, phiên âm hoặc ví dụ`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={dienThieu}
            disabled={dangDien || thieu === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{
              background: thieu > 0 ? "var(--accent-primary)" : "var(--bg-elevated)",
              color: thieu > 0 ? "#fff" : "var(--text-muted)",
              opacity: dangDien ? 0.6 : 1,
            }}
          >
            {dangDien ? "Đang tra…" : "✨ AI điền chỗ trống"}
          </button>
          <button
            onClick={() => setDong((ds) => [...ds, { word: "", khoaGoc: "" }])}
            className="px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
          >
            + Thêm thẻ
          </button>
        </div>
      </div>

      {daDien !== null && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--bg-secondary)", color: "var(--accent-green, #4A7C59)" }}>
          Đã bù chỗ trống cho {daDien} thẻ. AI có lúc đoán sai — xem lại rồi sửa trước khi lưu.
        </p>
      )}

      {doiTu.length > 0 && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(234,179,8,.12)", color: "var(--text-primary)", borderLeft: `3px solid ${AMBER}` }}>
          Bạn đã đổi chữ của {doiTu.length} từ ({doiTu.map((d) => d.khoaGoc || "(thẻ mới)").join(", ")}).
          Tiến độ ôn gắn theo chữ của từ, nên các thẻ này sẽ bắt đầu lại từ 0 lần ôn.
          Sửa lỗi gõ thì không sao, nhưng nếu chỉ muốn đổi nghĩa thì giữ nguyên cột “Từ”.
        </p>
      )}

      {trung.length > 0 && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(185,64,64,.1)", color: RED }}>
          Từ bị trùng trong bộ: {trung.join(", ")}
        </p>
      )}

      <Sheet stack className="p-0 overflow-x-auto">
        <table className="w-full" style={{ fontSize: ".78rem", minWidth: 760 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Từ", "Phiên âm", "Loại", "Nghĩa tiếng Việt", "Ví dụ", ""].map((h) => (
                <th
                  key={h}
                  className="text-left px-2 py-2 font-bold"
                  style={{ color: "var(--text-muted)", fontSize: ".68rem", letterSpacing: ".06em" }}
                >
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dong.map((d, i) => {
              const daDoi = d.word.trim() && normalizeWord(d.word) !== d.khoaGoc && d.khoaGoc;
              return (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-2 py-1.5" style={{ width: "15%" }}>
                    <input
                      value={d.word}
                      onChange={(e) => sua(i, "word", e.target.value)}
                      placeholder="word"
                      style={{ ...O, fontWeight: 600, borderColor: daDoi ? AMBER : "var(--border)" }}
                    />
                  </td>
                  <td className="px-2 py-1.5" style={{ width: "16%" }}>
                    <input
                      value={d.ipa ?? ""}
                      onChange={(e) => sua(i, "ipa", e.target.value)}
                      placeholder="/.../"
                      style={{ ...O, fontFamily: "monospace" }}
                    />
                  </td>
                  <td className="px-2 py-1.5" style={{ width: "8%" }}>
                    <input
                      value={d.pos ?? ""}
                      onChange={(e) => sua(i, "pos", e.target.value)}
                      placeholder="n"
                      style={O}
                    />
                  </td>
                  <td className="px-2 py-1.5" style={{ width: "24%" }}>
                    <input
                      value={d.meaningVi ?? ""}
                      onChange={(e) => sua(i, "meaningVi", e.target.value)}
                      placeholder="nghĩa"
                      style={O}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={d.example ?? ""}
                      onChange={(e) => sua(i, "example", e.target.value)}
                      placeholder="câu ví dụ"
                      style={O}
                    />
                  </td>
                  <td className="px-2 py-1.5" style={{ width: 34 }}>
                    <button
                      onClick={() => setDong((ds) => ds.filter((_, j) => j !== i))}
                      title="Xoá thẻ"
                      className="w-7 h-7 rounded"
                      style={{ color: RED, background: "rgba(185,64,64,.08)" }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Sheet>

      {loi && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(185,64,64,.1)", color: RED }}>
          {loi}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={dangLuu}
          className="px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
        >
          Huỷ
        </button>
        <button
          onClick={luu}
          disabled={dangLuu}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "var(--accent-primary)", color: "#fff", opacity: dangLuu ? 0.6 : 1 }}
        >
          {dangLuu ? "Đang lưu…" : `Lưu ${dong.filter((d) => d.word.trim()).length} thẻ`}
        </button>
      </div>
    </div>
  );
}
