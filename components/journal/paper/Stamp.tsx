/**
 * Con dấu mực — dùng cho streak / level / tuần học.
 *
 * Mục đích: đưa tín hiệu tiến bộ ra thành vật thể nhìn thấy ngay,
 * thay vì chữ nhỏ lẫn trong dòng mô tả.
 */

type Tone = "accent" | "green" | "red" | "muted";

const TONE_COLOR: Record<Tone, string> = {
  accent: "var(--accent-primary)",
  green: "var(--accent-green, #4A7C59)",
  red: "var(--accent-red, #B94040)",
  muted: "var(--text-muted)",
};

type StampProps = {
  /** Dòng to ở giữa — con số hoặc emoji. */
  value: string;
  /** Dòng nhỏ bên dưới. */
  label: string;
  tone?: Tone;
  /** Độ nghiêng (độ) — mỗi con dấu lệch một chút cho tự nhiên. */
  rotate?: number;
  title?: string;
};

export function Stamp({ value, label, tone = "accent", rotate = -6, title }: StampProps) {
  return (
    <div
      className="paper-stamp"
      style={{ color: TONE_COLOR[tone], ["--stamp-rot" as string]: `${rotate}deg` }}
      title={title}
    >
      <span className="paper-stamp__value">{value}</span>
      <span className="paper-stamp__label">{label}</span>
    </div>
  );
}
