"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PARTS } from "@/lib/full-tests/parts";
import { scoreAttempt } from "@/lib/full-tests/scoring";
import type { FullTest, PartNumber } from "@/lib/full-tests/types";
import { PALETTE, type Skin } from "./theme";
import { SetupPanel, type RunConfig } from "./SetupPanel";
import { ExamScreen } from "./ExamScreen";

type Phase = "setup" | "exam" | "result";

interface Saved {
  config: RunConfig;
  answers: Record<number, string>;
  marked: number[];
  savedAt: number;
}

const SKIN_KEY = "fulltest:skin";

function saveKey(slug: string) {
  return `fulltest:progress:${slug}`;
}

export function FullTestRunner({ test, examSlug }: { test: FullTest; examSlug: string }) {
  const [skin, setSkin] = useState<Skin>("light");
  const [phase, setPhase] = useState<Phase>("setup");
  const [config, setConfig] = useState<RunConfig | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [marked, setMarked] = useState<number[]>([]);
  const [resumable, setResumable] = useState<Saved | null>(null);

  const P = PALETTE[skin];

  // Nạp skin + bài đang làm dở sau khi mount. Không đọc localStorage ở hàm khởi
  // tạo useState được: server render ra "light", client có thể ra "dark" ⇒ lệch
  // hydration. Một lượt render thêm lúc mount là đánh đổi rẻ hơn.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const s = localStorage.getItem(SKIN_KEY);
    if (s === "dark" || s === "light") setSkin(s);
    try {
      const raw = localStorage.getItem(saveKey(test.slug));
      if (raw) {
        const parsed = JSON.parse(raw) as Saved;
        if (parsed?.config?.parts?.length) setResumable(parsed);
      }
    } catch {
      // dữ liệu cũ hỏng thì bỏ qua
    }
  }, [test.slug]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleSkin = useCallback(() => {
    setSkin((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(SKIN_KEY, next);
      return next;
    });
  }, []);

  const persist = useCallback(
    (cfg: RunConfig, a: Record<number, string>, m: number[]) => {
      const payload: Saved = { config: cfg, answers: a, marked: m, savedAt: Date.now() };
      try {
        localStorage.setItem(saveKey(test.slug), JSON.stringify(payload));
      } catch {
        // hết quota thì bỏ qua, không chặn người làm bài
      }
    },
    [test.slug],
  );

  function start(cfg: RunConfig, resume?: Saved) {
    setConfig(cfg);
    setAnswers(resume?.answers ?? {});
    setMarked(resume?.marked ?? []);
    setResumable(null);
    setPhase("exam");
  }

  function finish(a: Record<number, string>, m: number[]) {
    setAnswers(a);
    setMarked(m);
    localStorage.removeItem(saveKey(test.slug));
    setPhase("result");
  }

  if (phase === "setup") {
    return (
      <>
        {resumable && (
          <div style={{ background: P.bg, fontFamily: P.sans, padding: "1rem 1rem 0" }}>
            <div style={{ maxWidth: 780, margin: "0 auto", background: P.panel, border: `1px solid ${P.primary}`, borderRadius: 12, padding: "0.95rem 1.1rem", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", color: P.ink }}>
              <span style={{ flex: 1, minWidth: 200, fontSize: "0.88rem", lineHeight: 1.5 }}>
                <strong>Có bài đang làm dở</strong> — đã trả lời{" "}
                {Object.keys(resumable.answers).length} câu,{" "}
                {new Date(resumable.savedAt).toLocaleString("vi-VN")}.
              </span>
              <button
                type="button"
                onClick={() => start(resumable.config, resumable)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: P.primary, color: P.onPrimary, fontWeight: 800, fontFamily: P.sans, fontSize: "0.85rem", cursor: "pointer" }}
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(saveKey(test.slug));
                  setResumable(null);
                }}
                style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${P.border}`, background: "transparent", color: P.muted, fontWeight: 700, fontFamily: P.sans, fontSize: "0.85rem", cursor: "pointer" }}
              >
                Làm lại từ đầu
              </button>
            </div>
          </div>
        )}
        <SetupPanel
          title={test.title}
          examSlug={examSlug}
          brokenQuestions={test.stats.brokenQuestions}
          skin={skin}
          onToggleSkin={toggleSkin}
          onStart={(cfg) => start(cfg)}
        />
      </>
    );
  }

  if (phase === "exam" && config) {
    return (
      <ExamScreen
        test={test}
        config={config}
        skin={skin}
        onToggleSkin={toggleSkin}
        onSubmit={finish}
        initialAnswers={answers}
        initialMarked={marked}
        onProgress={(a, m) => persist(config, a, m)}
      />
    );
  }

  if (phase === "result" && config) {
    return (
      <ResultPanel
        test={test}
        config={config}
        answers={answers}
        skin={skin}
        onToggleSkin={toggleSkin}
        onRetry={() => setPhase("setup")}
      />
    );
  }

  return null;
}

function ResultPanel({
  test, config, answers, skin, onToggleSkin, onRetry,
}: {
  test: FullTest;
  config: RunConfig;
  answers: Record<number, string>;
  skin: Skin;
  onToggleSkin: () => void;
  onRetry: () => void;
}) {
  const P = PALETTE[skin];
  const result = useMemo(
    () => scoreAttempt(test, answers, config.parts as PartNumber[]),
    [test, answers, config.parts],
  );

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: P.bg, color: P.ink, fontFamily: P.sans, padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", display: "grid", gap: "1rem" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link href="/skills/full-tests" style={{ fontSize: "0.82rem", color: P.muted, textDecoration: "none" }}>
            ← Danh sách đề
          </Link>
          <button type="button" onClick={onToggleSkin} style={{ background: "transparent", border: `1px solid ${P.border}`, borderRadius: 999, padding: "5px 12px", color: P.inkSoft, fontSize: "0.78rem", cursor: "pointer", fontFamily: P.sans }}>
            {skin === "light" ? "🌙 Tối" : "☀️ Sáng"}
          </button>
        </div>

        <div style={{ background: P.panel, border: `1px solid ${P.border}`, borderRadius: 14, padding: "1.4rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: P.muted, margin: "0 0 0.5rem" }}>
            {test.title}
          </p>
          {result.scaled ? (
            <>
              <p style={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1, margin: "0 0 0.3rem", color: P.primary }}>
                {result.scaled.total}
              </p>
              <p style={{ fontSize: "0.88rem", color: P.inkSoft, margin: 0 }}>
                Listening {result.scaled.ls} · Reading {result.scaled.rd}
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1, margin: "0 0 0.3rem", color: P.primary }}>
                {Math.round(result.accuracy * 100)}%
              </p>
              <p style={{ fontSize: "0.85rem", color: P.muted, margin: 0, lineHeight: 1.5 }}>
                {result.correct}/{result.gradable} câu đúng · chưa quy đổi điểm 990 vì không làm đủ 7 part
              </p>
            </>
          )}
        </div>

        <div style={{ background: P.panel, border: `1px solid ${P.border}`, borderRadius: 14, padding: "1.2rem 1.3rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: P.muted, margin: "0 0 0.9rem" }}>
            Theo từng part
          </p>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {result.parts.map((s) => {
              const meta = PARTS.find((p) => p.part === s.part)!;
              const pct = Math.round(s.accuracy * 100);
              return (
                <div key={s.part}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.83rem", marginBottom: 4 }}>
                    <span><strong>{meta.label}</strong> <span style={{ color: P.muted }}>{meta.labelVi}</span></span>
                    <span style={{ fontVariantNumeric: "tabular-nums", color: pct >= 75 ? P.ok : pct >= 50 ? P.warn : P.bad, fontWeight: 700 }}>
                      {s.correct}/{s.gradable} · {pct}%
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: P.panelAlt, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: pct >= 75 ? P.ok : pct >= 50 ? P.warn : P.bad }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          style={{ width: "100%", padding: "0.9rem", borderRadius: 11, border: "none", background: P.primary, color: P.onPrimary, fontFamily: P.sans, fontSize: "0.95rem", fontWeight: 800, cursor: "pointer" }}
        >
          Làm lại đề này
        </button>
      </div>
    </div>
  );
}
