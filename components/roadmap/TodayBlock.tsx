"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/**
 * Khối "Lộ trình hôm nay" — dùng trong sổ học tập (/journal/missions).
 *
 * Tự im lặng biến mất khi học viên chưa có lộ trình hoặc chưa được mở quyền:
 * trang Nhiệm vụ là trang quen thuộc của học viên nội bộ, không được mọc thêm
 * một khối trống chỉ để quảng cáo tính năng.
 *
 * Gọi /api/roadmap/today, mà route đó tự chạy đối chiếu bằng chứng + dồn ngày
 * trước khi trả về — nên mở trang Nhiệm vụ cũng đủ làm lịch đúng.
 */

type Task = {
  id: string;
  title: string;
  href: string;
  estMinutes: number;
  priority: string;
  status: string;
  rolledFrom: string | null;
};

type Response =
  | { state: "closed" | "no_plan"; tasks: [] }
  | { state: "rest_day"; tasks: [] }
  | { state: "ok"; date: string; tasks: Task[] };

/**
 * Bộ nhớ tạm ở cấp module, sống 30 giây.
 *
 * `/api/roadmap/today` không chỉ đọc: nó chạy đối chiếu bằng chứng và dồn ngày,
 * tức là có GHI xuống DB. Mà khối này dễ bị gắn kết lại nhiều lần trong một lần
 * mở trang — React StrictMode gọi effect hai lượt khi dev, trang Nhiệm vụ lại
 * đổi nhánh render khi BTVN tải xong. Không chặn thì một lần mở trang thành cả
 * chục lượt ghi.
 */
let cache: { at: number; data: Response } | null = null;
let inflight: Promise<Response | null> | null = null;
const CACHE_MS = 30_000;

async function fetchToday(force: boolean): Promise<Response | null> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  if (!force && inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("/api/roadmap/today");
      if (!res.ok) return null;
      const data = (await res.json()) as Response;
      cache = { at: Date.now(), data };
      return data;
    } catch {
      // Mất mạng thì khối này không hiện — không chặn phần BTVN phía dưới.
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function RoadmapTodayBlock() {
  const [data, setData] = useState<Response | null>(cache?.data ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    const next = await fetchToday(force);
    if (next) setData(next);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function skip(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/roadmap/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "skip" }),
      });
      await load(true);
    } finally {
      setBusyId(null);
    }
  }

  if (!data || data.state === "closed" || data.state === "no_plan") return null;

  const done = data.tasks.filter((t) => t.status === "done" || t.status === "skipped").length;

  return (
    <section
      style={{
        border: "1px solid rgba(15,118,110,.35)",
        background: "rgba(15,118,110,.06)",
        padding: ".85rem 1rem",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: ".5rem",
          marginBottom: data.state === "ok" ? ".6rem" : 0,
        }}
      >
        <h2 style={{ fontSize: ".9rem", fontWeight: 700, color: "#0f766e" }}>
          Lộ trình hôm nay
        </h2>
        <Link
          href="/roadmap"
          style={{ fontSize: ".72rem", color: "#0f766e", textDecoration: "underline" }}
        >
          Xem cả tuần
        </Link>
      </div>

      {data.state === "rest_day" ? (
        <p style={{ fontSize: ".8rem", color: "#5B6B68" }}>
          Hôm nay lộ trình không giao việc — ngày nghỉ là một phần của kế hoạch.
        </p>
      ) : (
        <>
          <p style={{ fontSize: ".72rem", color: "#5B6B68", marginBottom: ".5rem" }}>
            Đã xong {done}/{data.tasks.length} việc. Việc tự tích xanh khi bạn làm xong bài.
          </p>
          <ul style={{ display: "grid", gap: ".4rem" }}>
            {data.tasks.map((t) => {
              const finished = t.status === "done";
              const skipped = t.status === "skipped";
              return (
                <li
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: ".5rem",
                    opacity: finished || skipped ? 0.6 : 1,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      color: finished ? "#4A7C59" : skipped ? "#9A8672" : "#0f766e",
                      fontSize: ".8rem",
                    }}
                  >
                    {finished ? "✓" : skipped ? "–" : t.priority === "bonus" ? "+" : "•"}
                  </span>
                  <Link
                    href={t.href}
                    style={{
                      flex: 1,
                      fontSize: ".82rem",
                      color: "var(--text-primary,#2C1E0F)",
                      textDecoration: finished || skipped ? "line-through" : "none",
                    }}
                  >
                    {t.title}
                    {t.rolledFrom && !finished && (
                      <span style={{ marginLeft: ".4rem", fontSize: ".7rem", color: "#B07D3A" }}>
                        dồn từ {formatShort(t.rolledFrom)}
                      </span>
                    )}
                  </Link>
                  <span style={{ fontSize: ".7rem", color: "#9A8672" }}>{t.estMinutes}′</span>
                  {!finished && !skipped && (
                    <button
                      type="button"
                      onClick={() => skip(t.id)}
                      disabled={busyId === t.id}
                      style={{
                        fontSize: ".68rem",
                        color: "#9A8672",
                        textDecoration: "underline",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      title="Đánh dấu bỏ qua — không tính là đã hoàn thành"
                    >
                      bỏ qua
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

function formatShort(dateKey: string): string {
  const [, m, d] = dateKey.split("-");
  return `${d}/${m}`;
}
