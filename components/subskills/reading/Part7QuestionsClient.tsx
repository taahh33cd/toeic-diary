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
  type ABCD,
  type DemoStep,
  type P7QDemo,
  type P7QItem,
  type P7QType,
  type StepKey,
  type Token,
  type TransError,
} from "@/lib/subskills/part7-questions/types";

type Card = { signs: string; how: string; traps: string[] } | null;

export type GuideProps =
  | { kind: "type"; advancedNote?: string; example: P7QDemo; practice?: P7QDemo }
  | { kind: "mixed"; table: { signal: string; type: P7QType; strategy: string }[]; example: P7QDemo };

interface Props {
  lessonSlug: string;
  title: string;
  items: P7QItem[];
  card: Card;
  guide?: GuideProps | null;
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

export function Part7QuestionsClient({ lessonSlug, title, items, card, guide, initialBest }: Props) {
  const [screen, setScreen] = useState<"intro" | "demo" | "practice" | "quiz" | "result">("intro");
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
    const hasPractice = guide?.kind === "type" && !!guide.practice;
    const steps = guide
      ? [
          { t: guide.kind === "mixed" ? "Bảng nhận diện dạng" : "Cách làm dạng này", d: "đọc khoảng 30 giây" },
          { t: "Xem ví dụ mẫu", d: "1 câu, GV làm từng bước" },
          ...(hasPractice ? [{ t: "Làm thử", d: "1 câu có gợi ý, không tính điểm" }] : []),
          { t: `Bài chính ${items.length} câu`, d: `tính điểm, đạt từ ${P7Q_PASS}%` },
        ]
      : null;
    return (
      <div style={shell}>
        {back}
        <h1 style={{ fontSize: FS.lg, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.4rem" }}>{title}</h1>
        <p style={{ fontSize: FS.sm, color: "var(--text-muted)", margin: "0 0 1.25rem" }}>
          {items.length} câu · {hasType ? "4 bước" : "3 bước"} mỗi câu · đạt từ {P7Q_PASS}%
          {best ? ` · điểm cao nhất ${best.score}%` : ""}
        </p>
        {steps && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {steps.map((x, k) => (
              <div key={x.t} style={{ flex: "1 1 150px", padding: "0.6rem 0.8rem", borderRadius: 10, border: `1px solid ${k === 0 ? "var(--accent-primary)" : "var(--border)"}`, background: k === 0 ? "var(--bg-elevated)" : "transparent" }}>
                <div style={{ fontSize: FS.xs, fontWeight: 800, color: "var(--accent-primary)" }}>{["①", "②", "③", "④"][k]} {x.t}</div>
                <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginTop: 2 }}>{x.d}</div>
              </div>
            ))}
          </div>
        )}
        {guide && <StepHeading n={1} label="①" text={guide.kind === "mixed" ? "Bảng nhận diện dạng" : "Cách làm dạng này"} />}
        {card && <StrategyCard card={card} />}
        {guide?.kind === "type" && guide.advancedNote && (
          <div style={{ padding: "0.75rem 1rem", borderRadius: 10, border: "2px solid var(--accent-yellow)", background: "rgba(245,158,11,.1)", fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
            <strong>Lưu ý bài Nâng cao:</strong> {guide.advancedNote}
          </div>
        )}
        {guide?.kind === "mixed" && <MixedTable rows={guide.table} />}
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
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {guide ? (
            <>
              <button type="button" onClick={() => setScreen("demo")} style={primaryBtn}>Xem ví dụ mẫu →</button>
              <button type="button" onClick={() => setScreen("quiz")} style={ghostBtn}>Bỏ qua, làm luôn</button>
            </>
          ) : (
            <button type="button" onClick={() => setScreen("quiz")} style={primaryBtn}>Bắt đầu →</button>
          )}
        </div>
      </div>
    );
  }

  // ── Ví dụ mẫu ──
  if (screen === "demo" && guide) {
    const hasPractice = guide.kind === "type" && !!guide.practice;
    return (
      <div style={shell}>
        {back}
        <GuideHeader title={title} tag="② Ví dụ mẫu" sub="GV làm mẫu từng bước. Đọc phần 💭 Nghĩ thế nào ở mỗi bước rồi bấm Tiếp." />
        <DemoWalkthrough
          demo={guide.example}
          doneLabel={hasPractice ? "Làm thử câu tương tự →" : `Bắt đầu bài chính (${items.length} câu) →`}
          onDone={() => { window.scrollTo({ top: 0 }); setScreen(hasPractice ? "practice" : "quiz"); }}
        />
      </div>
    );
  }

  // ── Làm thử ──
  if (screen === "practice" && guide?.kind === "type" && guide.practice) {
    return (
      <div style={shell}>
        {back}
        <GuideHeader title={title} tag="③ Làm thử · không tính điểm" sub="Tự làm từng bước. Bí thì bấm 💡 Gợi ý (2 nấc): nấc 1 gợi cách nghĩ, nấc 2 gợi sát đáp án." />
        <PracticeRunner
          demo={guide.practice}
          doneLabel={`Bắt đầu bài chính (${items.length} câu) →`}
          onDone={() => { window.scrollTo({ top: 0 }); setScreen("quiz"); }}
        />
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
  const expected = <PromptView tokens={tokens} size={FS.lg} />;
  const stepNo = stepIdx + 1;

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
              {i + 1}. {s === "can-cu" ? "Căn cứ" : s === "dich" && item.context ? "Nghĩa của từ" : s === "dich" && item.stem ? "Dịch câu cho sẵn" : STEP_LABEL[s]}
            </span>
          );
        })}
      </div>

      {(card || guide) && (
        <div style={{ marginBottom: "0.9rem" }}>
          <button type="button" onClick={() => setShowCard((v) => !v)} style={{ ...linkBtn }}>
            {showCard ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {guide ? "Hướng dẫn & ví dụ mẫu" : "Thẻ chiến lược"}
          </button>
          {showCard && (
            <div style={{ marginTop: "0.5rem", padding: "0.9rem", borderRadius: 12, border: "1px dashed var(--border)" }}>
              {card && <StrategyCard card={card} />}
              {guide?.kind === "mixed" && <MixedTable rows={guide.table} />}
              {guide && (
                <>
                  <div style={{ ...label, marginBottom: "0.6rem" }}>Ví dụ mẫu</div>
                  <DemoWalkthrough demo={guide.example} doneLabel="Đóng ví dụ" onDone={() => setShowCard(false)} />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {item.stem && (
        <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginBottom: "0.75rem", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text-secondary)" }}>Câu hỏi:</strong> {item.stem}
        </div>
      )}

      {step === "dich" && (
        <TranslateStep n={stepNo} item={item} choice={choice} onChoose={(i, ok) => { setChoice(i); record("dich", ok); }} />
      )}

      {step === "tu-khoa" && (
        <KeywordStep
          n={stepNo}
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
          n={stepNo}
          prompt={expected}
          question="Câu hỏi này thuộc dạng nào?"
          options={item.typeOptions.map((t) => ({ main: P7Q_TYPES[t].name, sub: P7Q_TYPES[t].signal, short: P7Q_TYPES[t].name }))}
          correctIdx={item.typeOptions.indexOf(item.type)}
          choice={choice}
          why={item.typeWhy ?? ""}
          onChoose={(i) => { setChoice(i); record("dang", i === item.typeOptions!.indexOf(item.type)); }}
        />
      )}

      {step === "chien-luoc" && (
        <ChoiceStep
          n={stepNo}
          prompt={expected}
          question="Nên đọc bài theo cách nào?"
          options={item.strategy.options.map((s) => ({ main: `${s} · ${STRATEGIES[s]}`, short: s }))}
          correctIdx={item.strategy.options.indexOf(item.strategy.correct)}
          choice={choice}
          why={item.strategy.why}
          onChoose={(i) => { setChoice(i); record("chien-luoc", item.strategy.options[i] === item.strategy.correct); }}
        />
      )}

      {step === "can-cu" && <EvidenceStep n={stepNo} item={item} prompt={expected} />}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <button type="button" onClick={next} disabled={!answered} style={{ ...primaryBtn, opacity: answered ? 1 : 0.45, cursor: answered ? "pointer" : "not-allowed" }}>
          {isLast ? "Xem kết quả" : stepIdx === steps.length - 1 ? "Câu tiếp →" : "Tiếp →"}
        </button>
      </div>
    </div>
  );
}

// ── Steps ────────────────────────────────────────────────────────────────────

function TranslateStep({ n, item, choice, onChoose, reveal = false }: {
  n: number;
  item: P7QItem;
  choice: number | null;
  onChoose: (i: number, ok: boolean) => void;
  /** Ví dụ mẫu: hiện sẵn đáp án, không cho chọn */
  reveal?: boolean;
}) {
  const done = reveal || choice !== null;
  const options = useMemo(
    () => seededShuffle<{ text: string; error?: TransError; why?: string }>([{ text: item.vi }, ...item.wrong], item.id),
    [item],
  );
  return (
    <>
      <QuestionBox label={item.stem ? "Câu cho sẵn" : "Câu hỏi"}>
        <div style={{ fontSize: FS.lg, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.55 }}>{plainPrompt(item.prompt)}</div>
        {item.context && (
          <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px dashed var(--border)" }}>
            <div style={label}>{item.context.label}</div>
            <HighlightText text={item.context.text} />
          </div>
        )}
      </QuestionBox>
      <StepHeading n={n} text={item.transLabel ?? "Chọn bản dịch đúng"} />
      <div data-p7q="dich" style={{ display: "grid", gap: "0.6rem" }}>
        {options.map((o, i) => {
          const isRight = !o.error;
          return (
            <OptionButton key={i} done={done} isRight={isRight} chosen={!reveal && choice === i} onClick={() => onChoose(i, isRight)} dimTo={reveal ? 0.8 : 0.45}>
              <div>{o.text}</div>
              {done && o.error && (
                <div style={{ fontSize: FS.xs, color: "var(--text-secondary)", marginTop: "0.35rem", lineHeight: 1.55, fontWeight: 400 }}>
                  <strong style={{ color: choice === i ? "var(--accent-red)" : "var(--text-primary)" }}>{TRANS_ERROR_LABEL[o.error]}:</strong> {o.why}
                </div>
              )}
            </OptionButton>
          );
        })}
      </div>
      {!reveal && choice !== null && (
        <ResultBox ok={!options[choice].error} title={!options[choice].error ? "Chính xác!" : `Chưa đúng — lỗi ${TRANS_ERROR_LABEL[options[choice].error!].toLowerCase()}`}>
          {!options[choice].error ? "Bạn đã hiểu đúng câu hỏi." : "Xem bản dịch đúng (màu xanh) và lý do ở từng bản dịch sai."}
        </ResultBox>
      )}
    </>
  );
}

function KeywordStep({ n, item, tokens, picked, brush, checked, onBrush, onToggle, onCheck }: {
  n: number;
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
  const count = (k: string) => result?.marks.filter((m) => m === k).length ?? 0;
  const problems = [
    count("missed") && `thiếu ${count("missed")} từ`,
    count("wrong") && `sai màu ${count("wrong")} từ`,
    count("extra") && `thừa ${count("extra")} từ`,
  ].filter(Boolean).join(", ");
  return (
    <>
      <StepHeading n={n} text={item.stem ? "Tô từ móc nối trong câu cho sẵn" : "Tô từ khoá 3 lớp"} />
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
        <div data-p7q="tokens" style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem 0.25rem", lineHeight: 1.4 }}>
          {tokens.map((t, i) => {
            const p = picked[i];
            const mark = result?.marks[i];
            return (
              <button
                key={i}
                type="button"
                onClick={() => onToggle(i)}
                aria-disabled={checked}
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
                  outline: mark === "wrong" || mark === "extra" ? "2.5px solid var(--accent-red)" : mark === "missed" ? "2.5px dashed var(--accent-red)" : "none",
                  outlineOffset: 1,
                  textDecoration: mark === "extra" ? "line-through" : "none",
                }}
              >
                {t.text}
                {mark === "right" && <span style={{ color: "var(--accent-green)", fontSize: FS.xs, fontWeight: 800, marginLeft: 3 }}>✔</span>}
                {(mark === "wrong" || mark === "missed" || mark === "extra") && <span style={{ color: "var(--accent-red)", fontSize: FS.xs, fontWeight: 800, marginLeft: 3 }}>✘</span>}
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
          <ResultBox ok={result!.ok} title={result!.ok ? (problems ? `Đạt! (${problems})` : "Đạt!") : `Chưa đạt — ${problems}`}>
            ✔ = tô đúng · viền đỏ liền = tô sai màu / tô thừa · viền đỏ đứt = bỏ sót. Cho phép thừa tối đa 1 từ.
          </ResultBox>
          <Box style={{ marginTop: "0.75rem" }}>
            <div style={label}>Đáp án</div>
            <PromptView tokens={tokens} />
            <p style={{ fontSize: FS.xs, color: "var(--text-secondary)", margin: "0.6rem 0 0", lineHeight: 1.6 }}>{item.kwNote}</p>
          </Box>
        </>
      )}
    </>
  );
}

function ChoiceStep({ n, prompt, question, options, correctIdx, choice, why, onChoose, reveal = false }: {
  reveal?: boolean;
  n: number;
  prompt: ReactNode;
  question: string;
  options: { main: string; sub?: string; short: string }[];
  correctIdx: number;
  choice: number | null;
  why: string;
  onChoose: (i: number) => void;
}) {
  const done = reveal || choice !== null;
  return (
    <>
      <QuestionBox>{prompt}</QuestionBox>
      <StepHeading n={n} text={question} />
      <div data-p7q="choice" style={{ display: "grid", gap: "0.6rem" }}>
        {options.map((o, i) => (
          <OptionButton key={i} done={done} isRight={i === correctIdx} chosen={!reveal && choice === i} onClick={() => onChoose(i)}>
            <div>{o.main}</div>
            {o.sub && <div style={{ fontSize: FS.xs, color: "var(--text-secondary)", marginTop: 2, fontWeight: 400 }}>{o.sub}</div>}
          </OptionButton>
        ))}
      </div>
      {done && !reveal && (
        <ResultBox ok={choice === correctIdx} title={choice === correctIdx ? "Chính xác!" : `Chưa đúng — đáp án là ${options[correctIdx].short}`}>
          {why}
        </ResultBox>
      )}
    </>
  );
}

/** Văn bản có `==…==` tô sáng; ` ‖ ` ngắt sang đoạn / văn bản khác. */
function HighlightText({ text }: { text: string }) {
  const parts = text.split(/==(.+?)==/g);
  return (
    <span style={{ fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.75 }}>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} style={{ background: "rgba(245,158,11,.28)", color: "inherit", padding: "0 2px", borderRadius: 3 }}>{p}</mark>
        ) : (
          <span key={i}>{p.split(" ‖ ").map((s, j) => (j ? [<br key={`b${j}`} />, <br key={`c${j}`} />, s] : s))}</span>
        ),
      )}
    </span>
  );
}

function EvidenceStep({ n, item, prompt }: { n: number; item: P7QItem; prompt: ReactNode }) {
  return (
    <>
      <QuestionBox>{prompt}</QuestionBox>
      <StepHeading n={n} text="Xem căn cứ trong bài" />
      <Box>
        <div style={label}>Căn cứ trong bài · {item.evidence.doc}</div>
        <blockquote style={{ margin: 0, padding: "0.6rem 0.9rem", borderLeft: "3px solid var(--accent-primary)", background: "var(--bg-secondary)", borderRadius: 6, fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.75 }}>
          <HighlightText text={item.evidence.excerpt} />
        </blockquote>
        <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", margin: "0.75rem 0 0", lineHeight: 1.65 }}>{item.evidence.note}</p>
      </Box>
    </>
  );
}

// ── Hướng dẫn: ví dụ mẫu & làm thử ──────────────────────────────────────────

const DEMO_STEP_LABEL: Record<DemoStep, string> = {
  dich: "Dịch",
  "tu-khoa": "Từ khoá",
  dang: "Dạng câu",
  "chien-luoc": "Chiến lược",
  "ap-dung": "Áp dụng vào bài",
};

function demoSteps(demo: P7QDemo): DemoStep[] {
  return demo.item.typeOptions
    ? ["dich", "tu-khoa", "dang", "chien-luoc", "ap-dung"]
    : ["dich", "tu-khoa", "chien-luoc", "ap-dung"];
}

function GuideHeader({ title, tag, sub }: { title: string; tag: string; sub: string }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: FS.sm, fontWeight: 700, color: "var(--text-primary)" }}>{title}</span>
        <span style={{ fontSize: FS.xs, fontWeight: 800, padding: "2px 9px", borderRadius: 99, background: "var(--accent-yellow)", color: "#fff" }}>{tag}</span>
      </div>
      <p style={{ fontSize: FS.xs, color: "var(--text-muted)", margin: "0.35rem 0 0", lineHeight: 1.6 }}>{sub}</p>
    </div>
  );
}

