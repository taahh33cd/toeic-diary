"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createDeck, enrichWords, suggestDeckWords, wordIsDue, type CardDraft, type Level } from "@/lib/vocab/client";
import FromContentPicker from "@/components/vocab/FromContentPicker";
import { useVocabWords } from "@/hooks/useVocabWords";
import { LEVELS, LevelBadge, chipStyle, isLeech, levelLabel } from "@/components/vocab/home/shared";

const RED = "var(--accent-red, #B94040)";

type Cach = "so" | "dan" | "bai" | "ai";

const CACH: { id: Cach; k: string; t: string; d: string }[] = [
  { id: "so", k: "A", t: "Chọn từ trong sổ", d: "Lọc theo Hay quên, cấp, Part rồi tick" },
  { id: "dan", k: "B", t: "Dán danh sách", d: "Từ Excel, Quizlet, ghi chú — AI điền nốt nghĩa" },
  { id: "bai", k: "C", t: "Từ bài đã học", d: "Rút từ câu làm sai, bài nghe, bài đọc, sổ lỗi" },
  { id: "ai", k: "D", t: "AI gợi ý theo chủ đề", d: "Chọn chủ đề + cấp, AI đề xuất từ chưa có trong sổ" },
];

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
    if (i > 0) return { word: s.slice(0, i).trim(), meaningVi: s.slice(i + sep.length).trim() || undefined };
  }
  // Dấu phẩy: chỉ coi là phân cách khi phần trước nó trông như một từ/cụm Anh
  const c = s.indexOf(",");
  if (c > 0 && /^[A-Za-z][A-Za-z\s'’-]*$/.test(s.slice(0, c).trim())) {
    return { word: s.slice(0, c).trim(), meaningVi: s.slice(c + 1).trim() || undefined };
  }
  return { word: s };
}

const inputStyle: React.CSSProperties = {
  minHeight: 48,
  background: "var(--bg-primary)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
};

