"use client";

/**
 * Khung soạn BTVN dùng chung cho trang lớp, trang học viên và trang Bài tập.
 *
 * Ba cách thêm bài, đều tự điền tên + link:
 *   1. "＋ Từ kho" — chọn trong kho bài của web, bộ flashcard, link ngoài đã dùng.
 *   2. Dán link vào ô đầu form — link trong web tự nhận ra bài, link ngoài tự
 *      lấy tiêu đề trang.
 *   3. "＋ Gõ tay" như trước.
 * Bài lấy từ kho / bộ thẻ được gắn `catalogId` / `deckId` để hệ thống tự đánh
 * dấu xong khi học viên làm (lib/homework/auto-done.ts).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";

import type { ClassSession, Homework } from "@/lib/firebase/types";
import { fetchLinkTitle, loadDecks, loadLibrary } from "@/lib/homework/client";
import {
  HW_CATS,
  deckSlugFromPath,
  fmtDayShort,
  internalPath,
  isHttpUrl,
  nextSessionDate,
  sectionForLib,
  vnTodayKey,
  type HwCatKey,
} from "@/lib/homework/library";
import RichTextInput from "./RichTextInput";
import LibraryDrawer, { Tag } from "./LibraryDrawer";
import TemplatePicker, { saveTemplate } from "./TemplatePicker";
import TargetPicker, { targetKey, type PickedTarget } from "./TargetPicker";
import { contentOf } from "@/lib/homework/content";
import {
  ddmm,
  emptySections,
  hwToSections,
  isLinked,
  sectionsToHw,
  uid,
  usedDate,
  usedMap,
  type Draft,
  type NewDraft,
  type Sections,
} from "./draft";

export type HomeworkEditorProps = {
  /** BTVN có sẵn (sửa) hoặc bản nhân đôi (date rỗng → tự điền ngày). */
  initial?: Homework;
  heading: string;
  targetLabel?: string;
  /** Lịch học tuần của lớp/HV — để tự gợi ý hạn nộp = buổi học kế tiếp. */
  schedule?: ClassSession[];
  /** BTVN đã giao cho cùng đối tượng — để cảnh báo giao trùng. */
  history?: Homework[];
  saveLabel?: string;
  onSave: (hw: Homework) => Promise<void>;
  onAutosave?: (hw: Homework, isNew: boolean) => Promise<void>;
  onClose: () => void;
  /** Hiện thẳng trong trang thay vì hộp thoại nổi. */
  inline?: boolean;
  /** Đang sửa BTVN đã lưu (autosave chỉ cập nhật, không tạo mới). */
  isEdit?: boolean;
  /** Chỉ soạn nội dung (buổi giáo trình, mẫu) — ẩn ngày giao/hạn nộp/tiêu đề. */
  contentOnly?: boolean;
  /**
   * Cho phép "Giao thêm cho" lớp/HV khác ngay khi lưu. `exclude` = đối tượng
   * chính (đã được trang gọi tự giao).
   */
  extraTargets?: { exclude: { type: "class" | "student"; id: string }[] };
};

const SECTION_ORDER: HwCatKey[] = HW_CATS.map((c) => c.key);

