"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { useVocabWords } from "@/hooks/useVocabWords";
import { useDecks } from "@/hooks/useDecks";
import { useVocabQueue } from "@/hooks/useVocabQueue";
import { PageHeading } from "@/components/journal/paper/PageHeading";
import SessionRunner, { fromWordRow } from "@/components/vocab/session/SessionRunner";
import LookupBox from "@/components/vocab/home/LookupBox";
import TodayCard from "@/components/vocab/home/TodayCard";
import WordsTab from "@/components/vocab/home/WordsTab";
import DecksTab from "@/components/vocab/home/DecksTab";
import LibraryTab from "@/components/vocab/home/LibraryTab";
import { tagWordLevels, wordIsDue, type WordRow } from "@/lib/vocab/client";

type Tab = "words" | "decks" | "library";

const isToday = (iso: string | null) => !!iso && new Date(iso).toDateString() === new Date().toDateString();

/**
 * Sổ từ vựng — một trang, hai trụ cột:
 *   1. Tra từ & học từ đã lưu (ô tra duy nhất + danh sách có lọc, phân trang)
 *   2. Bộ thẻ (tab Bộ thẻ / Thư viện)
 * Việc chính mỗi ngày nằm ở một nút: "Bắt đầu ôn" trong khối Hôm nay.
 */
export default function VocabPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { words: rows, loading: vocabLoading } = useVocabWords(!!profile?.studentCode);
  const { decks } = useDecks();
  const { cho: choGui, day: thuGuiLai } = useVocabQueue();
  // Cho phép mở thẳng một tab: /journal/vocab?tab=decks. Đọc lúc khởi tạo là
  // an toàn: lần render đầu (cả trên server) luôn là khung chờ, chưa vẽ tab.
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "words";
    const t = new URLSearchParams(window.location.search).get("tab");
    return t === "decks" || t === "library" ? t : "words";
  });
  const [study, setStudy] = useState<{ words: WordRow[]; title: string } | null>(null);
  const [levels, setLevels] = useState<Record<string, string>>({});

  const words = useMemo(
    () => rows.map((w) => (w.level || !levels[w.wordKey] ? w : { ...w, level: levels[w.wordKey] })),
    [rows, levels]
  );

  // Gắn cấp độ cho từ chưa có cấp — mỗi từ chỉ gắn một lần cho cả hệ thống.
  const daGan = useRef(new Set<string>());
  useEffect(() => {
    const thieu = rows.filter((w) => !w.level && !daGan.current.has(w.wordKey)).slice(0, 120);
    if (!thieu.length) return;
    thieu.forEach((w) => daGan.current.add(w.wordKey));
    let huy = false;
    (async () => {
      for (let i = 0; i < thieu.length && !huy; i += 40) {
        try {
          const r = await tagWordLevels(thieu.slice(i, i + 40).map((w) => w.word));
          if (!huy) setLevels((m) => ({ ...m, ...r.levels }));
          if (r.message) break; // hết lượt — để lần sau
        } catch {
          break;
        }
      }
    })();
    return () => {
      huy = true;
    };
  }, [rows]);

  const due = useMemo(
    () =>
      words
        .filter(wordIsDue)
        .sort((a, b) => (a.dueAt ? new Date(a.dueAt).getTime() : 0) - (b.dueAt ? new Date(b.dueAt).getTime() : 0)),
    [words]
  );
  const upcoming = useMemo(
    () =>
      words
        .filter((w) => !w.mastered && !wordIsDue(w))
        .sort((a, b) => new Date(a.dueAt ?? 0).getTime() - new Date(b.dueAt ?? 0).getTime()),
    [words]
  );
  const reviewedToday = useMemo(() => words.filter((w) => isToday(w.lastReview)).length, [words]);
  const mastered = words.filter((w) => w.mastered).length;

  function startStudy(list: WordRow[], title = "Ôn từ vựng") {
    if (list.length) setStudy({ words: list, title });
  }

  if (profileLoading || vocabLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 rounded-lg" style={{ background: "var(--border)" }} />
        <div className="h-16 rounded-2xl" style={{ background: "var(--border)" }} />
        <div className="h-24 rounded-2xl" style={{ background: "var(--border)" }} />
        <div className="h-72 rounded-2xl" style={{ background: "var(--border)" }} />
      </div>
    );
  }

  if (!profile?.studentCode) {
    return (
      <div className="text-center py-12">
        <p className="font-semibold">Chưa có hồ sơ học viên</p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Tài khoản chưa được liên kết mã học viên.
        </p>
      </div>
    );
  }

  // Phiên ôn chiếm trọn màn hình để tập trung, thoát là về đúng chỗ cũ.
  if (study) {
    return (
      <div className="py-2">
        <SessionRunner
          title={study.title}
          words={study.words.map(fromWordRow)}
          pool={words.map(fromWordRow)}
          onExit={() => setStudy(null)}
        />
      </div>
    );
  }

  const tabBtn = (id: Tab, label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className="px-4 text-[15px] font-bold -mb-px"
      style={{
        minHeight: 48,
        color: tab === id ? "var(--accent-primary)" : "var(--text-muted)",
        borderBottom: `3px solid ${tab === id ? "var(--accent-primary)" : "transparent"}`,
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      <PageHeading
        title="Sổ từ vựng"
        note={
          words.length === 0
            ? "Chưa có từ nào — tra từ đầu tiên ở ô bên dưới."
            : `${words.length} từ · ${decks.length} bộ thẻ · ${mastered} đã thuộc`
        }
        actions={
          <Link
            href="/journal/vocab/stats"
            className="px-3 rounded-lg text-sm font-semibold flex items-center gap-1.5"
            style={{ minHeight: 40, background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 19V5M4 19h16M8 15l4-4 3 3 5-6" /></svg>
            Tiến độ
          </Link>
        }
      />

      {choGui > 0 && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap" style={{ background: "rgba(196,98,45,.08)", border: "1px solid rgba(196,98,45,.25)" }}>
          <span className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>
            {choGui} kết quả ôn chưa gửi được vì mạng trục trặc — đang giữ trên máy bạn.
          </span>
          <button onClick={thuGuiLai} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "var(--accent-primary)", color: "#fff" }}>
            Thử gửi lại
          </button>
        </div>
      )}

      <LookupBox words={words} decks={decks} onStudyWord={(w) => startStudy([w], w.word)} />

      {words.length > 0 && (
        <TodayCard
          dueCount={due.length}
          reviewedToday={reviewedToday}
          upcomingCount={upcoming.length}
          onStart={(scope) => startStudy(scope === "due" ? due : upcoming, scope === "due" ? "Ôn hôm nay" : "Học trước")}
        />
      )}

      <div role="tablist" aria-label="Khu vực" className="flex gap-1 overflow-x-auto" style={{ borderBottom: "1.5px solid var(--border)" }}>
        {tabBtn("words", `Từ đã lưu · ${words.length}`)}
        {tabBtn("decks", `Bộ thẻ · ${decks.length}`)}
        {tabBtn("library", "Thư viện")}
      </div>

      {tab === "words" && <WordsTab words={words} decks={decks} onStudy={(list) => startStudy(list, "Học các từ đã chọn")} />}

      {tab === "decks" && <DecksTab words={words} decks={decks} onStudy={(list, title) => startStudy(list, title)} />}

      {tab === "library" && <LibraryTab />}

    </div>
  );
}
