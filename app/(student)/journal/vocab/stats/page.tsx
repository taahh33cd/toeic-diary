"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeading } from "@/components/journal/paper/PageHeading";
import { Sheet } from "@/components/journal/paper/Sheet";
import { QUIZ_TYPES } from "@/lib/vocab/quiz";

const GREEN = "var(--accent-green, #4A7C59)";
const RED = "var(--accent-red, #B94040)";

interface Stats {
  tongQuan: { tong: number; daThuoc: number; denHan: number; dangHoc: number };
  theoBo: { id: string; title: string; tong: number; daOn: number; thuoc: number; phanTram: number }[];
  haySai: { word: string; wrong: number; rep: number; dangHaySai: string | null }[];
  chuoiNgay: number;
  hoatDong: { ngay: string; soLan: number }[];
  tocDo: { nhom: string; soCau: number; trungViMs: number }[];
}

const NHAN_NHOM: Record<string, string> = {
  choiceText: "chọn đáp án chữ",
  choiceImage: "chọn đáp án ảnh",
  typing: "gõ từ",
};

function O({ so, nhan, mau }: { so: number | string; nhan: string; mau?: string }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <p className="text-2xl font-bold" style={{ color: mau ?? "var(--text-primary)" }}>{so}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{nhan}</p>
    </div>
  );
}

/** Dải 30 ngày gần nhất, ô đậm = ngày ôn nhiều. Server đã trả đủ cả ngày trống. */
function DaiNgay({ hoatDong }: { hoatDong: { ngay: string; soLan: number }[] }) {
  const max = Math.max(1, ...hoatDong.map((d) => d.soLan));
  return (
    <div className="flex gap-0.5">
      {hoatDong.map((d) => (
        <div
          key={d.ngay}
          title={`${d.ngay}: ${d.soLan > 0 ? `${d.soLan} lượt` : "không ôn"}`}
          style={{
            flex: 1,
            minWidth: 7,
            height: 26,
            borderRadius: 3,
            background:
              d.soLan === 0
                ? "var(--bg-secondary)"
                : `color-mix(in srgb, var(--accent-primary) ${Math.round(25 + (d.soLan / max) * 75)}%, transparent)`,
          }}
        />
      ))}
    </div>
  );
}

export default function VocabStatsPage() {
  const [s, setS] = useState<Stats | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const tai = useCallback(async () => {
    try {
      const res = await fetch("/api/flashcards/stats", { cache: "no-store" });
      const d = (await res.json()) as Stats & { error?: string };
      if (!res.ok) throw new Error(d.error ?? "Không tải được thống kê");
      setS(d);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không tải được thống kê");
    }
  }, []);

  useEffect(() => {
    tai();
  }, [tai]);

  if (loi) {
    return (
      <Sheet className="text-center py-8">
        <p className="text-sm font-semibold" style={{ color: RED }}>{loi}</p>
      </Sheet>
    );
  }
  if (!s) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
        <div className="h-24 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
        <div className="h-40 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
      </div>
    );
  }

  const { tongQuan } = s;
  const pctThuoc = tongQuan.tong > 0 ? Math.round((tongQuan.daThuoc / tongQuan.tong) * 100) : 0;
  const duLieuTocDo = s.tocDo.reduce((n, t) => n + t.soCau, 0);

  return (
    <div className="space-y-5">
      <PageHeading
        title="Tiến độ từ vựng"
        note={`${tongQuan.tong} từ đã học · ${pctThuoc}% đã thuộc`}
        actions={
          <>
            <Link href="/journal/vocab" className="px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
              ← Sổ từ vựng
            </Link>
            <Link href="/journal/vocab/decks" className="px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
              🗂️ Bộ thẻ
            </Link>
          </>
        }
      />

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}>
        <O so={tongQuan.tong} nhan="tổng số từ" />
        <O so={tongQuan.daThuoc} nhan="đã thuộc" mau={GREEN} />
        <O so={tongQuan.denHan} nhan="đến hạn ôn" mau="var(--accent-primary)" />
        <O so={`${s.chuoiNgay} ngày`} nhan="chuỗi ôn liên tiếp" />
      </div>

      <Sheet className="p-4">
        <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>
          30 NGÀY GẦN NHẤT
        </p>
        <DaiNgay hoatDong={s.hoatDong} />
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          Ô đậm là ngày ôn nhiều. Lượt bấm “Chưa thuộc” không được tính vào đây.
        </p>
      </Sheet>

      {s.theoBo.length > 0 && (
        <Sheet stack className="p-4">
          <p className="text-xs font-bold mb-3" style={{ color: "var(--text-muted)" }}>
            THEO BỘ THẺ
          </p>
          <ul className="space-y-2.5">
            {s.theoBo.map((b) => (
              <li key={b.id}>
                <Link href={`/journal/vocab/decks/${b.id}`} className="block">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {b.title}
                    </span>
                    <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                      thuộc {b.thuoc}/{b.tong}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
                    {/* Hai lớp: đã ôn (nhạt) và đã thuộc (đậm) */}
                    <div style={{ width: `${(b.daOn / Math.max(1, b.tong)) * 100}%`, height: "100%", background: "color-mix(in srgb, var(--accent-primary) 35%, transparent)", position: "relative" }}>
                      <div style={{ width: `${b.daOn > 0 ? (b.thuoc / b.daOn) * 100 : 0}%`, height: "100%", background: GREEN }} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            Vạch nhạt là số từ đã ôn ít nhất một lần, vạch đậm là số từ đã thuộc.
          </p>
        </Sheet>
      )}

      {s.haySai.length > 0 && (
        <Sheet stack className="p-4">
          <p className="text-xs font-bold mb-3" style={{ color: "var(--text-muted)" }}>
            TỪ HAY SAI NHẤT
          </p>
          <ul className="space-y-1.5">
            {s.haySai.map((w) => {
              const nhan = QUIZ_TYPES.find((t) => t.id === w.dangHaySai)?.nhan;
              return (
                <li key={w.word} className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)", minWidth: 120 }}>
                    {w.word}
                  </span>
                  <span className="text-xs" style={{ color: RED }}>sai {w.wrong} lần</span>
                  {nhan && (
                    <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      · hay sai ở dạng “{nhan}”
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            Những từ này tự được xếp lên đầu khi bạn làm quiz.
          </p>
        </Sheet>
      )}

      <Sheet className="p-4">
        <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>
          TỐC ĐỘ TRẢ LỜI
        </p>
        {duLieuTocDo < 20 ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Mới có {duLieuTocDo} câu trả lời đúng — cần khoảng 20 câu mỗi dạng mới nói được gì
            về tốc độ. Làm thêm vài lượt quiz nhé.
          </p>
        ) : (
          <ul className="text-sm space-y-1">
            {s.tocDo.map((t) => (
              <li key={t.nhom} style={{ color: "var(--text-primary)" }}>
                {NHAN_NHOM[t.nhom] ?? t.nhom}:{" "}
                <b>{(t.trungViMs / 1000).toFixed(1)}s</b>{" "}
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  (trung vị của {t.soCau} câu đúng)
                </span>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </div>
  );
}
