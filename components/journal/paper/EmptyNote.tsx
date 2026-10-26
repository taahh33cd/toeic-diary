import Link from "next/link";

/**
 * Ô trống biết dạy việc: thay vì "Chưa có dữ liệu", nói rõ mục này để làm gì
 * và một việc cụ thể để bắt đầu. Khung nét đứt như chỗ chừa trống trong sổ.
 */
export function EmptyNote({
  icon,
  title,
  hint,
  actionLabel,
  actionHref,
  className = "",
}: {
  icon: string;
  title: string;
  hint?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center text-center px-4 py-6 ${className}`.trim()}
      style={{ border: "1px dashed var(--border)", background: "var(--bg-primary)" }}
    >
      <span className="text-2xl mb-2 opacity-60" aria-hidden="true">{icon}</span>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </p>
      {hint && (
        <p className="text-xs mt-1 max-w-[42ch]" style={{ color: "var(--text-secondary)" }}>
          {hint}
        </p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="paper-btn paper-btn--ghost paper-btn--sm mt-3">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
