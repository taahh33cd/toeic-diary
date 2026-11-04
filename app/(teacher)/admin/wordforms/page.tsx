"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Câu "chọn dạng từ" học viên báo sai.
 *
 * Dạng quiz duy nhất do AI soạn, nên là dạng duy nhất cần màn này. Học viên
 * báo thì câu tắt ngay không chờ duyệt — ở đây thầy chỉ quyết số phận lâu dài
 * của nó: bỏ hẳn, hay bật lại nếu học viên báo nhầm.
 */

type Row = {
  id: string;
  wordKey: string;
  cloze: string;
  answer: string;
  distractors: string[];
  status: string;
  reportCount: number;
  reportNote: string | null;
};

const NHAN: Record<string, { chu: string; mau: string }> = {
  ok: { chu: "Đang dùng", mau: "#2e7d32" },
  reported: { chu: "Học viên báo sai", mau: "#c77700" },
  rejected: { chu: "Đã bỏ", mau: "#b3261e" },
};

export default function WordFormsPage() {
  const [loc, setLoc] = useState<"reported" | "rejected" | "all">("reported");
  const [rows, setRows] = useState<Row[]>([]);
  const [dangDung, setDangDung] = useState(0);
  const [tai, setTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangSua, setDangSua] = useState<string | null>(null);

  const nap = useCallback(async () => {
    setTai(true);
    setLoi(null);
    try {
      const r = await fetch(`/api/admin/wordforms?status=${loc}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Không tải được danh sách");
      setRows(j.rows);
      setDangDung(j.dangDung);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không tải được danh sách");
    } finally {
      setTai(false);
    }
  }, [loc]);

  useEffect(() => {
    nap();
  }, [nap]);

  async function doi(id: string, status: "ok" | "rejected") {
    setDangSua(id);
    setLoi(null);
    try {
      const r = await fetch("/api/admin/wordforms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Không đổi được trạng thái");
      await nap();
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không đổi được trạng thái");
    } finally {
      setDangSua(null);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-1">Câu hỏi chọn dạng từ bị báo sai</h1>
      <p className="text-sm opacity-70 mb-4">
        Dạng này do AI soạn nên sẽ có câu hỏng. Học viên báo là câu tắt ngay cho cả lớp —
        ở đây thầy bỏ hẳn hoặc bật lại. Hiện có <b>{dangDung}</b> câu đang dùng.
      </p>

      <div className="flex gap-1.5 mb-4">
        {(
          [
            ["reported", "Đang chờ xem"],
            ["rejected", "Đã bỏ"],
            ["all", "Tất cả"],
          ] as const
        ).map(([k, nhan]) => (
          <button
            key={k}
            onClick={() => setLoc(k)}
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: loc === k ? "#4441c4" : "rgba(0,0,0,.05)",
              color: loc === k ? "#fff" : "inherit",
            }}
          >
            {nhan}
          </button>
        ))}
      </div>

      {loi && (
        <p className="text-sm px-3 py-2 rounded-lg mb-3" style={{ background: "rgba(179,38,30,.1)", color: "#b3261e" }}>
          {loi}
        </p>
      )}

      {tai ? (
        <p className="text-sm opacity-60">Đang tải…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm opacity-60">
          {loc === "reported" ? "Chưa có câu nào bị báo sai." : "Không có câu nào."}
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const n = NHAN[r.status] ?? { chu: r.status, mau: "#666" };
            return (
              <div key={r.id} className="rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,.12)" }}>
                <div className="flex items-center gap-2 flex-wrap mb-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: `${n.mau}1a`, color: n.mau }}>
                    {n.chu}
                  </span>
                  <span className="opacity-60">từ: {r.wordKey}</span>
                  {r.reportCount > 0 && <span className="opacity-60">· {r.reportCount} lượt báo</span>}
                </div>

                <p className="text-sm mb-2">{r.cloze}</p>

                <p className="text-xs mb-2">
                  {[r.answer, ...r.distractors].map((x, i) => (
                    <span
                      key={i}
                      className="inline-block mr-2 px-2 py-0.5 rounded"
                      style={{
                        background: x === r.answer ? "rgba(46,125,50,.12)" : "rgba(0,0,0,.05)",
                        fontWeight: x === r.answer ? 700 : 400,
                      }}
                    >
                      {x}
                      {x === r.answer && " ✓"}
                    </span>
                  ))}
                </p>

                {r.reportNote && <p className="text-xs opacity-70 mb-2">Học viên ghi: {r.reportNote}</p>}

                <div className="flex gap-2">
                  {r.status !== "rejected" && (
                    <button
                      onClick={() => doi(r.id, "rejected")}
                      disabled={dangSua === r.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: "rgba(179,38,30,.12)", color: "#b3261e" }}
                    >
                      Bỏ hẳn câu này
                    </button>
                  )}
                  {r.status !== "ok" && (
                    <button
                      onClick={() => doi(r.id, "ok")}
                      disabled={dangSua === r.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: "rgba(46,125,50,.12)", color: "#2e7d32" }}
                    >
                      Bật lại — câu này không sai
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
