"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playWord } from "@/lib/vocab/audio";
import { chamGo, laDangGo, sinhCauHoi, QUIZ_TYPES, type CauHoi, type QuizType } from "@/lib/vocab/quiz";
import type { CardRow, ProgressRow } from "@/lib/vocab/client";

const GREEN = "var(--accent-green, #4A7C59)";
const RED = "var(--accent-red, #B94040)";

interface KetQua {
  word: string;
  quizType: string;
  correct: boolean;
  answerMs: number;
  given?: string;
}

export default function QuizRunner({
  deckId,
  title,
  cards,
  progress,
  onExit,
}: {
  deckId: string;
  title: string;
  cards: CardRow[];
  progress: ProgressRow[];
  onExit: () => void;
}) {
  const [modes, setModes] = useState<QuizType[]>(["word-to-meaning", "meaning-to-typing"]);
  const [chiDenHan, setChiDenHan] = useState(false);
  const [batDau, setBatDau] = useState(false);

  const [cauHoi, setCauHoi] = useState<CauHoi[]>([]);
  const [boQua, setBoQua] = useState({ thieuAnh: 0, thieuNghia: 0 });
  const [idx, setIdx] = useState(0);
  const [daChon, setDaChon] = useState<string | null>(null);
  const [nhap, setNhap] = useState("");
  const [ketQua, setKetQua] = useState<KetQua[]>([]);
  const [xong, setXong] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [tomTat, setTomTat] = useState<{ correct: number; total: number; percent: number } | null>(null);

  const batDauCau = useRef(Date.now());
  const batDauPhien = useRef(Date.now());
  const oNhap = useRef<HTMLInputElement>(null);

  const coAnh = useMemo(() => cards.filter((c) => c.imageUrl).length, [cards]);

  const cau = cauHoi[idx];
  const daTraLoi = daChon !== null;

  const gui = useCallback(
    async (ds: KetQua[]) => {
      if (ds.length === 0) {
        onExit();
        return;
      }
      setDangGui(true);
      try {
        const res = await fetch("/api/flashcards/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deckId,
            modes,
            runMode: "practice",
            durationMs: Date.now() - batDauPhien.current,
            items: ds,
          }),
        });
        const d = (await res.json()) as { correct?: number; total?: number; percent?: number; error?: string };
        if (!res.ok) throw new Error(d.error ?? "Không lưu được kết quả");
        setTomTat({ correct: d.correct ?? 0, total: d.total ?? ds.length, percent: d.percent ?? 0 });
        window.dispatchEvent(new Event("vocab:reviewed"));
      } catch (e) {
        setLoi(e instanceof Error ? e.message : "Không lưu được kết quả");
      } finally {
        setDangGui(false);
      }
    },
    [deckId, modes, onExit]
  );

  function traLoi(dung: boolean, chonId: string, given?: string) {
    if (daTraLoi || !cau) return;
    setDaChon(chonId);
    setKetQua((r) => [
      ...r,
      {
        word: cau.word,
        quizType: cau.type,
        correct: dung,
        answerMs: Date.now() - batDauCau.current,
        given,
      },
    ]);
  }

  function tiep() {
    if (idx + 1 >= cauHoi.length) {
      setXong(true);
      gui([
        ...ketQua,
      ]);
      return;
    }
    setIdx((i) => i + 1);
    setDaChon(null);
    setNhap("");
    batDauCau.current = Date.now();
  }

  // Dạng nghe thì phát ngay khi câu hiện ra, khỏi bắt bấm thêm một nút
  useEffect(() => {
    if (!batDau || !cau) return;
    if (cau.de.nghe) playWord(cau.word);
    if (laDangGo(cau.type)) setTimeout(() => oNhap.current?.focus(), 80);
  }, [batDau, cau]);

  // ── Màn chọn dạng ──
  if (!batDau) {
    const thu = sinhCauHoi(cards, progress, { modes, chiDenHan });
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }} className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="text-sm px-2 py-1 rounded-lg"
            style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}>←</button>
          <div>
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>Quiz · {title}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {cards.length} thẻ · {coAnh} thẻ có ảnh
            </p>
          </div>
        </div>

        <div className="rounded-xl p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>CHỌN DẠNG CÂU HỎI</p>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
            {QUIZ_TYPES.map((t) => {
              const chon = modes.includes(t.id);
              const khoa = t.canAnh && coAnh < 4;
              return (
                <button
                  key={t.id}
                  disabled={khoa}
                  onClick={() =>
                    setModes((m) => (m.includes(t.id) ? m.filter((x) => x !== t.id) : [...m, t.id]))
                  }
                  className="px-2.5 py-2 rounded-lg text-xs font-semibold text-left"
                  style={{
                    background: chon ? "var(--accent-primary)" : "var(--bg-secondary)",
                    color: chon ? "#fff" : khoa ? "var(--text-muted)" : "var(--text-primary)",
                    opacity: khoa ? 0.5 : 1,
                  }}
                  title={khoa ? "Cần ít nhất 4 thẻ có ảnh" : undefined}
                >
                  {t.canNghe && "🔊 "}
                  {t.canAnh && "🖼️ "}
                  {t.nhan}
                  {khoa && " (chưa đủ ảnh)"}
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 mt-3 text-xs cursor-pointer" style={{ color: "var(--text-primary)" }}>
            <input type="checkbox" checked={chiDenHan} onChange={(e) => setChiDenHan(e.target.checked)} />
            Chỉ ôn từ đang đến hạn
          </label>
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Sẽ ra <b style={{ color: "var(--text-primary)" }}>{thu.cauHoi.length} câu</b>
          {" "}— mỗi thẻ sinh một câu cho mỗi dạng bạn chọn.
          {thu.boQua.thieuAnh > 0 && ` Bỏ qua ${thu.boQua.thieuAnh} lượt vì thẻ chưa có ảnh.`}
          {thu.boQua.thieuNghia > 0 && ` Bỏ qua ${thu.boQua.thieuNghia} lượt vì thẻ chưa có nghĩa.`}
        </p>

        <button
          onClick={() => {
            const r = sinhCauHoi(cards, progress, { modes, chiDenHan });
            setCauHoi(r.cauHoi);
            setBoQua(r.boQua);
            setIdx(0);
            setKetQua([]);
            setDaChon(null);
            setNhap("");
            batDauCau.current = Date.now();
            batDauPhien.current = Date.now();
            setBatDau(true);
          }}
          disabled={modes.length === 0 || thu.cauHoi.length === 0}
          className="w-full py-3 rounded-xl font-bold text-sm"
          style={{
            background: thu.cauHoi.length > 0 ? "var(--accent-primary)" : "var(--bg-elevated)",
            color: thu.cauHoi.length > 0 ? "#fff" : "var(--text-muted)",
          }}
        >
          {modes.length === 0
            ? "Chọn ít nhất một dạng"
            : thu.cauHoi.length === 0
              ? "Không sinh được câu nào — thử bỏ lọc đến hạn"
              : `Bắt đầu ${thu.cauHoi.length} câu`}
        </button>
      </div>
    );
  }

  // ── Màn kết thúc ──
  if (xong) {
    const dung = ketQua.filter((r) => r.correct).length;
    const sai = ketQua.filter((r) => !r.correct);
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }} className="text-center space-y-4">
        <div className="text-4xl">{dung === ketQua.length ? "🎉" : "📊"}</div>
        <p className="text-xl font-bold" style={{ color: dung === ketQua.length ? GREEN : "var(--text-primary)" }}>
          Đúng {dung}/{ketQua.length} câu
          {tomTat && ` · ${tomTat.percent}%`}
        </p>
        {dangGui && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Đang lưu kết quả…</p>}
        {loi && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(185,64,64,.1)", color: RED }}>
            {loi} — kết quả lượt này CHƯA được lưu.
          </p>
        )}

        {sai.length > 0 && (
          <div className="text-left rounded-xl p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>
              {sai.length} CÂU SAI — SẼ QUAY LẠI SỚM
            </p>
            <ul className="text-sm space-y-1">
              {sai.map((r, i) => (
                <li key={i} style={{ color: "var(--text-primary)" }}>
                  <b>{r.word}</b>
                  {r.given && <span style={{ color: RED }}> — bạn gõ “{r.given}”</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button onClick={onExit} className="px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "var(--accent-primary)", color: "#fff" }}>
          ← Về bộ thẻ
        </button>
      </div>
    );
  }

  if (!cau) return null;

  const dangGo = laDangGo(cau.type);
  const nhanDang = QUIZ_TYPES.find((t) => t.id === cau.type)?.nhan ?? cau.type;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => {
            setXong(true);
            gui(ketQua);
          }}
          className="text-sm px-2 py-1 rounded-lg"
          style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
          title="Dừng và lưu phần đã làm"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate" style={{ color: "var(--text-muted)" }}>{nhanDang}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {idx + 1}/{cauHoi.length} · đúng {ketQua.filter((r) => r.correct).length}
          </p>
        </div>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "var(--border)" }}>
        <div className="h-full transition-all"
          style={{ width: `${(idx / cauHoi.length) * 100}%`, background: "var(--accent-primary)" }} />
      </div>

      {/* Đề bài */}
      <div className="rounded-2xl p-5 mb-4 text-center"
        style={{ background: "var(--bg-elevated)", border: "1.5px solid var(--border)", minHeight: 150 }}>
        {cau.de.nghe && (
          <button onClick={() => playWord(cau.word)} className="px-5 py-3 rounded-xl text-lg font-bold"
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
            🔊 Nghe lại
          </button>
        )}
        {cau.de.anh && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cau.de.anh} alt="" className="mx-auto rounded-lg" style={{ maxHeight: 180, objectFit: "contain" }} />
        )}
        {cau.de.chu && (
          <p className="hand" style={{ fontSize: "2rem", color: "var(--accent-primary)", lineHeight: 1.2 }}>
            {cau.de.chu}
          </p>
        )}
      </div>

      {/* Trả lời */}
      {dangGo ? (
        <div className="space-y-3">
          <input
            ref={oNhap}
            value={nhap}
            onChange={(e) => setNhap(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if (daTraLoi) tiep();
              else if (nhap.trim()) traLoi(chamGo(nhap, cau.dapAn), "typed", nhap.trim());
            }}
            disabled={daTraLoi}
            placeholder="Gõ từ tiếng Anh…"
            className="w-full px-3 py-3 rounded-xl text-base outline-none text-center"
            style={{
              background: "var(--bg-primary)",
              border: `1.5px solid ${daTraLoi ? (ketQua[ketQua.length - 1]?.correct ? GREEN : RED) : "var(--border)"}`,
              color: "var(--text-primary)",
            }}
          />
          {!daTraLoi && (
            <button onClick={() => nhap.trim() && traLoi(chamGo(nhap, cau.dapAn), "typed", nhap.trim())}
              disabled={!nhap.trim()}
              className="w-full py-2.5 rounded-xl font-bold text-sm"
              style={{ background: "var(--accent-primary)", color: "#fff", opacity: nhap.trim() ? 1 : 0.5 }}>
              Kiểm tra
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-2" style={{ gridTemplateColumns: cau.phuongAn?.[0]?.imageUrl ? "1fr 1fr" : "1fr" }}>
          {cau.phuongAn!.map((p) => {
            const hienDung = daTraLoi && p.dung;
            const hienSai = daTraLoi && daChon === p.id && !p.dung;
            return (
              <button
                key={p.id}
                onClick={() => traLoi(p.dung, p.id)}
                disabled={daTraLoi}
                className="px-3 py-3 rounded-xl text-sm font-semibold text-left"
                style={{
                  background: hienDung ? "rgba(74,124,89,.18)" : hienSai ? "rgba(185,64,64,.14)" : "var(--bg-elevated)",
                  border: `1.5px solid ${hienDung ? GREEN : hienSai ? RED : "var(--border)"}`,
                  color: "var(--text-primary)",
                }}
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="w-full rounded" style={{ height: 110, objectFit: "cover" }} />
                ) : (
                  p.label
                )}
                {hienDung && " ✓"}
              </button>
            );
          })}
        </div>
      )}

      {daTraLoi && (
        <div className="mt-4">
          <p className="text-sm mb-2" style={{ color: "var(--text-primary)" }}>
            <b style={{ color: ketQua[ketQua.length - 1]?.correct ? GREEN : RED }}>
              {ketQua[ketQua.length - 1]?.correct ? "Đúng!" : "Chưa đúng."}
            </b>{" "}
            {cau.word}
            {cau.nghia && ` — ${cau.nghia}`}
          </p>
          <button onClick={tiep} className="w-full py-2.5 rounded-xl font-bold text-sm"
            style={{ background: "var(--accent-primary)", color: "#fff" }}>
            {idx + 1 >= cauHoi.length ? "Xem kết quả" : "Câu tiếp →"}
          </button>
        </div>
      )}

      {boQua.thieuAnh + boQua.thieuNghia > 0 && idx === 0 && (
        <p className="text-xs mt-4 text-center" style={{ color: "var(--text-muted)" }}>
          Đã bỏ {boQua.thieuAnh + boQua.thieuNghia} lượt vì thẻ chưa đủ ảnh/nghĩa.
        </p>
      )}
    </div>
  );
}
