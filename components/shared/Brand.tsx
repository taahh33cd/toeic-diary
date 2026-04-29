import Link from "next/link";

interface BrandProps {
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Link destination — defaults to "/" */
  href?: string;
  /** Extra className on wrapper */
  className?: string;
}

const sizes = {
  sm: { text: "text-base", sup: "text-[10px]", gap: "gap-1.5", icon: "w-6 h-6 text-xs" },
  md: { text: "text-xl",   sup: "text-xs",     gap: "gap-2",   icon: "w-8 h-8 text-sm" },
  lg: { text: "text-2xl",  sup: "text-sm",     gap: "gap-2.5", icon: "w-10 h-10 text-base" },
};

/**
 * Brand logo — "Anh Hiếu²"
 * Uses warm beige / terracotta palette that works on all 3 themes.
 */
export function Brand({ size = "md", href = "/", className = "" }: BrandProps) {
  const s = sizes[size];

  return (
    <Link
      href={href}
      className={`inline-flex items-center ${s.gap} no-underline group ${className}`}
      aria-label="mytoeicdiary — Anh Hiếu²"
    >
      {/* Icon badge */}
      <span
        className={`${s.icon} flex items-center justify-center rounded-lg font-bold shrink-0`}
        style={{
          background: "linear-gradient(135deg, #C4622D 0%, #E8885C 100%)",
          color: "#FBF7F2",
          boxShadow: "0 2px 8px rgba(196,98,45,0.35)",
        }}
        aria-hidden="true"
      >
        H²
      </span>

      {/* Word mark */}
      <span
        className={`${s.text} font-bold leading-none tracking-tight`}
        style={{ color: "var(--text-primary, #2C1E0F)" }}
      >
        Anh Hiếu
        <sup
          className={`${s.sup} font-bold ml-0.5 align-super`}
          style={{ color: "#C4622D" }}
        >
          ²
        </sup>
      </span>
    </Link>
  );
}
