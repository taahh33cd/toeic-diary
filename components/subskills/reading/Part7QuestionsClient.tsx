"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Eraser, RotateCcw, XCircle } from "lucide-react";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";
import {
  KW_LAYERS,
  P7Q_PASS,
  P7Q_TYPES,
  STEP_BIT,
  STEP_LABEL,
  STRATEGIES,
  TRANS_ERROR_LABEL,
  gradeKeywords,
  parsePrompt,
  plainPrompt,
  sourceLabel,
  type BestScore,
  type KwLayer,
  type P7QItem,
  type StepKey,
  type Token,
  type TransError,
} from "@/lib/subskills/part7-questions/types";

type Card = { signs: string; how: string; traps: string[] } | null;

interface Props {
  lessonSlug: string;
  title: string;
  items: P7QItem[];
  card: Card;
  initialBest: BestScore | null;
}

type StepId = StepKey | "can-cu";
type ItemResult = Partial<Record<StepKey, boolean>>;

const BASE = "/subskills/reading/part7-questions";

function stepsOf(item: P7QItem): StepId[] {
  return item.typeOptions
    ? ["dich", "tu-khoa", "dang", "chien-luoc", "can-cu"]
    : ["dich", "tu-khoa", "chien-luoc", "can-cu"];
}

/** Xáo trộn ổn định theo id để thứ tự đáp án không đổi khi render lại. */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function itemScore(r: ItemResult): { score: number; passed: boolean; bits: number } {
  const keys = Object.keys(r) as StepKey[];
  const ok = keys.filter((k) => r[k]);
  const bits = ok.reduce((b, k) => b | STEP_BIT[k], 0);
  return { score: keys.length ? Math.round((ok.length / keys.length) * 100) : 0, passed: ok.length === keys.length, bits };
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function Part7QuestionsClient({ lessonSlug, title, items, card, initialBest }: Props) {
  const [screen, setScreen] = useState<"intro" | "quiz" | "result">("intro");
  const [idx, setIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [results, setResults] = useState<ItemResult[]>(() => items.map(() => ({})));
  const [best, setBest] = useState<BestScore | null>(initialBest);
  const [saving, setSaving] = useState(false);
  const [showCard, setShowCard] = useState(false);

  // trạng thái của bước đang làm
  const [choice, setChoice] = useState<number | null>(null);
  const [picked, setPicked] = useState<(KwLayer | null)[]>(() => parsePrompt(items[0].prompt).map(() => null));
  const [brush, setBrush] = useState<KwLayer | "erase">("q");
  const [kwChecked, setKwChecked] = useState(false);

  const item = items[idx];
  const steps = stepsOf(item);
  const step = steps[stepIdx];
  const tokens = useMemo(() => parsePrompt(item.prompt), [item.prompt]);

  const resetStep = useCallback(() => {
    setChoice(null);
    setKwChecked(false);
    setBrush("q");
  }, []);

  const record = useCallback((key: StepKey, ok: boolean) => {
    setResults((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: ok };
      return next;
    });
  }, [idx]);

  const answered = step === "can-cu" || (step === "tu-khoa" ? kwChecked : choice !== null);
  const isLast = idx === items.length - 1 && stepIdx === steps.length - 1;

  const finish = useCallback(async () => {
    const per = results.map(itemScore);
    const score = Math.round(per.reduce((s, p) => s + p.score, 0) / per.length);
    const passed = score >= P7Q_PASS;
    setScreen("result");
    setSaving(true);
    try {
      await fetch("/api/subskills/part7-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson: lessonSlug,
          score,
          passed,
          items: items.map((it, i) => ({ id: it.id, steps: per[i].bits, score: per[i].score, passed: per[i].passed })),
        }),
      });
      if (!best || score > best.score) setBest({ score, passed });
    } catch {}
    setSaving(false);
  }, [results, items, lessonSlug, best]);

  const next = useCallback(() => {
    if (!answered) return;
    resetStep();
    if (stepIdx < steps.length - 1) {
      setStepIdx(stepIdx + 1);
    } else if (idx < items.length - 1) {
      setIdx(idx + 1);
      setStepIdx(0);
      setPicked(parsePrompt(items[idx + 1].prompt).map(() => null));
      window.scrollTo({ top: 0 });
    } else {
      finish();
    }
  }, [answered, resetStep, stepIdx, steps.length, idx, items, finish]);

  useEffect(() => {
    if (screen !== "quiz") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && answered) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, answered, next]);

  const restart = () => {
    setResults(items.map(() => ({})));
    setPicked(parsePrompt(items[0].prompt).map(() => null));
    setIdx(0);
    setStepIdx(0);
    resetStep();
    setScreen("quiz");
  };

  const shell: CSSProperties = {
    ...FILL_SCREEN,
    background: "var(--bg-primary)",
    padding: `${PAD_Y} ${PAD_X}`,
    maxWidth: Math.min(CONTAINER_MAX, 860),
    margin: "0 auto",
    boxSizing: "border-box",
  };

  const back = (
    <Link href={BASE} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: FS.xs, color: "var(--text-muted)", textDecoration: "none", marginBottom: "1rem" }}>
      <ArrowLeft size={13} /> Đọc câu hỏi Part 7
    </Link>
  );

  // ── Intro ──
  if (screen === "intro") {
    const hasType = items.some((i) => i.typeOptions);
    return (
      <div style={shell}>
        {back}
        <h1 style={{ fontSize: FS.lg, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.4rem" }}>{title}</h1>
        <p style={{ fontSize: FS.sm, color: "var(--text-muted)", margin: "0 0 1.25rem" }}>
          {items.length} câu · {hasType ? "4 bước" : "3 bước"} mỗi câu · đạt từ {P7Q_PASS}%
          {best ? ` · điểm cao nhất ${best.score}%` : ""}
        </p>
        {card && <StrategyCard card={card} />}
        <Box style={{ marginBottom: "1.25rem" }}>
          <div style={label}>Mỗi câu làm theo thứ tự</div>
          <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <li><strong>Dịch:</strong> chọn bản dịch đúng (bản sai mắc lỗi chủ thể, thì / bị động hoặc từ đa nghĩa).</li>
            <li><strong>Từ khoá:</strong> chọn màu rồi chạm vào từ: <Chip layer="q" /> <Chip layer="t" /> <Chip layer="c" />. Mạo từ, is / does / did không cần tô.</li>
            {hasType && <li><strong>Dạng câu:</strong> chọn dạng câu hỏi.</li>}
            <li><strong>Chiến lược:</strong> chọn cách đọc bài nhanh nhất.</li>
            <li><strong>Căn cứ:</strong> xem chỗ trong bài chứa đáp án.</li>
          </ol>
        </Box>
        <button type="button" onClick={() => setScreen("quiz")} style={primaryBtn}>Bắt đầu →</button>
      </div>
    );
  }

  // ── Result ──
  if (screen === "result") {
    const per = results.map(itemScore);
    const score = Math.round(per.reduce((s, p) => s + p.score, 0) / per.length);
    const passed = score >= P7Q_PASS;
    const stepKeys: StepKey[] = ["dich", "tu-khoa", "dang", "chien-luoc"];
    return (
      <div style={shell}>
        {back}
        <Box style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: FS.xl, fontWeight: 800, color: passed ? "var(--accent-green)" : "var(--accent-yellow)" }}>{score}%</div>
          <div style={{ fontSize: FS.sm, color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            {passed ? "Đạt!" : `Chưa đạt (cần ${P7Q_PASS}%)`} · {title}
            {saving ? " · đang lưu…" : ""}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginTop: "0.9rem" }}>
            {stepKeys.map((k) => {
              const done = results.filter((r) => r[k] !== undefined);
              if (!done.length) return null;
              const ok = done.filter((r) => r[k]).length;
              return (
                <span key={k} style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>
                  {STEP_LABEL[k]}: <strong style={{ color: ok === done.length ? "var(--accent-green)" : "var(--text-primary)" }}>{ok}/{done.length}</strong>
                </span>
              );
            })}
          </div>
        </Box>
        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {items.map((it, i) => (
            <div key={it.id} style={{ display: "flex", gap: "0.6rem", alignItems: "center", padding: "0.6rem 0.8rem", borderRadius: 8, background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              {per[i].passed ? <CheckCircle2 size={16} color="var(--accent-green)" /> : <XCircle size={16} color="var(--accent-red)" />}
              <span style={{ flex: 1, fontSize: FS.xs, color: "var(--text-secondary)" }}>{plainPrompt(it.prompt)}</span>
              <span style={{ display: "flex", gap: 4 }}>
                {(Object.keys(results[i]) as StepKey[]).map((k) => (
                  <span key={k} title={STEP_LABEL[k]} style={{ width: 8, height: 8, borderRadius: 99, background: results[i][k] ? "var(--accent-green)" : "var(--accent-red)" }} />
                ))}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="button" onClick={restart} style={{ ...primaryBtn, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <RotateCcw size={15} /> Làm lại
          </button>
          <Link href={BASE} style={{ ...ghostBtn, textDecoration: "none" }}>Về danh sách bài</Link>
        </div>
      </div>
    );
  }

  // ── Quiz ──
  const expected = <PromptView tokens={tokens} mode="answer" />;

  return (
    <div style={shell}>
      {back}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", alignItems: "baseline", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: FS.sm, fontWeight: 700, color: "var(--text-primary)" }}>{title}</span>
        <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>Câu {idx + 1}/{items.length} · {sourceLabel(item.id)}</span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: "var(--bg-secondary)", overflow: "hidden", marginBottom: "0.9rem" }}>
        <div style={{ height: "100%", width: `${((idx + stepIdx / steps.length) / items.length) * 100}%`, background: "var(--accent-primary)", transition: "width .2s" }} />
      </div>

      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {steps.map((s, i) => {
          const res = s !== "can-cu" ? results[idx][s] : undefined;
          const active = i === stepIdx;
          return (
            <span key={s} style={{
              fontSize: FS.xs,
              fontWeight: active ? 700 : 500,
              padding: "3px 10px",
              borderRadius: 99,
              border: `1px solid ${active ? "var(--accent-primary)" : "var(--border)"}`,
              color: res === true ? "var(--accent-green)" : res === false ? "var(--accent-red)" : active ? "var(--accent-primary)" : "var(--text-muted)",
              background: active ? "var(--bg-elevated)" : "transparent",
            }}>
              {i + 1}. {s === "can-cu" ? "Căn cứ" : STEP_LABEL[s]}
            </span>
          );
        })}
      </div>

      {card && (
        <div style={{ marginBottom: "0.9rem" }}>
          <button type="button" onClick={() => setShowCard((v) => !v)} style={{ ...linkBtn }}>
            {showCard ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Thẻ chiến lược
          </button>
          {showCard && <div style={{ marginTop: "0.5rem" }}><StrategyCard card={card} /></div>}
        </div>
      )}

      {step === "dich" && (
        <TranslateStep item={item} choice={choice} onChoose={(i, ok) => { setChoice(i); record("dich", ok); }} />
      )}

      {step === "tu-khoa" && (
        <KeywordStep
          item={item}
          tokens={tokens}
          picked={picked}
          brush={brush}
          checked={kwChecked}
          onBrush={setBrush}
          onToggle={(i) => {
            if (kwChecked) return;
            setPicked((p) => {
              const n = [...p];
              n[i] = brush === "erase" || n[i] === brush ? null : brush;
              return n;
            });
          }}
          onCheck={() => {
            setKwChecked(true);
            record("tu-khoa", gradeKeywords(tokens, picked).ok);
          }}
        />
      )}

      {step === "dang" && item.typeOptions && (
        <ChoiceStep
          prompt={expected}
          question="Câu hỏi này thuộc dạng nào?"
          options={item.typeOptions.map((t) => ({ main: P7Q_TYPES[t].name, sub: P7Q_TYPES[t].signal }))}
          correctIdx={item.typeOptions.indexOf(item.type)}
          choice={choice}
          why={item.typeWhy ?? ""}
          onChoose={(i) => { setChoice(i); record("dang", i === item.typeOptions!.indexOf(item.type)); }}
        />
      )}

      {step === "chien-luoc" && (
        <ChoiceStep
          prompt={expected}
          question="Nên đọc bài theo cách nào?"
          options={item.strategy.options.map((s) => ({ main: `${s} · ${STRATEGIES[s]}` }))}
          correctIdx={item.strategy.options.indexOf(item.strategy.correct)}
          choice={choice}
          why={item.strategy.why}
          onChoose={(i) => { setChoice(i); record("chien-luoc", item.strategy.options[i] === item.strategy.correct); }}
        />
      )}

      {step === "can-cu" && <EvidenceStep item={item} prompt={expected} />}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <button type="button" onClick={next} disabled={!answered} style={{ ...primaryBtn, opacity: answered ? 1 : 0.45, cursor: answered ? "pointer" : "not-allowed" }}>
          {isLast ? "Xem kết quả" : stepIdx === steps.length - 1 ? "Câu tiếp →" : "Tiếp →"}
        </button>
      </div>
    </div>
  );
}

// ── Steps ────────────────────────────────────────────────────────────────────

function TranslateStep({ item, choice, onChoose }: {
  item: P7QItem;
  choice: number | null;
  onChoose: (i: number, ok: boolean) => void;
}) {
  const options = useMemo(
    () => seededShuffle<{ text: string; error?: TransError; why?: string }>([{ text: item.vi }, ...item.wrong], item.id),
    [item],
  );
  return (
    <>
      <Box style={{ marginBottom: "1rem" }}>
        <div style={label}>Câu hỏi</div>
        <div style={{ fontSize: FS.md, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.6 }}>{plainPrompt(item.prompt)}</div>
      </Box>
      <div style={{ ...label, marginBottom: "0.5rem" }}>Chọn bản dịch đúng</div>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {options.map((o, i) => {
          const done = choice !== null;
          const isRight = !o.error;
          const chosen = choice === i;
          return (
            <button key={i} type="button" disabled={done} onClick={() => onChoose(i, isRight)} style={optionStyle(done, isRight, chosen)}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                {done && (isRight ? <CheckCircle2 size={16} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: 3 }} /> : chosen ? <XCircle size={16} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 3 }} /> : null)}
                <span>{o.text}</span>
              </div>
              {done && o.error && (
                <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginTop: "0.35rem", lineHeight: 1.55 }}>
                  <strong style={{ color: chosen ? "var(--accent-red)" : "var(--text-secondary)" }}>{TRANS_ERROR_LABEL[o.error]}:</strong> {o.why}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

function KeywordStep({ item, tokens, picked, brush, checked, onBrush, onToggle, onCheck }: {
  item: P7QItem;
  tokens: Token[];
  picked: (KwLayer | null)[];
  brush: KwLayer | "erase";
  checked: boolean;
  onBrush: (b: KwLayer | "erase") => void;
  onToggle: (i: number) => void;
  onCheck: () => void;
}) {
  const result = checked ? gradeKeywords(tokens, picked) : null;
  return (
    <>
      {!checked && (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {(Object.keys(KW_LAYERS) as KwLayer[]).map((k) => (
            <button key={k} type="button" onClick={() => onBrush(k)} style={{
              ...brushBtn,
              background: KW_LAYERS[k].bg,
              borderColor: brush === k ? KW_LAYERS[k].color : "transparent",
              boxShadow: brush === k ? `0 0 0 1px ${KW_LAYERS[k].color}` : "none",
            }}>
              {KW_LAYERS[k].label}
            </button>
          ))}
          <button type="button" onClick={() => onBrush("erase")} style={{ ...brushBtn, background: "var(--bg-secondary)", borderColor: brush === "erase" ? "var(--text-muted)" : "transparent", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Eraser size={13} /> Xoá
          </button>
        </div>
      )}

      <Box style={{ marginBottom: "1rem" }}>
        <div style={label}>{checked ? "Bạn đánh dấu" : "Chạm vào từ để tô màu"}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem 0.25rem", lineHeight: 1.4 }}>
          {tokens.map((t, i) => {
            const p = picked[i];
            const mark = result?.marks[i];
            return (
              <button
                key={i}
                type="button"
                onClick={() => onToggle(i)}
                disabled={checked}
                style={{
                  fontSize: FS.md,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  minHeight: 36,
                  padding: "2px 6px",
                  borderRadius: 6,
                  border: "none",
                  borderBottom: `3px solid ${p ? KW_LAYERS[p].color : "transparent"}`,
                  background: p ? KW_LAYERS[p].bg : "transparent",
                  cursor: checked ? "default" : "pointer",
                  outline: mark === "wrong" || mark === "extra" ? "2px solid var(--accent-red)" : mark === "missed" ? "2px dashed var(--accent-red)" : "none",
                  outlineOffset: 1,
                  textDecoration: mark === "extra" ? "line-through" : "none",
                }}
              >
                {t.text}
              </button>
            );
          })}
        </div>
      </Box>

      {!checked ? (
        <button type="button" onClick={onCheck} disabled={!picked.some(Boolean)} style={{ ...ghostBtn, opacity: picked.some(Boolean) ? 1 : 0.45 }}>
          Kiểm tra
        </button>
      ) : (
        <>
          <Feedback ok={result!.ok}>
            {result!.ok ? "Đạt." : "Chưa đạt."}{" "}
            <span style={{ color: "var(--text-muted)" }}>
              Viền đỏ liền = tô sai màu / tô thừa, viền đỏ đứt = bỏ sót. (Cho phép thừa tối đa 1 từ.)
            </span>
          </Feedback>
          <Box style={{ marginTop: "0.75rem" }}>
            <div style={label}>Đáp án</div>
            <PromptView tokens={tokens} mode="answer" />
            <p style={{ fontSize: FS.xs, color: "var(--text-secondary)", margin: "0.6rem 0 0", lineHeight: 1.6 }}>{item.kwNote}</p>
          </Box>
        </>
      )}
    </>
  );
}

function ChoiceStep({ prompt, question, options, correctIdx, choice, why, onChoose }: {
  prompt: ReactNode;
  question: string;
  options: { main: string; sub?: string }[];
  correctIdx: number;
  choice: number | null;
  why: string;
  onChoose: (i: number) => void;
}) {
  const done = choice !== null;
  return (
    <>
      <Box style={{ marginBottom: "1rem" }}>{prompt}</Box>
      <div style={{ ...label, marginBottom: "0.5rem" }}>{question}</div>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {options.map((o, i) => (
          <button key={i} type="button" disabled={done} onClick={() => onChoose(i)} style={optionStyle(done, i === correctIdx, choice === i)}>
            <div>{o.main}</div>
            {o.sub && <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginTop: 2 }}>{o.sub}</div>}
          </button>
        ))}
      </div>
      {done && <div style={{ marginTop: "0.75rem" }}><Feedback ok={choice === correctIdx}>{why}</Feedback></div>}
    </>
  );
}

function EvidenceStep({ item, prompt }: { item: P7QItem; prompt: ReactNode }) {
  const parts = item.evidence.excerpt.split(/==(.+?)==/g);
  return (
    <>
      <Box style={{ marginBottom: "1rem" }}>{prompt}</Box>
      <Box>
        <div style={label}>Căn cứ trong bài · {item.evidence.doc}</div>
        <blockquote style={{ margin: 0, padding: "0.6rem 0.9rem", borderLeft: "3px solid var(--accent-primary)", background: "var(--bg-secondary)", borderRadius: 6, fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.75 }}>
          {parts.map((p, i) =>
            i % 2 === 1 ? (
              <mark key={i} style={{ background: "rgba(245,158,11,.28)", color: "inherit", padding: "0 2px", borderRadius: 3 }}>{p}</mark>
            ) : (
              <span key={i}>{p.split(" ‖ ").map((s, j) => (j ? [<br key={`b${j}`} />, <br key={`c${j}`} />, s] : s))}</span>
            ),
          )}
        </blockquote>
        <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", margin: "0.75rem 0 0", lineHeight: 1.65 }}>{item.evidence.note}</p>
      </Box>
    </>
  );
}

// ── Bits ─────────────────────────────────────────────────────────────────────

/** Câu hỏi tô màu theo đáp án; từ không bắt buộc gạch chân chấm. */
function PromptView({ tokens }: { tokens: Token[]; mode: "answer" }) {
  return (
    <div style={{ fontSize: FS.md, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.9 }}>
      {tokens.map((t, i) => (
        <span key={i}>
          <span style={t.layer ? {
            background: t.optional ? "transparent" : KW_LAYERS[t.layer].bg,
            borderBottom: `${t.optional ? "2px dotted" : "3px solid"} ${KW_LAYERS[t.layer].color}`,
            padding: "1px 3px",
            borderRadius: 4,
          } : undefined}>{t.text}</span>{" "}
        </span>
      ))}
    </div>
  );
}

function StrategyCard({ card }: { card: NonNullable<Card> }) {
  return (
    <Box style={{ borderLeft: "3px solid var(--accent-primary)", marginBottom: "1.25rem" }}>
      <div style={label}>Thẻ chiến lược</div>
      <div style={{ fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.7, display: "grid", gap: "0.4rem" }}>
        <div><strong>Dấu hiệu:</strong> {card.signs}</div>
        <div><strong>Cách làm:</strong> {card.how}</div>
        <div>
          <strong>Bẫy:</strong>
          <ul style={{ margin: "0.2rem 0 0", paddingLeft: "1.2rem" }}>
            {card.traps.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </div>
    </Box>
  );
}

function Chip({ layer }: { layer: KwLayer }) {
  return (
    <span style={{ fontSize: FS.xs, fontWeight: 700, padding: "1px 7px", borderRadius: 5, background: KW_LAYERS[layer].bg, borderBottom: `2px solid ${KW_LAYERS[layer].color}`, color: "var(--text-primary)" }}>
      {KW_LAYERS[layer].label}
    </span>
  );
}

function Feedback({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <div style={{
      display: "flex",
      gap: "0.5rem",
      alignItems: "flex-start",
      padding: "0.7rem 0.9rem",
      borderRadius: 8,
      fontSize: FS.sm,
      lineHeight: 1.6,
      color: "var(--text-primary)",
      background: "var(--bg-secondary)",
      border: `1px solid ${ok ? "var(--accent-green)" : "var(--accent-red)"}`,
    }}>
      {ok ? <CheckCircle2 size={17} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: 2 }} /> : <XCircle size={17} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 2 }} />}
      <div>{children}</div>
    </div>
  );
}

function Box({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, padding: "0.9rem 1rem", ...style }}>
      {children}
    </div>
  );
}

function optionStyle(done: boolean, isRight: boolean, chosen: boolean): CSSProperties {
  return {
    textAlign: "left",
    width: "100%",
    fontSize: FS.sm,
    lineHeight: 1.55,
    padding: "0.7rem 0.9rem",
    borderRadius: 10,
    color: "var(--text-primary)",
    background: done && isRight ? "rgba(16,185,129,.1)" : done && chosen ? "rgba(239,68,68,.08)" : "var(--bg-elevated)",
    border: `1.5px solid ${done && isRight ? "var(--accent-green)" : done && chosen ? "var(--accent-red)" : "var(--border)"}`,
    cursor: done ? "default" : "pointer",
  };
}

const label: CSSProperties = {
  fontSize: FS.xs,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  marginBottom: "0.4rem",
};

const primaryBtn: CSSProperties = {
  fontSize: FS.sm,
  fontWeight: 700,
  padding: "0.65rem 1.3rem",
  borderRadius: 10,
  border: "none",
  background: "var(--accent-primary)",
  color: "#fff",
  cursor: "pointer",
};

const ghostBtn: CSSProperties = {
  fontSize: FS.sm,
  fontWeight: 600,
  padding: "0.6rem 1.1rem",
  borderRadius: 10,
  border: "1.5px solid var(--accent-primary)",
  background: "transparent",
  color: "var(--accent-primary)",
  cursor: "pointer",
};

const linkBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontSize: FS.xs,
  fontWeight: 600,
  color: "var(--accent-primary)",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
};

const brushBtn: CSSProperties = {
  fontSize: FS.xs,
  fontWeight: 700,
  padding: "0.45rem 0.75rem",
  minHeight: 36,
  borderRadius: 8,
  border: "2px solid transparent",
  color: "var(--text-primary)",
  cursor: "pointer",
};
