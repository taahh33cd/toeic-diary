"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { Sheet } from "@/components/journal/paper/Sheet";
import StudyDeck from "@/components/vocab/StudyDeck";
import DeckEditor from "@/components/vocab/DeckEditor";
import ShareDeck from "@/components/vocab/ShareDeck";
import QuizRunner from "@/components/vocab/QuizRunner";
import { ProgressBar } from "@/components/vocab/home/DecksTab";
import { LevelBadge, SpeakButton, chipStyle, fmtIpa, levelLabel } from "@/components/vocab/home/shared";
import { deleteDeck, getDeck, type DeckDetail, type ProgressRow } from "@/lib/vocab/client";
import { docBoThe, luuBoThe, xoaBoThe } from "@/lib/vocab/offline-deck";

type Man = "danhsach" | "hoc" | "hoc-den-han" | "sua" | "quiz";
type Loc = "all" | "due" | "learning" | "mastered";

function trangThai(p: ProgressRow | undefined): Exclude<Loc, "all"> {
  if (!p) return "due"; // chưa học lần nào
  if (p.mastered) return "mastered";
  return p.dueAt === null || new Date(p.dueAt) <= new Date() ? "due" : "learning";
}

const PILL: Record<Exclude<Loc, "all">, { label: string; bg: string; fg: string }> = {
  due: { label: "Đến hạn", bg: "rgba(196,98,45,.16)", fg: "var(--accent-primary)" },
  learning: { label: "Đang học", bg: "rgba(47,93,128,.13)", fg: "#2F5D80" },
  mastered: { label: "Đã thuộc", bg: "rgba(74,124,89,.15)", fg: "var(--accent-green)" },
};