export default function HomeworkEditor({
  initial,
  heading,
  targetLabel,
  schedule,
  history,
  saveLabel = "💾 Lưu & Giao cho HV",
  onSave,
  onAutosave,
  onClose,
  inline = false,
  isEdit = false,
  contentOnly = false,
  extraTargets,
}: HomeworkEditorProps) {
  const days = useMemo(() => (schedule ?? []).map((s) => s.day), [schedule]);
  const fresh = !initial?.date;
  const todayKey = vnTodayKey();

  const [date, setDate] = useState(initial?.date || todayKey);
  const [endDate, setEndDate] = useState(() => {
    if (!fresh) return initial?.endDate ?? "";
    return nextSessionDate(todayKey, days) ?? "";
  });
  const [title, setTitle] = useState(initial?.title ?? "");
  const [sections, setSections] = useState<Sections>(() => (initial ? hwToSections(initial) : emptySections()));
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [drawer, setDrawer] = useState<{ section: HwCatKey; query?: string } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  const [extras, setExtras] = useState<PickedTarget[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiNote, setAiNote] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);

  async function aiDraft() {
    if (aiNote.trim().length < 5) return;
    setAiBusy(true);
    setAiMsg(null);
    try {
      const r = await fetch("/api/admin/homework/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: aiNote.trim() }),
      });
      const d = (await r.json().catch(() => ({}))) as {
        items?: { section: HwCatKey; text: string; link: string; catalogId?: string; minutes?: number; why?: string }[];
        error?: string;
      };
      if (!r.ok || !d.items) throw new Error(d.error ?? "AI không soạn được");
      for (const it of d.items) {
        addDrafts(it.section, [
          {
            text: it.text,
            link: it.link,
            desc: it.why ? `<i>${it.why.replace(/[<>&]/g, "")}</i>` : "",
            ...(it.catalogId ? { catalogId: it.catalogId, minutes: it.minutes, srcLink: it.link } : {}),
          },
        ]);
      }
      const auto = d.items.filter((i) => i.catalogId).length;
      setAiMsg({
        tone: "ok",
        text: `AI thêm ${d.items.length} bài (${auto} bài trong kho, tự chấm). Xem lại rồi xoá bài không hợp.`,
      });
    } catch (e) {
      setAiMsg({ tone: "warn", text: e instanceof Error ? e.message : "AI không soạn được" });
    } finally {
      setAiBusy(false);
    }
  }

  const hwIdRef = useRef(initial?.id ?? `hw${Date.now()}`);
  const isNewRef = useRef(!isEdit);
  const onAutosaveRef = useRef(onAutosave);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const firstRun = useRef(true);
  useEffect(() => {
    onAutosaveRef.current = onAutosave;
  }, [onAutosave]);

  const used = useMemo(() => usedMap(history, initial?.id), [history, initial?.id]);

  // Tự lưu 1 giây sau lần sửa cuối (bỏ qua lần render đầu — chưa sửa gì).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!onAutosaveRef.current || !date) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!onAutosaveRef.current) return;
      setSaveStatus("saving");
      try {
        await onAutosaveRef.current(sectionsToHw(hwIdRef.current, date, endDate, title, sections), isNewRef.current);
        isNewRef.current = false;
        setSaveStatus("saved");
      } catch {
        setSaveStatus("idle");
      }
    }, 1000);
    return () => clearTimeout(timerRef.current);
  }, [date, endDate, title, sections]);

  // ─── Thao tác mục ─────────────────────────────────────────────────────────

  const addDrafts = useCallback((section: HwCatKey, drafts: NewDraft[]) => {
    if (drafts.length === 0) return;
    const withIds = drafts.map((d) => ({ ...d, uid: uid() }));
    setSections((s) => ({ ...s, [section]: [...s[section], ...withIds] }));
    setFlash(withIds[withIds.length - 1].uid);
  }, []);

  function update(section: HwCatKey, id: string, patch: Partial<Draft>) {
    setSections((s) => ({ ...s, [section]: s[section].map((d) => (d.uid === id ? { ...d, ...patch } : d)) }));
  }
  function remove(section: HwCatKey, id: string) {
    setSections((s) => ({ ...s, [section]: s[section].filter((d) => d.uid !== id) }));
  }
  function moveTo(from: HwCatKey, id: string, to: HwCatKey) {
    if (from === to) return;
    setSections((s) => {
      const d = s[from].find((x) => x.uid === id);
      if (!d) return s;
      return { ...s, [from]: s[from].filter((x) => x.uid !== id), [to]: [...s[to], d] };
    });
  }

  // ─── Dán link thông minh ──────────────────────────────────────────────────

  const [paste, setPaste] = useState("");
  const [pasteTo, setPasteTo] = useState<HwCatKey | "auto">("auto");
  const [pasteBusy, setPasteBusy] = useState(false);
  const [pasteMsg, setPasteMsg] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);

  async function handlePaste(raw: string) {
    const url = raw.trim();
    if (!url) return;
    setPasteBusy(true);
    setPasteMsg(null);
    const target = (fallback: HwCatKey) => (pasteTo === "auto" ? fallback : pasteTo);
    try {
      const path = internalPath(url, typeof window !== "undefined" ? window.location.hostname : undefined);
      if (path) {
        const lib = await loadLibrary().catch(() => []);
        let matches = lib.filter((i) => i.href === path);
        if (matches.length === 0) matches = lib.filter((i) => i.href === path.split("?")[0]);
        if (matches.length === 1) {
          const m = matches[0];
          const sec = target(sectionForLib(m));
          addDrafts(sec, [
            { text: m.title, link: m.href, desc: "", catalogId: m.id, minutes: m.minutes, srcLink: m.href },
          ]);
          setPasteMsg({ tone: "ok", text: `Nhận ra bài trong kho → "${m.title}" (tự chấm)` });
        } else if (matches.length > 1) {
          setDrawer({ section: target(sectionForLib(matches[0])), query: path.split("?")[0] });
          setPasteMsg({ tone: "ok", text: `Link này có ${matches.length} bài trong kho — chọn đúng bài cần giao.` });
        } else {
          const slug = deckSlugFromPath(path);
          const deck = slug ? (await loadDecks().catch(() => [])).find((d) => d.slug === slug) : undefined;
          if (deck) {
            addDrafts(target("vocab"), [
              {
                text: `Flashcard: ${deck.title} (${deck.cardCount} thẻ)`,
                link: path,
                desc: "",
                deckId: deck.id,
                minutes: Math.max(5, Math.round(deck.cardCount * 0.75)),
                srcLink: path,
              },
            ]);
            setPasteMsg({ tone: "ok", text: `Nhận ra bộ thẻ "${deck.title}" (tự chấm)` });
          } else {
            const t = await fetchLinkTitle(new URL(path, window.location.origin).toString());
            const name = (t ?? path).replace(/\s*[|–-]\s*TOEIC.*$/i, "").trim() || path;
            addDrafts(target("other"), [{ text: name, link: path, desc: "" }]);
            setPasteMsg({ tone: "warn", text: "Trang trong web nhưng chưa có trong kho — HV sẽ tự tick." });
          }
        }
      } else if (isHttpUrl(url)) {
        const t = await fetchLinkTitle(url);
        addDrafts(target("other"), [{ text: t ?? url, link: url, desc: "" }]);
        setPasteMsg(
          t
            ? { tone: "ok", text: `Đã lấy tiêu đề: "${t}"` }
            : { tone: "warn", text: "Không lấy được tiêu đề — sửa tên bài giúp nhé." },
        );
      } else {
        setPasteMsg({ tone: "warn", text: "Đây không phải link. Dùng ＋ Gõ tay để nhập bài không có link." });
        return;
      }
      setPaste("");
    } finally {
      setPasteBusy(false);
    }
  }

  // ─── Lưu ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!date) return;
    setSaving(true);
    clearTimeout(timerRef.current);
    try {
      const hw = sectionsToHw(hwIdRef.current, date, endDate, title, sections);
      await onSave(hw);
      if (extras.length) {
        const r = await fetch("/api/admin/homework/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hw: { id: hw.id, date: hw.date, endDate: hw.endDate, title: hw.title, content: contentOf(hw) },
            targets: extras.map(({ type, id }) => ({ type, id })),
          }),
        });
        const d = (await r.json().catch(() => ({}))) as { results?: { ok: boolean; id: string }[]; error?: string };
        const failed = (d.results ?? []).filter((x) => !x.ok);
        if (!r.ok || failed.length) {
          alert(
            `Đã lưu BTVN chính, nhưng giao thêm lỗi ở ${failed.length || extras.length} nơi` +
              (d.error ? `: ${d.error}` : "") +
              ". Có thể dùng Nhân bản để giao lại.",
          );
        }
      }
      onClose();
    } catch (err) {
      console.error("[HomeworkEditor save]", err);
      alert("Lưu thất bại: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  // ─── Tóm tắt ──────────────────────────────────────────────────────────────

  const all = SECTION_ORDER.flatMap((k) => sections[k]).filter((d) => d.text.trim());
  const totalMin = all.reduce((a, d) => a + (isLinked(d) && d.minutes ? d.minutes : 0), 0);
  const autoCount = all.filter((d) => isLinked(d)).length;
  const suggestedEnd = nextSessionDate(date, days);

  const body = (
    <>
      <div className="p-5 space-y-4">
        {/* Ngày + tiêu đề */}
        {!contentOnly && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="NGÀY BẮT ĐẦU">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
          <Field label="HẠN NỘP (để trống = 1 ngày)">
            <input
              type="date"
              value={endDate}
              min={date}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
            {suggestedEnd && (
              suggestedEnd === endDate ? (
                <span className="text-[11px] mt-1 block" style={{ color: "#4A7C59" }}>
                  ✓ Theo lịch học: buổi kế tiếp {fmtDayShort(suggestedEnd)}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setEndDate(suggestedEnd)}
                  className="text-[11px] mt-1 underline"
                  style={{ color: "var(--accent-primary)" }}
                >
                  📅 Đặt hạn = buổi kế tiếp ({fmtDayShort(suggestedEnd)})
                </button>
              )
            )}
          </Field>
          <Field label="TIÊU ĐỀ (TUỲ CHỌN)">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Buổi 7 — Part 5 Thì HTHT"
              className={inputCls}
              style={inputStyle}
            />
          </Field>
        </div>
        )}

        {/* Giao thêm cho lớp/HV khác */}
        {extraTargets && !contentOnly && (
          <div className="rounded-xl px-3 py-2 space-y-1.5" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Giao thêm cho:</span>
              {extras.map((t) => (
                <span
                  key={targetKey(t)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
                  style={{ borderColor: "var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                >
                  {t.type === "class" ? "👥" : "👤"} {t.label}
                  <button
                    type="button"
                    onClick={() => setExtras((x) => x.filter((y) => targetKey(y) !== targetKey(t)))}
                    style={{ color: "var(--text-muted)" }}
                    aria-label="Bỏ"
                  >
                    ✕
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setShowTargets(true)}
                className="text-xs px-2 py-0.5 rounded-full border border-dashed"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                ＋ Lớp / HV
              </button>
            </div>
            {extras.length > 0 && (
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Ngày giao và hạn nộp tự dời theo lịch học của từng lớp/HV.
              </p>
            )}
          </div>
        )}

        {/* Mẫu BTVN */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            className="text-xs px-2.5 py-1.5 rounded-lg border"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            📋 Dùng mẫu
          </button>
          <button
            type="button"
            disabled={all.length === 0}
            onClick={async () => {
              const name = window.prompt("Tên mẫu BTVN:", title || "");
              if (!name?.trim()) return;
              try {
                await saveTemplate(name.trim(), contentOf(sectionsToHw("t", date, "", "", sections)));
                setNote(`Đã lưu mẫu “${name.trim()}”.`);
              } catch (e) {
                setNote(e instanceof Error ? e.message : "Lưu mẫu thất bại");
              }
            }}
            className="text-xs px-2.5 py-1.5 rounded-lg border disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            💾 Lưu thành mẫu
          </button>
          {note && <span className="text-[11px]" style={{ color: "#4A7C59" }}>{note}</span>}
        </div>

        {/* Dán link */}
        <div>
          <div
            className="flex flex-wrap gap-2 items-center rounded-xl px-3 py-2"
            style={{ border: "1.5px dashed var(--accent-primary)", background: "rgba(196,98,45,0.06)" }}
          >
            <span aria-hidden>🔗</span>
            <input
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              onPaste={(e) => {
                const t = e.clipboardData.getData("text");
                if (t && (isHttpUrl(t) || t.trim().startsWith("/"))) {
                  e.preventDefault();
                  void handlePaste(t);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handlePaste(paste);
                }
              }}
              placeholder="Dán link bất kỳ — bài trong web, YouTube, Drive…"
              className="flex-1 min-w-[180px] bg-transparent outline-none text-sm py-1"
              style={{ color: "var(--text-primary)" }}
            />
            <select
              value={pasteTo}
              onChange={(e) => setPasteTo(e.target.value as HwCatKey | "auto")}
              className="text-xs px-2 py-1.5 rounded-lg border"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
              aria-label="Thêm vào mục"
            >
              <option value="auto">Tự xếp mục</option>
              {HW_CATS.map((c) => (
                <option key={c.key} value={c.key}>
                  → {c.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pasteBusy || !paste.trim()}
              onClick={() => void handlePaste(paste)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
              style={{ background: "var(--accent-primary)", color: "#fff" }}
            >
              {pasteBusy ? "Đang đọc…" : "Thêm"}
            </button>
          </div>
          {pasteMsg && (
            <p className="text-[11px] mt-1.5" style={{ color: pasteMsg.tone === "ok" ? "#4A7C59" : "#9A6A12" }}>
              {pasteMsg.text}
            </p>
          )}
        </div>

        {/* AI soạn nháp từ ghi chú buổi học */}
        <div className="rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}>
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            <span>✨ Soạn nháp từ ghi chú buổi học (AI)</span>
            <span style={{ color: "var(--text-muted)" }}>{aiOpen ? "Thu gọn" : "Mở"}</span>
          </button>
          {aiOpen && (
            <div className="px-3 pb-3 space-y-2">
              <textarea
                value={aiNote}
                onChange={(e) => setAiNote(e.target.value)}
                rows={3}
                placeholder="VD: Hôm nay học Part 5 thì HTHT, HV còn nhầm với quá khứ đơn. Nghe Part 2 câu hỏi WHERE. Ôn 20 từ chủ đề văn phòng."
                className="w-full px-3 py-2 text-sm rounded-lg border outline-none resize-y"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px]" style={{ color: aiMsg ? (aiMsg.tone === "ok" ? "#4A7C59" : "#9A6A12") : "var(--text-muted)" }}>
                  {aiMsg?.text ?? "AI chỉ chọn bài có thật trong kho, thêm vào form để bạn duyệt — không tự giao."}
                </p>
                <button
                  type="button"
                  disabled={aiBusy || aiNote.trim().length < 5}
                  onClick={() => void aiDraft()}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                  style={{ background: "var(--accent-primary)", color: "#fff" }}
                >
                  {aiBusy ? "AI đang soạn…" : "Soạn nháp"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Các mục */}
        {HW_CATS.map(({ key, label, color, hint }) => {
          const items = sections[key];
          const mins = items.reduce((a, d) => a + (isLinked(d) && d.minutes ? d.minutes : 0), 0);
          return (
            <div key={key}>
              <div
                className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                    {label}
                  </span>
                  {items.length > 0 && (
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {items.length} bài{mins ? ` · ${mins}′` : ""}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDrawer({ section: key })}
                    className="text-xs px-2 py-1 rounded-lg font-medium"
                    style={{ color: "#fff", background: "var(--accent-primary)" }}
                  >
                    ＋ Từ kho
                  </button>
                  <button
                    type="button"
                    onClick={() => addDrafts(key, [{ text: "", link: "", desc: "" }])}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ color: "var(--accent-primary)", background: "rgba(196,98,45,0.08)" }}
                  >
                    ＋ Gõ tay
                  </button>
                </div>
              </div>
              {hint && (
                <p className="text-[10px] mb-2 px-2 py-1 rounded" style={{ color, background: `${color}12` }}>
                  {hint}
                </p>
              )}
              {items.length === 0 ? (
                <p className="text-xs py-1" style={{ color: "var(--text-muted)" }}>
                  Chưa có bài
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((d) => (
                    <ItemCard
                      key={d.uid}
                      draft={d}
                      section={key}
                      flash={flash === d.uid}
                      usedOn={usedDate(used, d)}
                      onChange={(p) => update(key, d.uid, p)}
                      onRemove={() => remove(key, d.uid)}
                      onMoveTo={(to) => moveTo(key, d.uid, to)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="text-xs space-y-0.5" style={{ color: "var(--text-muted)" }}>
          {all.length > 0 && (
            <p>
              {all.length} bài
              {totalMin ? ` · ≈ ${totalMin}′ (bài kho)` : ""} ·{" "}
              <span style={{ color: "#4A7C59" }}>{autoCount} tự chấm</span>
              {all.length - autoCount > 0 && <> · {all.length - autoCount} HV tự tick</>}
            </p>
          )}
          <p>{saveStatus === "saving" ? "Đang lưu tự động..." : saveStatus === "saved" ? "✓ Đã lưu tự động" : ""}</p>
        </div>
        <div className="flex gap-2">
          {!inline && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm border"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              Huỷ
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !date}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            {saving ? "Đang lưu..." : extras.length ? `${saveLabel} + ${extras.length} nơi` : saveLabel}
          </button>
        </div>
      </div>

      {showTemplates && (
        <TemplatePicker
          onClose={() => setShowTemplates(false)}
          onPick={(t) => {
            const add = hwToSections({ id: "", date: "", ...t.content });
            setSections((s) => {
              const out = { ...s };
              for (const k of SECTION_ORDER) out[k] = [...s[k], ...add[k]];
              return out;
            });
            setShowTemplates(false);
            setNote(`Đã thêm bài từ mẫu “${t.title}”.`);
            fetch(`/api/admin/hw-templates/${t.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ used: true }),
            }).catch(() => {});
          }}
        />
      )}

      {showTargets && extraTargets && (
        <TargetPicker
          title="Giao thêm cho"
          initial={extras}
          exclude={extraTargets.exclude}
          onClose={() => setShowTargets(false)}
          onDone={(t) => {
            setExtras(t);
            setShowTargets(false);
          }}
        />
      )}

      {drawer && (
        <LibraryDrawer
          section={drawer.section}
          initialQuery={drawer.query}
          used={used}
          onClose={() => setDrawer(null)}
          onAdd={(drafts) => {
            addDrafts(drawer.section, drafts);
            setDrawer(null);
          }}
        />
      )}
    </>
  );

  if (inline) return <div>{body}</div>;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="w-full max-w-3xl my-4 sm:my-8 rounded-2xl border shadow-xl"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <h3 className="font-bold" style={{ color: "var(--accent-primary)" }}>
              📋 {heading}
            </h3>
            {targetLabel && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                → {targetLabel}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        {body}
      </div>
    </div>
  );
}

// ─── Một mục ─────────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 rounded-lg text-sm border outline-none";
const inputStyle = { background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ItemCard({
  draft,
  section,
  flash,
  usedOn,
  onChange,
  onRemove,
  onMoveTo,
}: {
  draft: Draft;
  section: HwCatKey;
  flash: boolean;
  usedOn: string | null;
  onChange: (p: Partial<Draft>) => void;
  onRemove: () => void;
  onMoveTo: (to: HwCatKey) => void;
}) {
  const [showDesc, setShowDesc] = useState(!!draft.desc);
  const linked = isLinked(draft);
  const wasLinked = !!(draft.catalogId || draft.deckId);

  return (
    <div
      className="space-y-1.5 rounded-lg p-2 transition-colors"
      style={{
        background: flash ? "rgba(196,98,45,0.08)" : "var(--bg-primary)",
        border: `1px solid ${flash ? "var(--accent-primary)" : "var(--border)"}`,
      }}
    >
      <div className="flex flex-wrap items-center gap-1">
        {linked ? <Tag tone="ok">Tự chấm</Tag> : <Tag tone="warn">HV tự tick</Tag>}
        {draft.deckId && linked && <Tag tone="info">Flashcard</Tag>}
        {draft.personal && <Tag tone="info">🎯 Bài riêng</Tag>}
        {linked && draft.minutes ? <Tag>⏱ {draft.minutes}′</Tag> : null}
        {usedOn && <Tag tone="warn">Đã giao {ddmm(usedOn)}</Tag>}
        {wasLinked && !linked && (
          <button
            type="button"
            onClick={() => onChange({ link: draft.srcLink ?? "" })}
            className="text-[10.5px] underline"
            style={{ color: "var(--accent-primary)" }}
          >
            Link đã đổi — khôi phục để tự chấm
          </button>
        )}
      </div>
      <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
        <input
          value={draft.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Nội dung bài tập..."
          className="flex-1 min-w-[160px] px-2 py-1.5 text-xs rounded-lg border outline-none"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
        <input
          value={draft.link}
          onChange={(e) => onChange({ link: e.target.value })}
          placeholder="Link"
          className="w-full sm:w-44 px-2 py-1.5 text-xs rounded-lg border outline-none shrink-0"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
        <div className="flex gap-1 items-center">
          <select
            value={section}
            onChange={(e) => onMoveTo(e.target.value as HwCatKey)}
            className="text-[11px] px-1 py-1 rounded-md border"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}
            aria-label="Chuyển mục"
            title="Chuyển sang mục khác"
          >
            {HW_CATS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowDesc((v) => !v)}
            className="text-[10px] px-2 py-1.5 rounded-lg border shrink-0 whitespace-nowrap"
            style={{
              borderColor: showDesc ? "var(--accent-primary)" : "var(--border)",
              color: showDesc ? "var(--accent-primary)" : "var(--text-muted)",
              background: showDesc ? "rgba(196,98,45,0.08)" : "transparent",
            }}
          >
            {showDesc ? "✓ Mô tả" : "+ Mô tả"}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 shrink-0 hover:opacity-70"
            style={{ color: "rgb(239,68,68)" }}
            aria-label="Xoá"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {showDesc && (
        <RichTextInput
          value={draft.desc}
          onChange={(v) => onChange({ desc: v })}
          placeholder="Mô tả chi tiết (hỗ trợ B/I/U/HL)..."
        />
      )}
    </div>
  );
}
