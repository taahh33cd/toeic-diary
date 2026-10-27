"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import StudyDeck from "@/components/vocab/StudyDeck";
import { playWord } from "@/lib/vocab/audio";
import { recordVocabReview } from "@/lib/vocab/review-client";
import type { CardRow } from "@/lib/vocab/client";

const GREEN = "var(--accent-green, #4A7C59)";

/** Tiến độ của khách: chỉ số lần đánh dấu Thuộc, giữ trong máy họ. */
type TienDoKhach = Record<string, number>;

function khoaLuu(slug: string) {
  return `fc_guest_${slug}`;
}

function doc(slug: string): TienDoKhach {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(khoaLuu(slug)) ?? "{}") as TienDoKhach;
  } catch {
    return {};
  }
}

function ghi(slug: string, td: TienDoKhach) {
  try {
    window.localStorage.setItem(khoaLuu(slug), JSON.stringify(td));
  } catch {
    /* chế độ ẩn danh hoặc hết dung lượng — vẫn cho học, chỉ không nhớ được */
  }
}

const RONG: TienDoKhach = {};

/**
 * Kho tiến độ của khách, đọc qua useSyncExternalStore.
 *
 * Không đọc localStorage lúc khởi tạo state (server render không có nó, sẽ
 * lệch khi hydrate) và cũng không setState trong effect (eslint
 * react-hooks/set-state-in-effect chặn). useSyncExternalStore dùng
 * getServerSnapshot cho lượt render trên server và lượt hydrate, rồi mới
 * chuyển sang dữ liệu thật — đúng việc nó sinh ra để làm.
 */
function taoKho(slug: string) {
  let hienTai: TienDoKhach | null = null;
  const nghe = new Set<() => void>();
  return {
    subscribe(cb: () => void) {
      nghe.add(cb);
      return () => nghe.delete(cb);
    },
    doc(): TienDoKhach {
      if (hienTai === null) hienTai = doc(slug);
      return hienTai;
    },
    docServer(): TienDoKhach {
      return RONG;
    },
    ghi(tiep: TienDoKhach) {
      hienTai = tiep;
      ghi(slug, tiep);
      for (const cb of nghe) cb();
    },
  };
}

export default function PublicDeck({
  slug,
  title,
  description,
  cards,
  daDangNhap,
}: {
  slug: string;
  title: string;
  description: string | null;
  cards: CardRow[];
  /** Đã đăng nhập thì ghi tiến độ thật, không dùng localStorage. */
  daDangNhap: boolean;
}) {
  const kho = useMemo(() => taoKho(slug), [slug]);
  const tienDo = useSyncExternalStore(kho.subscribe, kho.doc, kho.docServer);
  const [hoc, setHoc] = useState(false);

  const ghiNhan = useCallback(
    async (word: string, known: boolean) => {
      const k = word.toLowerCase().trim();
      const cu = kho.doc();
      kho.ghi({ ...cu, [k]: known ? (cu[k] ?? 0) + 1 : 0 });
      return true; // localStorage không "hỏng" theo nghĩa cần báo lỗi
    },
    [kho]
  );

  const daHoc = Object.values(tienDo).filter((n) => n > 0).length;

  const ghiThat = daDangNhap
    ? async (word: string, known: boolean) =>
        !!(await recordVocabReview({ outcome: { kind: "flip", word, known } }))
    : ghiNhan;

  const moiDangKy = daDangNhap ? (
    <div
      className="mt-4 mx-auto rounded-xl p-4 text-left"
      style={{ maxWidth: 420, background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Bạn đang đăng nhập — tiến độ ôn các từ này được lưu vào tài khoản của bạn,
        kể cả khi bộ thẻ là của người khác.
      </p>
      <a
        href="/journal/vocab"
        className="inline-block mt-2 text-xs font-bold"
        style={{ color: "var(--accent-primary)" }}
      >
        → Xem sổ từ vựng của tôi
      </a>
    </div>
  ) : (
    <div
      className="mt-4 mx-auto rounded-xl p-4 text-left"
      style={{ maxWidth: 420, background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
    >
      <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
        Muốn nhớ lâu hơn?
      </p>
      <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
        Tiến độ hiện chỉ lưu trên máy này. Đăng nhập để lịch ôn đi theo bạn mọi thiết bị,
        và được nhắc đúng ngày cần ôn lại từng từ.
      </p>
      <a
        href={`/auth/login?next=${encodeURIComponent(`/flashcards/d/${slug}`)}`}
        className="inline-block px-4 py-2 rounded-lg text-sm font-bold"
        style={{ background: "var(--accent-primary)", color: "#fff" }}
      >
        Đăng nhập để lưu tiến độ
      </a>
    </div>
  );

  if (hoc) {
    return (
      <main className="min-h-screen px-4 py-6" style={{ background: "var(--bg-primary)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <StudyDeck
            title={title}
            cards={cards}
            progress={[]}
            onExit={() => setHoc(false)}
            onReview={ghiThat}
            ketThuc={moiDangKy}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <header className="mb-5">
          <p className="text-xs font-bold mb-1" style={{ color: "var(--accent-primary)", letterSpacing: ".1em" }}>
            BỘ THẺ TỪ VỰNG ĐƯỢC CHIA SẺ
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{title}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {cards.length} từ
            {description ? ` · ${description}` : ""}
            {!daDangNhap && daHoc > 0 ? ` · bạn đã thuộc ${daHoc}` : ""}
          </p>
        </header>

        <button
          onClick={() => setHoc(true)}
          className="w-full py-3 rounded-xl font-bold text-sm mb-5"
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          🃏 Bắt đầu học {cards.length} thẻ
        </button>

        <ul
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
        >
          {cards.map((c, i) => (
            <li
              key={c.id}
              className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderTop: i === 0 ? undefined : "1px solid var(--border)" }}
            >
              <button
                onClick={() => playWord(c.word, c.audioUrl ?? undefined)}
                className="shrink-0 w-8 h-8 rounded-full text-sm"
                style={{ background: "var(--bg-secondary)" }}
                title="Nghe phát âm"
              >
                🔊
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                  {c.word}
                  {c.ipa && (
                    <span className="ml-2 font-mono text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                      {c.ipa}
                    </span>
                  )}
                </p>
                <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>
                  {c.meaningVi ?? "—"}
                </p>
              </div>
              {!daDangNhap && (tienDo[c.word.toLowerCase().trim()] ?? 0) > 0 && (
                <span className="shrink-0 text-xs" style={{ color: GREEN }}>
                  ×{tienDo[c.word.toLowerCase().trim()]}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-6">{moiDangKy}</div>
      </div>
    </main>
  );
}