export default function DeckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useProfile();
  const [data, setData] = useState<DeckDetail | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [man, setMan] = useState<Man>("danhsach");
  const [loc, setLoc] = useState<Loc>("all");
  const [menu, setMenu] = useState(false);
  const [chiaSe, setChiaSe] = useState(false);
  /** Thời điểm của bản lưu đang hiện; null = dữ liệu tươi từ server. */
  const [banLuu, setBanLuu] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await getDeck(id);
      setData(d);
      setBanLuu(null);
      setLoi(null);
      luuBoThe(id, d);
    } catch (e) {
      // Mạng hỏng thì học tiếp bằng bản đã lưu, nhưng phải NÓI RÕ là bản cũ:
      // tiến độ ở đây có thể lạc hậu so với lần học trên máy khác.
      const cu = docBoThe(id);
      if (cu) {
        setData(cu.data);
        setBanLuu(cu.luuLuc);
        setLoi(null);
        return;
      }
      setLoi(e instanceof Error ? e.message : "Không tải được bộ thẻ");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Tải lại khi rời chế độ học để số "đến hạn" trên trang khớp với vừa ôn
  useEffect(() => {
    if (man === "danhsach" && data) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [man]);

  if (loi) {
    return (
      <Sheet className="text-center py-10">
        <p className="font-semibold" style={{ color: "var(--accent-red, #B94040)" }}>{loi}</p>
        <Link href="/journal/vocab?tab=decks" className="inline-block mt-3 text-sm underline" style={{ color: "var(--text-muted)" }}>
          ← Về bộ thẻ
        </Link>
      </Sheet>
    );
  }

  if (!data) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
        <div className="h-48 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
      </div>
    );
  }

  const { deck, progress } = data;
  const levels = data.levels ?? {};
  const tdTheoKey = new Map(progress.map((p) => [p.wordKey, p]));
  const dem = { due: 0, learning: 0, mastered: 0 };
  for (const c of deck.cards) dem[trangThai(tdTheoKey.get(c.wordKey))]++;
  const lv = deck.cards.map((c) => levels[c.wordKey]).filter(Boolean).sort();
  const capBo = lv.length ? (lv[0] === lv[lv.length - 1] ? levelLabel(lv[0]) : `${lv[0]}–${levelLabel(lv[lv.length - 1])}`) : null;

  if (man === "quiz") {
    return (
      <QuizRunner
        deckId={deck.id}
        title={deck.title}
        cards={deck.cards}
        progress={progress}
        onExit={() => {
          setMan("danhsach");
          load();
        }}
      />
    );
  }

  if (man === "sua") {
    return (
      <DeckEditor
        deck={deck}
        cards={deck.cards}
        onDone={() => {
          setMan("danhsach");
          load();
        }}
        onCancel={() => setMan("danhsach")}
      />
    );
  }

  if (man !== "danhsach") {
    return (
      <StudyDeck
        title={deck.title}
        cards={deck.cards}
        progress={progress}
        dueOnly={man === "hoc-den-han"}
        onExit={() => setMan("danhsach")}
      />
    );
  }

  async function xoaBo() {
    setMenu(false);
    if (!window.confirm(`Xoá bộ "${deck.title}"? Tiến độ ôn các từ vẫn được giữ.`)) return;
    try {
      await deleteDeck(deck.id);
      // Không xoá bản lưu thì lần sau mất mạng bộ đã xoá lại hiện ra như thường
      xoaBoThe(deck.id);
      window.dispatchEvent(new Event("decks:changed"));
      router.push("/journal/vocab?tab=decks");
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không xoá được");
    }
  }

  const the = deck.cards.filter((c) => loc === "all" || trangThai(tdTheoKey.get(c.wordKey)) === loc);
  const menuItem = "w-full text-left px-3 rounded-lg text-[15px] hover:opacity-80";

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {banLuu !== null && (
        <div className="rounded-xl px-4 py-2.5 text-sm" style={{ background: "rgba(196,98,45,.08)", border: "1px solid rgba(196,98,45,.25)", color: "var(--text-primary)" }}>
          Đang xem bản lưu trên máy ({new Date(banLuu).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}) vì không nối được mạng. Học tiếp được, kết quả sẽ gửi khi có mạng —
          nhưng nếu bạn vừa học bộ này trên máy khác thì số liệu ở đây có thể cũ.
        </div>
      )}

      <div className="flex items-center gap-2">
        <Link href="/journal/vocab?tab=decks" className="text-sm font-semibold flex items-center" style={{ minHeight: 44, color: "var(--text-muted)" }}>
          ← Bộ thẻ
        </Link>
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            aria-label="Thêm thao tác"
            aria-expanded={menu}
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
          </button>
          {menu && (
            <div role="menu" className="absolute right-0 top-12 z-20 w-56 rounded-xl p-1.5 flex flex-col" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "0 10px 28px -12px rgba(43,33,24,.35)" }}>
              <button role="menuitem" type="button" className={menuItem} style={{ minHeight: 44, color: "var(--text-primary)" }} onClick={() => { setMenu(false); setMan("sua"); }}>
                Sửa bộ & thẻ
              </button>
              <button role="menuitem" type="button" className={menuItem} style={{ minHeight: 44, color: "var(--text-primary)" }} onClick={() => { setMenu(false); setChiaSe((v) => !v); }}>
                {chiaSe ? "Ẩn phần chia sẻ" : "Chia sẻ"}
              </button>
              <button role="menuitem" type="button" className={menuItem} style={{ minHeight: 44, color: "var(--accent-red, #B94040)" }} onClick={xoaBo}>
                Xoá bộ
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <h1 className="hand leading-tight" style={{ fontSize: "clamp(1.6rem, 1.2rem + 1.5vw, 2.2rem)", color: "var(--text-primary)" }}>{deck.title}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {[`${deck.cardCount} thẻ`, deck.part ? `Part ${deck.part}` : null, capBo ? `cấp ${capBo}` : null].filter(Boolean).join(" · ")}
        </p>
        {deck.description && <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{deck.description}</p>}
      </div>

      {chiaSe && (
        <ShareDeck deckId={deck.id} visibility={deck.visibility} slug={deck.slug} laGiaoVien={profile?.role === "teacher" || profile?.role === "admin"} />
      )}

      <section className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        <ProgressBar s={{ total: deck.cardCount, ...dem }} height={10} />
        <div className="flex gap-4 flex-wrap text-sm" style={{ color: "var(--text-primary)" }}>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--accent-green)" }} />{dem.mastered} đã thuộc</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#2F5D80" }} />{dem.learning} đang học</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#D9773F" }} />{dem.due} cần ôn</span>
        </div>
        <button
          type="button"
          onClick={() => setMan(dem.due > 0 ? "hoc-den-han" : "hoc")}
          disabled={deck.cardCount === 0}
          className="rounded-xl font-bold text-base disabled:opacity-50"
          style={{ minHeight: 52, background: "var(--accent-primary)", color: "#fff" }}
        >
          {dem.due > 0 ? `Ôn ${dem.due} từ đến hạn` : "Học cả bộ"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          {dem.due > 0 && (
            <button type="button" onClick={() => setMan("hoc")} className="rounded-xl text-sm font-semibold" style={{ minHeight: 44, border: "1px solid var(--border)", color: "var(--text-primary)" }}>
              Học cả bộ ({deck.cardCount})
            </button>
          )}
          <button
            type="button"
            onClick={() => setMan("quiz")}
            disabled={deck.cardCount < 2}
            className={`rounded-xl text-sm font-semibold disabled:opacity-50 ${dem.due > 0 ? "" : "col-span-2"}`}
            style={{ minHeight: 44, border: "1px solid var(--border)", color: "var(--text-primary)" }}
          >
            Kiểm tra nhanh (quiz)
          </button>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Lọc thẻ">
        {(
          [
            ["all", `Tất cả ${deck.cardCount}`],
            ["due", `Đến hạn ${dem.due}`],
            ["learning", `Đang học ${dem.learning}`],
            ["mastered", `Đã thuộc ${dem.mastered}`],
          ] as [Loc, string][]
        ).map(([k, label]) => (
          <button key={k} type="button" aria-pressed={loc === k} onClick={() => setLoc(k)} className="shrink-0 rounded-full px-3.5 text-sm font-semibold" style={{ minHeight: 38, ...chipStyle(loc === k) }}>
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        {the.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
            {deck.cardCount === 0 ? "Bộ chưa có thẻ — mở menu ⋯ › Sửa bộ & thẻ để thêm." : "Không có thẻ nào ở mục này."}
          </p>
        )}
        <ul>
          {the.map((c, i) => {
            const st = trangThai(tdTheoKey.get(c.wordKey));
            const pill = PILL[st];
            return (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2.5" style={{ borderTop: i === 0 ? undefined : "1px solid var(--border)", minHeight: 60 }}>
                <SpeakButton word={c.word} audioUrl={c.audioUrl} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold" style={{ fontFamily: "Lora, serif", color: "var(--text-primary)" }}>{c.word}</span>
                    {fmtIpa(c.ipa) && <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{fmtIpa(c.ipa)}</span>}
                    <LevelBadge level={levels[c.wordKey]} />
                  </p>
                  <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>{c.meaningVi ?? "—"}</p>
                </div>
                <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: pill.bg, color: pill.fg }}>{pill.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
