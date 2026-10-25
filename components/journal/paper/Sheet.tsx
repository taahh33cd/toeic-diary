/**
 * Tờ giấy — hộp chứa nội dung chuẩn của cuốn sổ /journal.
 *
 * Không có "use client": dùng được cả trong server component.
 * Tạo hình bằng các class trong app/globals.css (.paper-sheet*) nên tự đổi
 * theo 18 theme mà không cần truyền màu.
 */

type SheetProps = {
  children: React.ReactNode;
  className?: string;
  /** Hai tờ nhô ra phía sau — dùng cho khối chính của trang. */
  stack?: boolean;
  /** Góc gấp dưới-phải. */
  fold?: boolean;
  /** Nhấc nhẹ khi hover — chỉ dùng cho tờ bấm được. */
  lift?: boolean;
  style?: React.CSSProperties;
};

export function Sheet({
  children,
  className = "",
  stack = false,
  fold = false,
  lift = false,
  style,
}: SheetProps) {
  const variants = [
    stack && "paper-sheet--stack",
    fold && "paper-sheet--fold",
    lift && "paper-sheet--lift",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`paper-sheet ${variants} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
