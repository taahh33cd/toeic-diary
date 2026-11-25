"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/homework/drafts", label: "🗓️ Nháp tuần này" },
  { href: "/admin/homework/curricula", label: "📚 Giáo trình" },
  { href: "/admin/homework/templates", label: "📋 Mẫu BTVN" },
  { href: "/admin/homework", label: "👤 Giao cho 1 HV", exact: true },
];

export default function HomeworkTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1" aria-label="Bài tập">
      {TABS.map((t) => {
        const on = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className="text-sm font-medium px-3 py-2 rounded-xl border whitespace-nowrap"
            style={
              on
                ? { background: "var(--accent-primary)", borderColor: "var(--accent-primary)", color: "#fff" }
                : { background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
