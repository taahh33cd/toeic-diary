"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { FreeItem, StepLevel } from "@/lib/subskills/speaking-p2-steps";
import { RecordingPanel } from "@/components/subskills/speaking/RecordingPanel";

type Note = { step1: string; step2: string; step3: string };
type NotesMap = Record<string, Note>;
type SaveState = "idle" | "saving" | "saved" | "error";

const EMPTY: Note = { step1: "", step2: "", step3: "" };
const LEVELS: (StepLevel | "All")[] = ["All", "Easy", "Medium", "Hard"];

const LEVEL_COLOR: Record<StepLevel, string> = {
  Easy: "rgb(34,197,94)",
  Medium: "rgb(234,179,8)",
  Hard: "rgb(239,68,68)",
};

const STEP_TITLE = [
  "Bước 1 — Where was this picture taken?",
  "Bước 2 — What can you see first?",
  "Bước 3 — Left / right / background",
];

const STEP_HELP = [
  "Địa điểm và chủ thể chính.",
  "Chủ thể nổi bật nhất và hành động của họ.",
  "Vị trí, ngoại hình, trang phục, đồ vật, phần nền.",
];

interface Props {
  items: FreeItem[];
  initialNotes: NotesMap;
  userId: string | null;
}

export default function FreePracticeClient({ items, initialNotes, userId }: Props) {
  const [level, setLevel] = useState<StepLevel | "All">("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<NotesMap>(initialNotes);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [openHint, setOpenHint] = useState<number | null>(null);
  const [showFull, setShowFull] = useState(false);

  // Latest unsaved edit, so switching images can flush it instead of dropping it.
  const pending = useRef<{ itemId: string; note: Note } | null>(null);

  const flush = useCallback(() => {
    const p = pending.current;
    if (!p || !userId) return;
    pending.current = null;
    fetch("/api/subskills/picture-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: p.itemId, ...p.note }),
    })
      .then((r) => setSaveState(r.ok ? "saved" : "error"))
      .catch(() => setSaveState("error"));
  }, [userId]);

  useEffect(() => {
    if (!pending.current) return;
    const t = setTimeout(flush, 1000);
    return () => clearTimeout(t);
  }, [notes, flush]);

  function edit(itemId: string, key: keyof Note, value: string) {
    setNotes((prev) => {
      const note = { ...(prev[itemId] ?? EMPTY), [key]: value };
      pending.current = { itemId, note };
      return { ...prev, [itemId]: note };
    });
    setSaveState(userId ? "saving" : "idle");
  }

  function select(id: string | null) {
    flush();
    setSelectedId(id);
    setOpenHint(null);
    setShowFull(false);
    setSaveState("idle");
  }

  const shown = level === "All" ? items : items.filter((i) => i.level === level);
  const selected = selectedId ? items.find((i) => i.id === selectedId) ?? null : null;

  // ══════════════════════════════════════════════════════════
  // PICKER
  // ══════════════════════════════════════════════════════════
  if (!selected) {
    const written = (id: string) => {
      const n = notes[id];
      return n ? [n.step1, n.step2, n.step3].filter((s) => s.trim()).length : 0;
    };

    return (
      <div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1.1rem" }}>
          {LEVELS.map((l) => (
            <button key={l} onClick={() => setLevel(l)}
              style={{ padding: "5px 14px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                background: level === l ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: level === l ? "#fff" : "var(--text-primary)",
                border: `1.5px solid ${level === l ? "var(--accent-primary)" : "var(--border)"}` }}>
              {l === "All" ? `Tất cả · ${items.length}` : `${l} · ${items.filter((i) => i.level === l).length}`}
            </button>
          ))}
        </div>

        {!userId && (
          <p style={{ fontSize: "0.83rem", color: "rgb(234,179,8)", background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 8, padding: "0.6rem 0.85rem", marginBottom: "1.1rem" }}>
            Bạn chưa đăng nhập — vẫn luyện được bình thường, nhưng ghi chú sẽ mất khi tải lại trang.
          </p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.9rem" }}>
          {shown.map((it) => {
            const n = written(it.id);
            return (
              <button key={it.id} onClick={() => select(it.id)}
                style={{ padding: 0, border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--bg-secondary)", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt={it.title} loading="lazy"
                  style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }} />
                <div style={{ padding: "0.6rem 0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: "0.66rem", fontWeight: 700, color: LEVEL_COLOR[it.level], letterSpacing: "0.05em" }}>
                      {it.level.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>Bộ {it.test}</span>
                    {n > 0 && (
                      <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "var(--accent-primary)", fontWeight: 600 }}>
                        ✎ {n}/3
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
                    {it.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ONE PICTURE
  // ══════════════════════════════════════════════════════════
  const note = notes[selected.id] ?? EMPTY;
  const stepKeys: (keyof Note)[] = ["step1", "step2", "step3"];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
        <button onClick={() => select(null)}
          style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-muted)", fontSize: "0.75rem", cursor: "pointer" }}>
          ← Chọn ảnh khác
        </button>
        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          {selected.title} · {selected.level} · Bộ {selected.test}
        </span>
        <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: saveState === "error" ? "rgb(239,68,68)" : "var(--text-muted)" }}>
          {saveState === "saving" ? "Đang lưu…" : saveState === "saved" ? "✓ Đã lưu" : saveState === "error" ? "Lưu lỗi — thử gõ tiếp" : ""}
        </span>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "1rem" }}>
        <div style={{ width: "100%", background: "var(--bg-elevated)", display: "flex", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.image} alt={selected.title} style={{ maxWidth: "100%", height: "auto", display: "block" }} />
        </div>

        <div style={{ padding: "1.35rem 1.6rem" }}>
          {stepKeys.map((key, i) => (
            <div key={key} style={{ marginBottom: "1.4rem" }}>
              <div style={{ fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, color: "var(--accent-primary)", marginBottom: "0.2rem" }}>
                {STEP_TITLE[i]}
              </div>
              <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>{STEP_HELP[i]}</p>

              <textarea
                value={note[key]}
                onChange={(e) => edit(selected.id, key, e.target.value)}
                rows={4}
                placeholder="Nháp từ vựng, cụm từ hoặc câu của bạn ở đây…"
                style={{ width: "100%", boxSizing: "border-box", padding: "0.7rem 0.9rem", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "1rem", lineHeight: 1.65, fontFamily: "inherit", resize: "vertical" }}
              />

              <button onClick={() => setOpenHint(openHint === i ? null : i)}
                style={{ marginTop: "0.5rem", padding: "0.35rem 0.9rem", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer" }}>
                {openHint === i ? "Ẩn gợi ý" : "Đối chiếu gợi ý"}
              </button>

              {openHint === i && (
                <div style={{ marginTop: "0.6rem", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 8, padding: "0.8rem 1rem" }}>
                  {selected.hints[i].length > 0 && (
                    <>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-primary)", marginBottom: "0.45rem" }}>
                        Từ vựng / cụm từ
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: i < 2 ? "0.8rem" : 0 }}>
                        {selected.hints[i].map((h) => (
                          <span key={h} style={{ fontSize: "0.86rem", padding: "3px 9px", borderRadius: 6, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                            {h}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {i < 2 ? (
                    <>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-primary)", marginBottom: "0.35rem" }}>
                        Mẫu câu
                      </div>
                      <ol style={{ margin: 0, paddingLeft: "1.15rem", fontSize: "0.92rem", color: "var(--text-primary)", lineHeight: 1.7 }}>
                        {(selected.models[i] as string[]).map((m) => <li key={m}>{m}</li>)}
                      </ol>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-primary)", marginBottom: "0.35rem" }}>
                        Đoạn mẫu
                      </div>
                      <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--text-primary)", lineHeight: 1.75 }}>
                        {selected.models[2] as string}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          <button onClick={() => setShowFull((v) => !v)}
            style={{ padding: "0.5rem 1.1rem", borderRadius: 8, border: "1.5px solid var(--accent-primary)", background: "transparent", color: "var(--accent-primary)", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}>
            {showFull ? "Ẩn bài mẫu hoàn chỉnh" : "Xem bài mẫu hoàn chỉnh"}
          </button>

          {showFull && (
            <div style={{ marginTop: "0.7rem", background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "0.85rem 1rem" }}>
              <p style={{ margin: 0, fontSize: "0.97rem", color: "var(--text-primary)", lineHeight: 1.8 }}>{selected.fullModel}</p>
            </div>
          )}

          {userId && (
            <div style={{ marginTop: "1.4rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                🎙 Nói lại cả bài mô tả
              </div>
              <RecordingPanel
                key={selected.id}
                referenceText={selected.fullModel}
                skillId="p2steps-free"
                testNum={selected.test}
                exerciseIndex={0}
                userId={userId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
