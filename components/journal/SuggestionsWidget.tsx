import Link from "next/link";
import { getSmartSuggestions } from "@/app/actions/getSmartSuggestions";

export async function SuggestionsWidget() {
  const suggestions = await getSmartSuggestions();
  if (suggestions.length === 0) return null;

  return (
    <section
      className="rounded-2xl p-5"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <h2 className="text-base font-semibold tracking-tight mb-3">
        💡 Hôm nay học gì?
      </h2>
      <ul className="space-y-2">
        {suggestions.map((s, i) => (
          <li key={i}>
            <Link
              href={s.href}
              className="flex items-start gap-3 rounded-lg p-3 transition"
              style={{ background: "var(--bg-primary)" }}
            >
              <span className="text-xl shrink-0 leading-none mt-0.5">{s.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{s.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {s.desc}
                </div>
              </div>
              <span className="shrink-0 text-sm" style={{ color: "var(--text-secondary)" }}>
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