export default function NewDeckPage() {
  const router = useRouter();
  const [cach, setCach] = useState<Cach | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [part, setPart] = useState<number | "">("");
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  // B. Dán danh sách
  const [danDach, setDanDach] = useState("");
  // Thẻ đã được AI điền/sinh (B, C, D); null = chưa chạy AI
  const [daDien, setDaDien] = useState<CardDraft[] | null>(null);
  const [dangDien, setDangDien] = useState(false);
  const [conLuot, setConLuot] = useState<number | null>(null);
  const [sourceRef, setSourceRef] = useState<string | null>(null);

  // A. Chọn từ trong sổ
  const { words } = useVocabWords(cach === "so");
  const [locSo, setLocSo] = useState<"all" | "leech" | "due">("all");
  const [capSo, setCapSo] = useState("all");
  const [timSo, setTimSo] = useState("");
  const [chonSo, setChonSo] = useState<Set<string>>(new Set());

  // D. AI gợi ý
  const [chuDe, setChuDe] = useState("");
  const [capAi, setCapAi] = useState<Level>("650");
  const [soAi, setSoAi] = useState(20);

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

  const soLoc = useMemo(() => {
    const q = timSo.trim().toLowerCase();
    return words.filter(
      (w) =>
        (locSo === "all" || (locSo === "leech" ? isLeech(w) : wordIsDue(w))) &&
        (capSo === "all" || w.level === capSo) &&
        (!q || w.word.toLowerCase().includes(q) || (w.meaningVi ?? "").toLowerCase().includes(q))
    );
  }, [words, locSo, capSo, timSo]);

  const dsLuu: CardDraft[] =
    cach === "so"
      ? words
          .filter((w) => chonSo.has(w.wordKey))
          .map((w) => ({
            word: w.word,
            meaningVi: w.meaningVi ?? undefined,
            ipa: w.ipa ?? undefined,
            pos: w.pos ?? undefined,
            definition: w.definition ?? undefined,
            example: w.example ?? undefined,
            imageUrl: w.imageUrl ?? undefined,
            audioUrl: w.audioUrl ?? undefined,
          }))
      : cach === "dan"
        ? daDien ?? cards
        : daDien ?? [];

  function doiCach(c: Cach | null) {
    setCach(c);
    setDaDien(null);
    setSourceRef(null);
    setLoi(null);
  }

  async function dien() {
    if (cards.length === 0 || dangDien) return;
    setDangDien(true);
    setLoi(null);
    try {
      const { words: ws, remaining } = await enrichWords(cards.map((c) => c.word));
      const theoTu = new Map(ws.map((w) => [w.word.toLowerCase().replace(/\s+/g, " "), w]));
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

  async function goiY() {
    if (dangDien || chuDe.trim().length < 2) return;
    setDangDien(true);
    setLoi(null);
    try {
      const r = await suggestDeckWords(chuDe.trim(), capAi, soAi);
      if (!r.ok) {
        setLoi(r.reason);
        return;
      }
      setDaDien(r.cards.map((c) => ({ word: c.word, pos: c.pos, meaningVi: c.meaningVi, example: c.example })));
      if (!title.trim()) setTitle(`${chuDe.trim()} · cấp ${levelLabel(capAi)}`);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không gợi ý được");
    } finally {
      setDangDien(false);
    }
  }

  async function luu() {
    if (!title.trim()) {
      setLoi("Chưa đặt tên bộ thẻ");
      return;
    }
    if (dsLuu.length === 0) {
      setLoi("Chưa có từ nào trong bộ");
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
        source: cach === "bai" ? "ai_content" : cach === "ai" || (cach === "dan" && daDien) ? "ai_bulk" : "manual",
        sourceRef: sourceRef ?? undefined,
      });
      window.dispatchEvent(new Event("decks:changed"));
      window.dispatchEvent(new Event("vocab:changed"));
      router.push(`/journal/vocab/decks/${deck.id}`);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không lưu được bộ thẻ");
      setDangLuu(false);
    }
  }

  const xemTruoc = cach !== "so" && dsLuu.length > 0;

  return (
    <div className="flex flex-col gap-4 max-w-3xl pb-40 md:pb-24">
      <div className="flex items-center gap-2">
        {cach ? (
          <button type="button" onClick={() => doiCach(null)} className="text-sm font-semibold" style={{ minHeight: 44, color: "var(--text-muted)" }}>
            ← Chọn cách khác
          </button>
        ) : (
          <Link href="/journal/vocab?tab=decks" className="text-sm font-semibold flex items-center" style={{ minHeight: 44, color: "var(--text-muted)" }}>
            ← Bộ thẻ
          </Link>
        )}
      </div>
      <h1 className="hand leading-tight" style={{ fontSize: "clamp(1.6rem, 1.2rem + 1.5vw, 2.2rem)", color: "var(--text-primary)" }}>
        {cach ? CACH.find((c) => c.id === cach)!.t : "Tạo bộ mới"}
      </h1>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="flex flex-col gap-1 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
          TÊN BỘ *
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Ví dụ: Part 7 — hợp đồng & thanh toán" className="px-3 rounded-lg text-base font-normal outline-none" style={inputStyle} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
          PART
          <select value={part} onChange={(e) => setPart(e.target.value === "" ? "" : Number(e.target.value))} className="px-3 rounded-lg text-sm font-normal" style={inputStyle}>
            <option value="">—</option>
            {[1, 2, 3, 4, 5, 6, 7].map((p) => (
              <option key={p} value={p}>Part {p}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold sm:col-span-2" style={{ color: "var(--text-muted)" }}>
          MÔ TẢ (tuỳ chọn)
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} placeholder="Ghi chú ngắn cho chính mình" className="px-3 rounded-lg text-sm font-normal outline-none" style={inputStyle} />
        </label>
      </div>

      {!cach && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Lấy từ ở đâu?</p>
          {CACH.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => doiCach(c.id)}
              className="flex items-center gap-3 rounded-2xl p-4 text-left"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", minHeight: 72 }}
            >
              <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold" style={{ background: "var(--bg-secondary)", color: "var(--accent-primary)" }}>{c.k}</span>
              <span className="flex-1">
                <span className="block font-bold">{c.t}</span>
                <span className="block text-sm" style={{ color: "var(--text-muted)" }}>{c.d}</span>
              </span>
              <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>›</span>
            </button>
          ))}
        </div>
      )}

      {/* A. Chọn từ trong sổ */}
      {cach === "so" && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {(
              [
                ["all", "Tất cả"],
                ["leech", "Hay quên"],
                ["due", "Đến hạn"],
              ] as const
            ).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={locSo === k} onClick={() => setLocSo(k)} className="rounded-full px-3 text-sm font-semibold" style={{ minHeight: 38, ...chipStyle(locSo === k) }}>
                {l}
              </button>
            ))}
            <span className="w-px mx-1" style={{ background: "var(--border)" }} />
            {["all", ...LEVELS].map((l) => (
              <button key={l} type="button" aria-pressed={capSo === l} onClick={() => setCapSo(l)} className="rounded-full px-3 text-xs font-semibold" style={{ minHeight: 38, ...chipStyle(capSo === l) }}>
                {l === "all" ? "Mọi cấp" : levelLabel(l)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input value={timSo} onChange={(e) => setTimSo(e.target.value)} placeholder="Tìm trong sổ…" aria-label="Tìm trong sổ" className="flex-1 px-3 rounded-lg text-sm outline-none" style={{ ...inputStyle, minHeight: 44 }} />
            <button
              type="button"
              onClick={() =>
                setChonSo((s) => {
                  const n = new Set(s);
                  const tatCaDaChon = soLoc.every((w) => n.has(w.wordKey));
                  soLoc.forEach((w) => (tatCaDaChon ? n.delete(w.wordKey) : n.add(w.wordKey)));
                  return n;
                })
              }
              className="rounded-lg px-3 text-sm font-semibold"
              style={{ minHeight: 44, border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              {soLoc.length && soLoc.every((w) => chonSo.has(w.wordKey)) ? "Bỏ chọn" : "Chọn"} {soLoc.length} từ đang lọc
            </button>
          </div>
          <div className="rounded-2xl overflow-y-auto" style={{ maxHeight: 440, background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            {soLoc.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Không có từ nào khớp.</p>}
            {soLoc.map((w) => (
              <label key={w.wordKey} className="flex items-center gap-3 px-3 cursor-pointer" style={{ minHeight: 52, borderBottom: "1px solid var(--border)" }}>
                <input
                  type="checkbox"
                  checked={chonSo.has(w.wordKey)}
                  onChange={() =>
                    setChonSo((s) => {
                      const n = new Set(s);
                      if (n.has(w.wordKey)) n.delete(w.wordKey);
                      else n.add(w.wordKey);
                      return n;
                    })
                  }
                  className="w-5 h-5"
                  style={{ accentColor: "var(--accent-primary)" }}
                />
                <span className="flex-1 min-w-0">
                  <span className="font-bold" style={{ fontFamily: "Lora, serif", color: "var(--text-primary)" }}>{w.word}</span>{" "}
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>{w.meaningVi ?? ""}</span>
                </span>
                <LevelBadge level={w.level} />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* B. Dán danh sách */}
      {cach === "dan" && (
        <label className="flex flex-col gap-1 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
          DANH SÁCH TỪ — mỗi dòng một từ; nghĩa đặt sau Tab, “-”, “:” hoặc “,”
          <textarea
            value={danDach}
            onChange={(e) => {
              setDanDach(e.target.value);
              setDaDien(null);
            }}
            rows={9}
            placeholder={"negotiate\tđàm phán\ndeadline - hạn chót\ninvoice: hoá đơn\nwarehouse"}
            className="px-3 py-2 rounded-lg text-sm font-mono font-normal outline-none"
            style={inputStyle}
          />
        </label>
      )}

      {/* C. Từ bài đã học */}
      {cach === "bai" && (
        <FromContentPicker
          onCards={(cs, label, ref) => {
            setDaDien(cs);
            setSourceRef(ref);
            if (!title.trim() && label) setTitle(label);
          }}
        />
      )}

      {/* D. AI gợi ý theo chủ đề */}
      {cach === "ai" && (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
            CHỦ ĐỀ
            <input value={chuDe} onChange={(e) => setChuDe(e.target.value)} onKeyDown={(e) => e.key === "Enter" && goiY()} maxLength={80} placeholder="Ví dụ: khách sạn & đặt phòng, tuyển dụng, giao hàng…" className="px-3 rounded-lg text-base font-normal outline-none" style={inputStyle} />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>CẤP ĐỘ</span>
            <div className="flex gap-1.5 flex-wrap">
              {LEVELS.map((l) => (
                <button key={l} type="button" aria-pressed={capAi === l} onClick={() => setCapAi(l)} className="rounded-full px-4 text-sm font-semibold" style={{ minHeight: 40, ...chipStyle(capAi === l) }}>
                  {levelLabel(l)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>SỐ TỪ</span>
            <div className="flex gap-1.5">
              {[10, 20, 30].map((n) => (
                <button key={n} type="button" aria-pressed={soAi === n} onClick={() => setSoAi(n)} className="rounded-full px-4 text-sm font-semibold" style={{ minHeight: 40, ...chipStyle(soAi === n) }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={goiY}
            disabled={dangDien || chuDe.trim().length < 2}
            className="rounded-xl font-bold disabled:opacity-50"
            style={{ minHeight: 48, border: "1.5px solid var(--accent-primary)", color: "var(--accent-primary)" }}
          >
            {dangDien ? "AI đang soạn…" : daDien ? "Gợi ý lại" : "Gợi ý từ"}
          </button>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Mỗi ngày 3 lượt gợi ý · bỏ qua từ đã có trong sổ của bạn.</p>
        </div>
      )}

      {/* Xem trước + sửa (B, C, D) */}
      {xemTruoc && (
        <div className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: "var(--bg-secondary)" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold flex-1" style={{ color: "var(--text-primary)" }}>
              {dsLuu.length} từ
              {cach === "dan" && !daDien && dsLuu.some((c) => !c.meaningVi) && (
                <span className="font-normal" style={{ color: "var(--text-muted)" }}> · {dsLuu.filter((c) => !c.meaningVi).length} từ chưa có nghĩa</span>
              )}
            </p>
            {cach === "dan" && (
              <button type="button" onClick={dien} disabled={dangDien} className="rounded-lg px-3 text-sm font-bold disabled:opacity-60" style={{ minHeight: 40, background: daDien ? "var(--bg-elevated)" : "var(--accent-primary)", color: daDien ? "var(--text-primary)" : "#fff" }}>
                {dangDien ? "Đang tra…" : daDien ? "Điền lại" : "AI điền nốt"}
              </button>
            )}
          </div>
          {daDien && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Kiểm lại nghĩa rồi sửa trước khi lưu — AI có lúc đoán sai.
              {conLuot !== null && conLuot >= 0 && cach === "dan" && ` Còn ${conLuot} lượt điền hôm nay.`}
            </p>
          )}
          <ul className="flex flex-col gap-1.5">
            {dsLuu.map((c, i) => (
              <li key={`${c.word}-${i}`} className="flex items-center gap-2 flex-wrap text-sm">
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{c.word}</span>
                {daDien ? (
                  <input
                    value={c.meaningVi ?? ""}
                    onChange={(e) => setDaDien((ds) => ds!.map((x, j) => (j === i ? { ...x, meaningVi: e.target.value } : x)))}
                    placeholder="nghĩa tiếng Việt"
                    aria-label={`Nghĩa của ${c.word}`}
                    className="flex-1 min-w-[140px] px-2 rounded text-sm outline-none"
                    style={{ ...inputStyle, minHeight: 36 }}
                  />
                ) : (
                  <span className="flex-1" style={{ color: "var(--text-muted)" }}>{c.meaningVi ? `— ${c.meaningVi}` : "— (chưa có nghĩa)"}</span>
                )}
                {daDien && (
                  <button type="button" onClick={() => setDaDien((ds) => ds!.filter((_, j) => j !== i))} aria-label={`Bỏ ${c.word}`} className="w-9 h-9 rounded-lg" style={{ color: "var(--text-muted)" }}>
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {loi && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(185,64,64,.1)", color: RED }}>{loi}</p>
      )}

      {cach && (
        <div className="fixed left-0 right-0 bottom-0 z-30 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+76px)] md:pb-4" style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={luu}
            disabled={dangLuu || dsLuu.length === 0}
            className="w-full max-w-3xl mx-auto block rounded-xl font-bold disabled:opacity-50"
            style={{ minHeight: 52, background: "var(--accent-primary)", color: "#fff" }}
          >
            {dangLuu ? "Đang lưu…" : `Tạo bộ · ${dsLuu.length} từ`}
          </button>
        </div>
      )}
    </div>
  );
}
