/**
 * Tiêu đề mục trong sổ: chữ viết tay + gạch chân bút dạ,
 * kèm chỗ trống bên phải cho nút/bộ lọc của từng trang.
 */

type PageHeadingProps = {
  title: string;
  /** Dòng phụ nhỏ dưới tiêu đề — mô tả hoặc ngày. */
  note?: string;
  /** Nút / bộ lọc đặt bên phải, cùng dòng với tiêu đề. */
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeading({ title, note, actions, className = "" }: PageHeadingProps) {
  return (
    <div className={`flex items-end justify-between gap-4 flex-wrap mb-4 ${className}`.trim()}>
      <div>
        <h1
          className="hand leading-none"
          style={{
            fontSize: "clamp(1.75rem, 1.2rem + 1.8vw, 2.35rem)",
            color: "var(--text-primary)",
            // Gạch chân như vệt bút dạ, bám theo baseline chữ viết tay
            backgroundImage:
              "linear-gradient(to top, color-mix(in srgb, var(--accent-primary) 22%, transparent) 0 .18em, transparent .18em)",
            display: "inline-block",
            paddingInline: ".08em",
          }}
        >
          {title}
        </h1>
        {note && (
          <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
            {note}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