function StepPills({ steps, idx }: { steps: DemoStep[]; idx: number }) {
  return (
    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "1rem" }}>
      {steps.map((s, i) => (
        <span key={s} style={{
          fontSize: FS.xs,
          fontWeight: i === idx ? 700 : 500,
          padding: "3px 10px",
          borderRadius: 99,
          border: `1px solid ${i === idx ? "var(--accent-primary)" : "var(--border)"}`,
          color: i < idx ? "var(--accent-green)" : i === idx ? "var(--accent-primary)" : "var(--text-muted)",
        }}>
          {i + 1}. {DEMO_STEP_LABEL[s]}
        </span>
      ))}
    </div>
  );
}

function ThinkBox({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <div style={{ marginTop: "1rem", padding: "0.8rem 1rem", borderRadius: 10, background: "rgba(245,158,11,.1)", borderLeft: "5px solid var(--accent-yellow)" }}>
      <div style={{ fontSize: FS.sm, fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>💭 Nghĩ thế nào</div>
      <div style={{ fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.65 }}>{text}</div>
    </div>
  );
}

function HintBox({ hints, level, onMore }: { hints?: [string, string]; level: number; onMore: () => void }) {
  if (!hints) return null;
  return (
    <div style={{ marginTop: "0.9rem" }}>
      {level < 2 && (
        <button type="button" onClick={onMore} style={{ ...ghostBtn, borderColor: "var(--accent-yellow)", color: "var(--text-primary)", fontSize: FS.xs, padding: "0.4rem 0.8rem" }}>
          💡 Gợi ý ({level + 1}/2)
        </button>
      )}
      {hints.slice(0, level).map((h, i) => (
        <div key={i} style={{ marginTop: "0.5rem", padding: "0.6rem 0.9rem", borderRadius: 8, background: "rgba(245,158,11,.1)", fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.6 }}>
          <strong>💡 Gợi ý {i + 1}:</strong> {h}
        </div>
      ))}
    </div>
  );
}

function MixedTable({ rows }: { rows: { signal: string; type: P7QType; strategy: string }[] }) {
  return (
    <Box style={{ marginBottom: "1.25rem", overflowX: "auto" }}>
      <div style={label}>Nhìn từ nào → dạng nào → chiến lược nào</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FS.xs }}>
        <tbody>
          {rows.map((r) => (
            <tr key={r.type} style={{ borderTop: "1px solid var(--border)" }}>
              <td style={{ padding: "0.45rem 0.5rem 0.45rem 0", color: "var(--text-primary)" }}>{r.signal}</td>
              <td style={{ padding: "0.45rem 0.5rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>{P7Q_TYPES[r.type].name}</td>
              <td style={{ padding: "0.45rem 0", color: "var(--accent-primary)", fontWeight: 700, whiteSpace: "nowrap" }}>{r.strategy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

/** Bước Áp dụng: đoạn trích + 4 phương án A–D. Căn cứ chỉ tô sáng sau khi trả lời. */
function ApplyStep({ n, demo, choice, reveal = false, onChoose }: {
  n: number;
  demo: P7QDemo;
  choice: ABCD | null;
  reveal?: boolean;
  onChoose: (k: ABCD) => void;
}) {
  const done = reveal || choice !== null;
  const text = done ? demo.passage.text : demo.passage.text.replace(/==/g, "");
  const item = demo.item;
  return (
    <>
      <StepHeading n={n} text="Áp dụng vào bài: chọn đáp án" />
      <Box style={{ marginBottom: "0.9rem" }}>
        <div style={label}>
          Đoạn trích · {demo.passage.doc}
          {demo.invented && <span style={{ textTransform: "none", fontWeight: 600 }}> (đoạn minh hoạ, không phải đề thật)</span>}
        </div>
        <blockquote style={{ margin: 0, padding: "0.6rem 0.9rem", borderLeft: "3px solid var(--accent-primary)", background: "var(--bg-secondary)", borderRadius: 6 }}>
          <HighlightText text={text} />
        </blockquote>
      </Box>
      <div style={{ fontSize: FS.sm, fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.6rem", lineHeight: 1.55 }}>
        {item.stem ? <>{item.stem} <span style={{ fontWeight: 600 }}>“{plainPrompt(item.prompt)}”</span></> : plainPrompt(item.prompt)}
      </div>
      <div data-p7q="apply" style={{ display: "grid", gap: "0.6rem" }}>
        {(["A", "B", "C", "D"] as ABCD[]).map((k) => (
          <OptionButton key={k} done={done} isRight={k === demo.answer} chosen={!reveal && choice === k} onClick={() => onChoose(k)} dimTo={0.8}>
            <div><strong>({k})</strong> {demo.options[k]}</div>
            {done && <div style={{ fontSize: FS.xs, color: "var(--text-secondary)", marginTop: "0.3rem", fontWeight: 400, lineHeight: 1.55 }}>{demo.optionWhy[k]}</div>}
          </OptionButton>
        ))}
      </div>
      {!reveal && choice !== null && (
        <ResultBox ok={choice === demo.answer} title={choice === demo.answer ? "Chính xác!" : `Chưa đúng — đáp án là (${demo.answer})`}>
          {demo.optionWhy[demo.answer]}
        </ResultBox>
      )}
    </>
  );
}

/** Ví dụ mẫu: hiện sẵn đáp án từng bước + "Nghĩ thế nào", bấm Tiếp / Trước. */
function DemoWalkthrough({ demo, doneLabel, onDone }: { demo: P7QDemo; doneLabel: string; onDone: () => void }) {
  const steps = demoSteps(demo);
  const [i, setI] = useState(0);
  const step = steps[i];
  const item = demo.item;
  const tokens = useMemo(() => parsePrompt(item.prompt), [item.prompt]);
  const expected = <PromptView tokens={tokens} size={FS.lg} />;
  const noop = () => {};
  return (
    <div>
      <StepPills steps={steps} idx={i} />
      {item.stem && (
        <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginBottom: "0.75rem", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text-secondary)" }}>Câu hỏi:</strong> {item.stem}
        </div>
      )}
      {step === "dich" && <TranslateStep n={i + 1} item={item} choice={null} onChoose={noop} reveal />}
      {step === "tu-khoa" && (
        <>
          <StepHeading n={i + 1} text={item.stem ? "Tô từ móc nối trong câu cho sẵn" : "Tô từ khoá 3 lớp"} />
          <QuestionBox label="Tô mẫu">
            {expected}
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
              <Chip layer="q" /> <Chip layer="t" /> <Chip layer="c" />
            </div>
          </QuestionBox>
        </>
      )}
      {step === "dang" && item.typeOptions && (
        <ChoiceStep
          reveal
          n={i + 1}
          prompt={expected}
          question="Câu hỏi này thuộc dạng nào?"
          options={item.typeOptions.map((t) => ({ main: P7Q_TYPES[t].name, sub: P7Q_TYPES[t].signal, short: P7Q_TYPES[t].name }))}
          correctIdx={item.typeOptions.indexOf(item.type)}
          choice={null}
          why=""
          onChoose={noop}
        />
      )}
      {step === "chien-luoc" && (
        <ChoiceStep
          reveal
          n={i + 1}
          prompt={expected}
          question="Nên đọc bài theo cách nào?"
          options={item.strategy.options.map((s) => ({ main: `${s} · ${STRATEGIES[s]}`, short: s }))}
          correctIdx={item.strategy.options.indexOf(item.strategy.correct)}
          choice={null}
          why=""
          onChoose={noop}
        />
      )}
      {step === "ap-dung" && <ApplyStep n={i + 1} demo={demo} choice={null} reveal onChoose={noop} />}
      <ThinkBox text={demo.think?.[step] ?? (step === "tu-khoa" ? item.kwNote : step === "chien-luoc" ? item.strategy.why : undefined)} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
        <button type="button" onClick={() => setI(i - 1)} disabled={i === 0} style={{ ...ghostBtn, opacity: i === 0 ? 0.35 : 1 }}>← Trước</button>
        {i < steps.length - 1 ? (
          <button type="button" onClick={() => setI(i + 1)} style={primaryBtn}>Tiếp →</button>
        ) : (
          <button type="button" onClick={onDone} style={primaryBtn}>{doneLabel}</button>
        )}
      </div>
    </div>
  );
}

/** Câu làm thử: HV tự làm từng bước, có gợi ý 2 nấc, không tính điểm. */
function PracticeRunner({ demo, doneLabel, onDone }: { demo: P7QDemo; doneLabel: string; onDone: () => void }) {
  const steps = demoSteps(demo);
  const item = demo.item;
  const tokens = useMemo(() => parsePrompt(item.prompt), [item.prompt]);
  const [i, setI] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [pick, setPick] = useState<ABCD | null>(null);
  const [picked, setPicked] = useState<(KwLayer | null)[]>(() => tokens.map(() => null));
  const [brush, setBrush] = useState<KwLayer | "erase">("q");
  const [kwChecked, setKwChecked] = useState(false);
  const [hintLv, setHintLv] = useState(0);
  const step = steps[i];
  const expected = <PromptView tokens={tokens} size={FS.lg} />;
  const answered = step === "tu-khoa" ? kwChecked : step === "ap-dung" ? pick !== null : choice !== null;

  const next = () => {
    setChoice(null);
    setKwChecked(false);
    setHintLv(0);
    if (i < steps.length - 1) setI(i + 1);
    else onDone();
  };

  return (
    <div>
      <StepPills steps={steps} idx={i} />
      {item.stem && (
        <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginBottom: "0.75rem", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text-secondary)" }}>Câu hỏi:</strong> {item.stem}
        </div>
      )}
      {step === "dich" && <TranslateStep n={i + 1} item={item} choice={choice} onChoose={(k) => setChoice(k)} />}
      {step === "tu-khoa" && (
        <KeywordStep
          n={i + 1}
          item={item}
          tokens={tokens}
          picked={picked}
          brush={brush}
          checked={kwChecked}
          onBrush={setBrush}
          onToggle={(k) => {
            if (kwChecked) return;
            setPicked((p) => {
              const n = [...p];
              n[k] = brush === "erase" || n[k] === brush ? null : brush;
              return n;
            });
          }}
          onCheck={() => setKwChecked(true)}
        />
      )}
      {step === "dang" && item.typeOptions && (
        <ChoiceStep
          n={i + 1}
          prompt={expected}
          question="Câu hỏi này thuộc dạng nào?"
          options={item.typeOptions.map((t) => ({ main: P7Q_TYPES[t].name, sub: P7Q_TYPES[t].signal, short: P7Q_TYPES[t].name }))}
          correctIdx={item.typeOptions.indexOf(item.type)}
          choice={choice}
          why={item.typeWhy ?? ""}
          onChoose={(k) => setChoice(k)}
        />
      )}
      {step === "chien-luoc" && (
        <ChoiceStep
          n={i + 1}
          prompt={expected}
          question="Nên đọc bài theo cách nào?"
          options={item.strategy.options.map((s) => ({ main: `${s} · ${STRATEGIES[s]}`, short: s }))}
          correctIdx={item.strategy.options.indexOf(item.strategy.correct)}
          choice={choice}
          why={item.strategy.why}
          onChoose={(k) => setChoice(k)}
        />
      )}
      {step === "ap-dung" && <ApplyStep n={i + 1} demo={demo} choice={pick} onChoose={(k) => setPick(k)} />}
      {!answered && <HintBox key={step} hints={demo.hints?.[step]} level={hintLv} onMore={() => setHintLv((l) => l + 1)} />}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <button type="button" onClick={next} disabled={!answered} style={{ ...primaryBtn, opacity: answered ? 1 : 0.45, cursor: answered ? "pointer" : "not-allowed" }}>
          {i < steps.length - 1 ? "Tiếp →" : doneLabel}
        </button>
      </div>
    </div>
  );
}

// ── Bits ─────────────────────────────────────────────────────────────────────

/** Câu hỏi tô màu theo đáp án; từ không bắt buộc gạch chân chấm. */
function PromptView({ tokens, size = FS.md }: { tokens: Token[]; size?: string }) {
  return (
    <div style={{ fontSize: size, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.9 }}>
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

function Box({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, padding: "0.9rem 1rem", ...style }}>
      {children}
    </div>
  );
}

/** Nhãn "BƯỚC n" + yêu cầu của bước, chữ lớn. */
function StepHeading({ n, text, label: lb }: { n: number; text: string; label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", margin: "0 0 0.75rem" }}>
      <span style={{ fontSize: FS.xs, fontWeight: 800, letterSpacing: "0.06em", padding: "3px 9px", borderRadius: 6, background: "var(--accent-primary)", color: "#fff" }}>
        {lb ?? `BƯỚC ${n}`}
      </span>
      <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>{text}</span>
    </div>
  );
}

/** Khung câu hỏi: chữ lớn, viền trái màu chủ đạo. */
function QuestionBox({ label: lb, children }: { label?: string; children: ReactNode }) {
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderLeft: "5px solid var(--accent-primary)", borderRadius: 12, padding: "0.9rem 1.1rem", marginBottom: "1.25rem" }}>
      {lb && <div style={label}>{lb}</div>}
      {children}
    </div>
  );
}

/**
 * Phương án trắc nghiệm. Không dùng thuộc tính `disabled` vì trình duyệt sẽ làm
 * xám chữ; sau khi chọn thì chặn click bằng code.
 */
function OptionButton({ done, isRight, chosen, onClick, children, dimTo = 0.45 }: {
  /** Độ mờ của các phương án không chọn / không đúng sau khi trả lời */
  dimTo?: number;
  done: boolean;
  isRight: boolean;
  chosen: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const right = done && isRight;
  const wrongPick = done && chosen && !isRight;
  const dim = done && !right && !wrongPick;
  return (
    <button
      type="button"
      aria-disabled={done}
      onClick={() => { if (!done) onClick(); }}
      style={{
        textAlign: "left",
        width: "100%",
        fontSize: FS.sm,
        lineHeight: 1.55,
        fontWeight: right || wrongPick ? 600 : 500,
        padding: "0.75rem 0.95rem",
        borderRadius: 10,
        color: "var(--text-primary)",
        background: right ? "rgba(16,185,129,.2)" : wrongPick ? "rgba(239,68,68,.16)" : "var(--bg-elevated)",
        border: `${right || wrongPick ? 2.5 : 1.5}px solid ${right ? "var(--accent-green)" : wrongPick ? "var(--accent-red)" : "var(--border)"}`,
        boxShadow: right ? "0 0 0 3px rgba(16,185,129,.15)" : wrongPick ? "0 0 0 3px rgba(239,68,68,.12)" : "none",
        opacity: dim ? dimTo : 1,
        cursor: done ? "default" : "pointer",
        display: "flex",
        gap: "0.6rem",
        alignItems: "flex-start",
      }}
    >
      {right && <CheckCircle2 size={19} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: 2 }} />}
      {wrongPick && <XCircle size={19} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 2 }} />}
      <div style={{ flex: 1 }}>{children}</div>
      {(right || wrongPick) && (
        <span style={{
          flexShrink: 0,
          alignSelf: "center",
          fontSize: FS.xs,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 99,
          color: "#fff",
          background: right ? "var(--accent-green)" : "var(--accent-red)",
          whiteSpace: "nowrap",
        }}>
          {right ? (chosen ? "Bạn chọn đúng" : "Đáp án đúng") : "Bạn chọn"}
        </span>
      )}
    </button>
  );
}

/** Hộp kết quả sau khi trả lời: tiêu đề Đúng / Chưa đúng + giải thích. */
function ResultBox({ ok, title, children }: { ok: boolean; title: string; children: ReactNode }) {
  return (
    <div style={{
      marginTop: "0.9rem",
      padding: "0.8rem 1rem",
      borderRadius: 10,
      background: ok ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.1)",
      border: `2px solid ${ok ? "var(--accent-green)" : "var(--accent-red)"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: FS.md, fontWeight: 800, color: ok ? "var(--accent-green)" : "var(--accent-red)", marginBottom: "0.3rem" }}>
        {ok ? <CheckCircle2 size={19} /> : <XCircle size={19} />} {title}
      </div>
      <div style={{ fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.6 }}>{children}</div>
    </div>
  );
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
