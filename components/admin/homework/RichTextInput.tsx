"use client";

import { useEffect, useRef } from "react";

/** Ô mô tả có định dạng B/I/U/HL — bôi đen rồi bấm nút. */
export default function RichTextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const internalVal = useRef<string>("");

  useEffect(() => {
    if (ref.current && value !== internalVal.current) {
      ref.current.innerHTML = value;
      internalVal.current = value;
    }
  }, [value]);

  function wrap(tag: string) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!ref.current?.contains(range.commonAncestorContainer)) return;
    const wrapper = document.createElement(tag);
    try {
      range.surroundContents(wrapper);
    } catch {
      const fragment = range.extractContents();
      wrapper.appendChild(fragment);
      range.insertNode(wrapper);
    }
    sel.removeAllRanges();
    const html = ref.current!.innerHTML;
    internalVal.current = html;
    onChange(html);
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div
        className="flex gap-1 px-2 py-1"
        style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}
      >
        {[
          { tag: "b", label: "B", s: { fontWeight: 700 } },
          { tag: "i", label: "I", s: { fontStyle: "italic" } },
          { tag: "u", label: "U", s: { textDecoration: "underline" } },
          { tag: "mark", label: "HL", s: { background: "#fef08a", color: "#000", padding: "0 2px" } },
        ].map(({ tag, label, s }) => (
          <button
            key={tag}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              wrap(tag);
            }}
            className="text-[11px] px-1.5 py-0.5 rounded font-semibold"
            style={{
              border: "1px solid var(--border)",
              background: "var(--bg-primary)",
              cursor: "pointer",
              color: "var(--text-primary)",
              ...s,
            }}
          >
            {label}
          </button>
        ))}
        <span className="text-[10px] self-center ml-1" style={{ color: "var(--text-muted)" }}>
          Bôi đen → format
        </span>
      </div>
      <div style={{ position: "relative" }}>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => {
            const html = (e.currentTarget as HTMLDivElement).innerHTML;
            internalVal.current = html;
            onChange(html);
          }}
          className="w-full px-3 py-2 text-xs outline-none min-h-[3rem]"
          style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
        />
        {!value && (
          <span
            className="absolute top-2 left-3 text-xs pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          >
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
}
