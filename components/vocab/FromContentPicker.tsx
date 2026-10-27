"use client";

import { useCallback, useEffect, useState } from "react";
import type { CardDraft } from "@/lib/vocab/types";

const RED = "var(--accent-red, #B94040)";

export type ContentSource = "lesson" | "reading" | "wrong-answers" | "error-log";

interface SourceOption {
  id: string;
  label: string;
  note?: string;
}

const NGUON: { id: ContentSource; nhan: string; moTa: string }[] = [
  { id: "wrong-answers", nhan: "Câu bạn làm sai", moTa: "Từ trong đúng những câu vừa sai ở đề thi thử" },
  { id: "lesson", nhan: "Bài nghe đã học", moTa: "Transcript bài dictation/listening" },
  { id: "reading", nhan: "Bài đọc đã làm", moTa: "Đoạn văn Part 7 bạn vừa luyện" },
  { id: "error-log", nhan: "Sổ lỗi", moTa: "Những ghi chú lỗi bạn tự viết" },
];

/** Dưới ngưỡng này thì nội dung quá ngắn, từ rút ra sẽ cơ bản. */
const NGAN = 400;

export default function FromContentPicker({
  onCards,
}: {
  onCards: (cards: CardDraft[], label: string, sourceRef: string) => void;
}) {
  const [source, setSource] = useState<ContentSource>("wrong-answers");
  const [options, setOptions] = useState<SourceOption[] | null>(null);
  const [chon, setChon] = useState<string>("");
  const [soTu, setSoTu] = useState(12);
  const [dangChay, setDangChay] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [canhBao, setCanhBao] = useState<string | null>(null);

  const taiNguon = useCallback(async () => {
    setOptions(null);
    setChon("");
    setLoi(null);
    try {
      const res = await fetch(`/api/flashcards/ai/from-content?source=${source}`, { cache: "no-store" });
      const d = (await res.json()) as { options?: SourceOption[]; error?: string };
      if (!res.ok) throw new Error(d.error ?? "Không tải được danh sách");
      setOptions(d.options ?? []);
      if (d.options?.length) setChon(d.options[0].id);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không tải được danh sách");
      setOptions([]);
    }
  }, [source]);

  useEffect(() => {
    taiNguon();
  }, [taiNguon]);

  async function chay() {
    if (!chon || dangChay) return;
    setDangChay(true);
    setLoi(null);
    setCanhBao(null);
    try {
      const res = await fetch("/api/flashcards/ai/from-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, ref: chon, count: soTu }),
      });
      const d = (await res.json()) as {
        cards?: CardDraft[];
        label?: string;
        sourceRef?: string;
        charsUsed?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(d.error ?? "Không sinh được từ");
      if ((d.charsUsed ?? 0) < NGAN) {
        setCanhBao(
          `Nội dung khá ngắn (${d.charsUsed} ký tự) nên từ rút ra có thể khá cơ bản — thử nguồn dài hơn nếu cần.`
        );
      }
      onCards(d.cards ?? [], d.label ?? "", d.sourceRef ?? chon);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không sinh được từ");
    } finally {
      setDangChay(false);
    }
  }

  const moTa = NGUON.find((n) => n.id === source)?.moTa;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>
          LẤY TỪ ĐÂU
        </label>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          {NGUON.map((n) => (
            <button
              key={n.id}
              onClick={() => setSource(n.id)}
              className="px-3 py-2 rounded-lg text-xs font-bold text-left"
              style={{
                background: source === n.id ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: source === n.id ? "#fff" : "var(--text-primary)",
                border: "1px solid var(--border)",
              }}
            >
              {n.nhan}
            </button>
          ))}
        </div>
        {moTa && (
          <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>{moTa}</p>
        )}
      </div>

      {options === null ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Đang tải…</p>
      ) : options.length === 0 ? (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
          Bạn chưa có dữ liệu cho nguồn này. Làm một bài rồi quay lại nhé.
        </p>
      ) : (
        <>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>
              CHỌN BÀI
            </label>
            <select
              value={chon}
              onChange={(e) => setChon(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                  {o.note ? ` — ${o.note}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>
                SỐ TỪ
              </label>
              <select
                value={soTu}
                onChange={(e) => setSoTu(Number(e.target.value))}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                {[8, 12, 16, 20].map((n) => (
                  <option key={n} value={n}>{n} từ</option>
                ))}
              </select>
            </div>
            <button
              onClick={chay}
              disabled={dangChay || !chon}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: "var(--accent-primary)", color: "#fff", opacity: dangChay ? 0.6 : 1 }}
            >
              {dangChay ? "AI đang đọc bài…" : "✨ Rút từ vựng"}
            </button>
          </div>
        </>
      )}

      {canhBao && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(234,179,8,.12)", color: "var(--text-primary)" }}>
          {canhBao}
        </p>
      )}
      {loi && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(185,64,64,.1)", color: RED }}>
          {loi}
        </p>
      )}
    </div>
  );
}
