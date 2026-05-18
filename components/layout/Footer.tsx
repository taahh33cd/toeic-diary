export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] py-5 px-4">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
        <div>© 2026 TOEIC Dictation Master</div>
        <div className="text-center">
          Audio và nội dung thuộc bản quyền của ETS. Ứng dụng chỉ dùng cho mục đích học tập cá nhân.
        </div>
        <div>v1.0 MVP</div>
      </div>
    </footer>
  );
}
