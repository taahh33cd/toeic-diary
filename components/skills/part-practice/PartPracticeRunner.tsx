"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FullTest, PartNumber } from "@/lib/full-tests/types";
import { PALETTE, type Skin } from "@/components/full-tests/theme";
import type { RunConfig } from "@/components/full-tests/SetupPanel";
import { ExamScreen } from "@/components/full-tests/ExamScreen";
import { ReviewPanel } from "@/components/full-tests/ReviewPanel";
import { useAttempt, type AttemptRow } from "@/components/shared/useAttempt";
import { PartSetupPanel } from "./PartSetupPanel";

type Phase = "setup" | "exam" | "result";

// Dùng chung khoá skin với full test — cùng một bộ máy làm bài, người dùng
// chỉnh sáng/tối một lần là áp cho cả hai.
const SKIN_KEY = "fulltest:skin";
const MIRROR_KEY = "partpractice:mirror";
const API_BASE = "/api/skills/part-practice/attempts";

function toAnswerMap(raw: Record<string, string> | Record<number, string>): Record<number, string> {
  const out: Record<number, string> = {};
  for (const [k, v] of Object.entries(raw ?? {})) {
    const n = Number(k);
    if (Number.isInteger(n)) out[n] = v;
  }
  return out;
}

/**
 * Màn luyện một part: cùng bộ máy làm bài với /skills/full-tests
 * (SetupPanel → ExamScreen → ReviewPanel), chỉ khác là part đã cố định theo URL
 * và lượt làm ghi vào bảng riêng part_practice_attempts.
 */
export function PartPracticeRunner({
  test, skill, part, backHref, canSaveVocab = false,
}: {
  test: FullTest;
  skill: string;
  part: PartNumber;
  /** Danh sách đề của part này */
  backHref: string;
  canSaveVocab?: boolean;
}) {
  const [skin, setSkin] = useState<Skin>("light");
  const [phase, setPhase] = useState<Phase>("setup");
  const [config, setConfig] = useState<RunConfig | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [marked, setMarked] = useState<number[]>([]);
  const [resumable, setResumable] = useState<AttemptRow | null>(null);
  const [busy, setBusy] = useState(false);

  const P = PALETTE[skin];
  const identity = useMemo(() => ({ skill, part }), [skill, part]);
  const attempt = useAttempt({
    basePath: API_BASE,
    mirrorKey: MIRROR_KEY,
    testSlug: test.slug,
    identity,
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  // Đọc localStorage ở hàm khởi tạo state sẽ lệch hydration (server luôn ra
  // "light"), nên nhận sau khi mount.
  useEffect(() => {
    const s = localStorage.getItem(SKIN_KEY);
    if (s === "dark" || s === "light") setSkin(s);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Chỉ hỏi server một lần cho mỗi bộ đề: hook trả về object mới mỗi lần render
  // nên nếu để [attempt] làm dep thì mỗi lần setResumable lại gọi fetch tiếp.
  const asked = useRef<string | null>(null);
  const fetchInProgress = attempt.fetchInProgress;
  useEffect(() => {
    if (asked.current === test.slug) return;
    asked.current = test.slug;
    let alive = true;
    fetchInProgress().then((row) => {
      if (alive && row) setResumable(row);
    });
    return () => { alive = false; };
  }, [test.slug, fetchInProgress]);

  const toggleSkin = useCallback(() => {
    setSkin((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(SKIN_KEY, next);
      return next;
    });
  }, []);

  async function start(cfg: RunConfig, resume?: AttemptRow) {
    setBusy(true);
    const row = await attempt.start(cfg, !resume);
    setBusy(false);
    setConfig((resume?.config as RunConfig) ?? cfg);
    setAnswers(resume ? toAnswerMap(resume.answers) : {});
    setMarked(resume?.marked ?? []);
    setResumable(null);
    if (!row) {
      // Không tạo được lượt trên server (mất mạng) — vẫn cho làm, chỉ là
      // bài chỉ được giữ trong localStorage cho tới khi có mạng lại.
      console.warn("Không tạo được lượt làm trên server, chuyển sang lưu cục bộ");
    }
    setPhase("exam");
  }

  async function finish(a: Record<number, string>, m: number[]) {
    setAnswers(a);
    setMarked(m);
    setBusy(true);
    await attempt.submit(a, m);
    setBusy(false);
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
                {Object.keys(resumable.answers ?? {}).length} câu,{" "}
                {new Date(resumable.updatedAt).toLocaleString("vi-VN")}.
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => start(resumable.config as RunConfig, resumable)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: P.primary, color: P.onPrimary, fontWeight: 800, fontFamily: P.sans, fontSize: "0.85rem", cursor: busy ? "wait" : "pointer" }}
              >
                Làm tiếp
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setResumable(null)}
                style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${P.border}`, background: "transparent", color: P.muted, fontWeight: 700, fontFamily: P.sans, fontSize: "0.85rem", cursor: busy ? "wait" : "pointer" }}
              >
                Bỏ qua, làm lại từ đầu
              </button>
            </div>
          </div>
        )}
        <PartSetupPanel
          title={test.title}
          part={part}
          questionCount={test.stats.questions}
          backHref={backHref}
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
        saveState={attempt.saveState}
        onProgress={attempt.save}
        realLabel="Thi thử"
      />
    );
  }

  if (phase === "result" && config) {
    return (
      <ReviewPanel
        test={test}
        config={config}
        answers={answers}
        marked={marked}
        skin={skin}
        onToggleSkin={toggleSkin}
        canSaveVocab={canSaveVocab}
        backHref={backHref}
        onRetry={() => { setPhase("setup"); setAnswers({}); setMarked([]); }}
      />
    );
  }

  return null;
}
